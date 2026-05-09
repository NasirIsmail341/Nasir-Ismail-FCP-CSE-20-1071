import { streamText, tool, convertToModelMessages } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const { messages } = await req.json()
  const supabase = await createClient()

  // Search properties tool
  const searchProperties = tool({
    description: "Search for available properties based on filters like location, price, type, etc.",
    inputSchema: z.object({
      listingType: z.enum(["rent", "sale", "both"]).optional().describe("Type of listing"),
      location: z.string().optional().describe("City, neighborhood, or address"),
      propertyType: z.string().optional().describe("Type of property (apartment, house, office, etc.)"),
      propertyCategory: z.enum(["residential", "commercial", "industrial", "land"]).optional(),
      minPrice: z.number().optional().describe("Minimum price in dollars"),
      maxPrice: z.number().optional().describe("Maximum price in dollars"),
      bedrooms: z.number().optional().describe("Minimum number of bedrooms"),
      bathrooms: z.number().optional().describe("Minimum number of bathrooms"),
    }),
    execute: async (params) => {
      let query = supabase
        .from("properties")
        .select("id, title, listing_type, property_type, city, state, rent_amount, sale_price, bedrooms, bathrooms, area_sqft")
        .eq("status", "available")
        .limit(5)

      if (params.listingType === "rent") {
        query = query.in("listing_type", ["rent", "both"])
      } else if (params.listingType === "sale") {
        query = query.in("listing_type", ["sale", "both"])
      }

      if (params.location) {
        query = query.or(`city.ilike.%${params.location}%,neighborhood.ilike.%${params.location}%,address.ilike.%${params.location}%`)
      }

      if (params.propertyType) {
        query = query.eq("property_type", params.propertyType)
      }

      if (params.propertyCategory) {
        query = query.eq("property_category", params.propertyCategory)
      }

      if (params.bedrooms) {
        query = query.gte("bedrooms", params.bedrooms)
      }

      const { data, error } = await query

      if (error) {
        return { error: error.message }
      }

      return {
        properties: data?.map((p) => ({
          id: p.id,
          title: p.title,
          type: p.property_type,
          listing: p.listing_type,
          location: `${p.city}, ${p.state}`,
          price: p.sale_price ? `$${(p.sale_price / 100).toLocaleString()} (sale)` : p.rent_amount ? `$${(p.rent_amount / 100).toLocaleString()}/mo (rent)` : "Contact for price",
          beds: p.bedrooms,
          baths: p.bathrooms,
          sqft: p.area_sqft,
        })) || [],
        count: data?.length || 0,
      }
    },
  })

  // Calculate mortgage tool
  const calculateMortgage = tool({
    description: "Calculate monthly mortgage payment based on property price, down payment, interest rate, and loan term",
    inputSchema: z.object({
      propertyPrice: z.number().describe("Total property price in dollars"),
      downPaymentPercent: z.number().default(20).describe("Down payment percentage (default 20%)"),
      interestRate: z.number().default(6.5).describe("Annual interest rate (default 6.5%)"),
      loanTermYears: z.number().default(30).describe("Loan term in years (default 30)"),
    }),
    execute: async ({ propertyPrice, downPaymentPercent, interestRate, loanTermYears }) => {
      const downPayment = propertyPrice * (downPaymentPercent / 100)
      const loanAmount = propertyPrice - downPayment
      const monthlyRate = interestRate / 100 / 12
      const numPayments = loanTermYears * 12

      const monthlyPayment =
        (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
        (Math.pow(1 + monthlyRate, numPayments) - 1)

      const totalPayment = monthlyPayment * numPayments
      const totalInterest = totalPayment - loanAmount

      return {
        propertyPrice: `$${propertyPrice.toLocaleString()}`,
        downPayment: `$${downPayment.toLocaleString()} (${downPaymentPercent}%)`,
        loanAmount: `$${loanAmount.toLocaleString()}`,
        interestRate: `${interestRate}%`,
        loanTerm: `${loanTermYears} years`,
        monthlyPayment: `$${Math.round(monthlyPayment).toLocaleString()}`,
        totalInterest: `$${Math.round(totalInterest).toLocaleString()}`,
        totalPayment: `$${Math.round(totalPayment).toLocaleString()}`,
      }
    },
  })

  // Estimate price tool
  const estimatePrice = tool({
    description: "Estimate rent or sale price for a property based on its characteristics",
    inputSchema: z.object({
      listingType: z.enum(["rent", "sale"]).describe("Whether estimating rent or sale price"),
      propertyType: z.string().describe("Type of property"),
      city: z.string().describe("City location"),
      bedrooms: z.number().optional(),
      bathrooms: z.number().optional(),
      areaSqft: z.number().optional(),
    }),
    execute: async ({ listingType, propertyType, city, bedrooms, bathrooms, areaSqft }) => {
      // Get comparable properties
      let query = supabase
        .from("properties")
        .select("rent_amount, sale_price, bedrooms, bathrooms, area_sqft")
        .eq("property_type", propertyType)
        .ilike("city", `%${city}%`)
        .limit(10)

      if (listingType === "rent") {
        query = query.not("rent_amount", "is", null)
      } else {
        query = query.not("sale_price", "is", null)
      }

      const { data } = await query

      if (!data || data.length === 0) {
        // Provide estimates based on general market data
        const baseRent = bedrooms ? bedrooms * 800 + 1000 : 2000
        const baseSale = bedrooms ? bedrooms * 150000 + 200000 : 400000

        return {
          estimatedPrice: listingType === "rent" 
            ? `$${baseRent.toLocaleString()} - $${(baseRent * 1.3).toLocaleString()}/month`
            : `$${baseSale.toLocaleString()} - $${(baseSale * 1.3).toLocaleString()}`,
          confidence: "Low",
          note: "Limited comparable properties found. Estimate based on general market data.",
          comparables: 0,
        }
      }

      // Calculate average
      const prices = data.map((p) => (listingType === "rent" ? p.rent_amount : p.sale_price)).filter(Boolean) as number[]
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)

      return {
        estimatedPrice: listingType === "rent"
          ? `$${Math.round(avgPrice / 100).toLocaleString()}/month`
          : `$${Math.round(avgPrice / 100).toLocaleString()}`,
        priceRange: listingType === "rent"
          ? `$${Math.round(minPrice / 100).toLocaleString()} - $${Math.round(maxPrice / 100).toLocaleString()}/month`
          : `$${Math.round(minPrice / 100).toLocaleString()} - $${Math.round(maxPrice / 100).toLocaleString()}`,
        confidence: data.length >= 5 ? "High" : "Medium",
        comparables: data.length,
      }
    },
  })

  // Get property details tool
  const getPropertyDetails = tool({
    description: "Get detailed information about a specific property by its ID",
    inputSchema: z.object({
      propertyId: z.string().describe("The property ID"),
    }),
    execute: async ({ propertyId }) => {
      const { data, error } = await supabase
        .from("properties")
        .select("*, profiles!properties_owner_id_fkey(full_name, email, phone)")
        .eq("id", propertyId)
        .single()

      if (error || !data) {
        return { error: "Property not found" }
      }

      return {
        title: data.title,
        description: data.description,
        type: data.property_type,
        category: data.property_category,
        listing: data.listing_type,
        status: data.status,
        location: `${data.address}, ${data.city}, ${data.state || data.country}`,
        salePrice: data.sale_price ? `$${(data.sale_price / 100).toLocaleString()}` : null,
        rentAmount: data.rent_amount ? `$${(data.rent_amount / 100).toLocaleString()}/${data.rent_frequency}` : null,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        areaSqft: data.area_sqft,
        amenities: data.amenities,
        featured: data.featured,
        views: data.views_count,
      }
    },
  })

  // Calculate ROI tool
  const calculateROI = tool({
    description: "Calculate return on investment for a rental property",
    inputSchema: z.object({
      purchasePrice: z.number().describe("Purchase price in dollars"),
      monthlyRent: z.number().describe("Expected monthly rent in dollars"),
      monthlyExpenses: z.number().default(0).describe("Monthly expenses (maintenance, insurance, taxes, etc.)"),
      downPaymentPercent: z.number().default(20).describe("Down payment percentage"),
      annualAppreciation: z.number().default(3).describe("Expected annual appreciation percentage"),
    }),
    execute: async ({ purchasePrice, monthlyRent, monthlyExpenses, downPaymentPercent, annualAppreciation }) => {
      const downPayment = purchasePrice * (downPaymentPercent / 100)
      const annualRent = monthlyRent * 12
      const annualExpenses = monthlyExpenses * 12
      const netOperatingIncome = annualRent - annualExpenses
      const capRate = (netOperatingIncome / purchasePrice) * 100
      const cashOnCash = (netOperatingIncome / downPayment) * 100
      const projectedValue5Years = purchasePrice * Math.pow(1 + annualAppreciation / 100, 5)

      return {
        purchasePrice: `$${purchasePrice.toLocaleString()}`,
        downPayment: `$${downPayment.toLocaleString()}`,
        annualRent: `$${annualRent.toLocaleString()}`,
        annualExpenses: `$${annualExpenses.toLocaleString()}`,
        netOperatingIncome: `$${netOperatingIncome.toLocaleString()}`,
        capRate: `${capRate.toFixed(2)}%`,
        cashOnCashReturn: `${cashOnCash.toFixed(2)}%`,
        projectedValue5Years: `$${Math.round(projectedValue5Years).toLocaleString()}`,
        projectedEquityGain: `$${Math.round(projectedValue5Years - purchasePrice).toLocaleString()}`,
      }
    },
  })

  const result = streamText({
    model: "openai/gpt-4o-mini",
    system: `You are PropGenius, an AI property assistant helping users find, buy, sell, and rent properties. You have access to tools to search properties, calculate mortgages, estimate prices, and analyze investments.

Guidelines:
- Be helpful, friendly, and professional
- When showing property results, format them clearly with key details
- Always explain your calculations and recommendations
- If users want to schedule viewings or contact owners, guide them to use the app's messaging features
- For mortgage calculations, explain the breakdown clearly
- When estimating prices, explain the methodology and confidence level
- Proactively suggest relevant follow-up actions

Property types available: apartment, studio, penthouse, house, villa, townhouse, duplex, shop, office, warehouse, commercial_building, restaurant, hotel, land, farm, industrial, mixed_use

Categories: residential, commercial, industrial, land`,
    messages: await convertToModelMessages(messages),
    tools: {
      searchProperties,
      calculateMortgage,
      estimatePrice,
      getPropertyDetails,
      calculateROI,
    },
    maxSteps: 5,
  })

  return result.toUIMessageStreamResponse()
}
