"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { PropertyCard } from "@/components/property-card"
import { ListingTypeToggle } from "@/components/listing-type-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react"
import type { Property, PropertyType, PropertyCategory } from "@/lib/types"

const propertyTypes: { value: PropertyType; label: string }[] = [
  { value: "apartment", label: "Apartment" },
  { value: "studio", label: "Studio" },
  { value: "penthouse", label: "Penthouse" },
  { value: "house", label: "House" },
  { value: "villa", label: "Villa" },
  { value: "townhouse", label: "Townhouse" },
  { value: "duplex", label: "Duplex" },
  { value: "shop", label: "Shop" },
  { value: "office", label: "Office" },
  { value: "warehouse", label: "Warehouse" },
  { value: "commercial_building", label: "Commercial Building" },
  { value: "restaurant", label: "Restaurant" },
  { value: "hotel", label: "Hotel" },
  { value: "land", label: "Land" },
  { value: "farm", label: "Farm" },
  { value: "industrial", label: "Industrial" },
  { value: "mixed_use", label: "Mixed Use" },
]

const categories: { value: PropertyCategory; label: string }[] = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "industrial", label: "Industrial" },
  { value: "land", label: "Land" },
]

function SearchPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [listingType, setListingType] = useState<"buy" | "rent" | "all">(
    (searchParams.get("type") as "buy" | "rent" | "all") || "all"
  )
  const [category, setCategory] = useState<PropertyCategory | "">(
    (searchParams.get("category") as PropertyCategory) || ""
  )
  const [propertyType, setPropertyType] = useState<PropertyType | "">(
    (searchParams.get("propertyType") as PropertyType) || ""
  )
  const [minPrice, setMinPrice] = useState<number>(0)
  const [maxPrice, setMaxPrice] = useState<number>(10000000)
  const [bedrooms, setBedrooms] = useState<string>("")
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [filtersOpen, setFiltersOpen] = useState(false)

  const fetchProperties = useCallback(async () => {
    setLoading(true)

    let queryBuilder = supabase
      .from("properties")
      .select("*")
      .eq("status", "available")
      .order("created_at", { ascending: false })

    if (listingType === "buy") {
      queryBuilder = queryBuilder.in("listing_type", ["sale", "both"])
    } else if (listingType === "rent") {
      queryBuilder = queryBuilder.in("listing_type", ["rent", "both"])
    }

    if (category) {
      queryBuilder = queryBuilder.eq("property_category", category)
    }

    if (propertyType) {
      queryBuilder = queryBuilder.eq("property_type", propertyType)
    }

    if (bedrooms) {
      queryBuilder = queryBuilder.eq("bedrooms", parseInt(bedrooms))
    }

    if (query) {
      queryBuilder = queryBuilder.or(
        `city.ilike.%${query}%,address.ilike.%${query}%,title.ilike.%${query}%,neighborhood.ilike.%${query}%`
      )
    }

    // Price filtering based on listing type
    if (listingType === "buy" || listingType === "all") {
      if (minPrice > 0) {
        queryBuilder = queryBuilder.gte("sale_price", minPrice * 100)
      }
      if (maxPrice < 10000000) {
        queryBuilder = queryBuilder.lte("sale_price", maxPrice * 100)
      }
    }
    if (listingType === "rent") {
      if (minPrice > 0) {
        queryBuilder = queryBuilder.gte("rent_amount", minPrice * 100)
      }
      if (maxPrice < 10000000) {
        queryBuilder = queryBuilder.lte("rent_amount", maxPrice * 100)
      }
    }

    const { data } = await queryBuilder.limit(50)
    setProperties(data || [])
    setLoading(false)
  }, [supabase, listingType, category, propertyType, bedrooms, query, minPrice, maxPrice])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: userFavorites } = await supabase
          .from("favorites")
          .select("property_id")
          .eq("user_id", user.id)
        if (userFavorites) {
          setFavorites(new Set(userFavorites.map((f) => f.property_id)))
        }
      }

      fetchProperties()
    }
    init()
  }, [supabase, fetchProperties])

  const handleFavorite = async (propertyId: string) => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    if (favorites.has(propertyId)) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("property_id", propertyId)
      setFavorites((prev) => {
        const next = new Set(prev)
        next.delete(propertyId)
        return next
      })
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, property_id: propertyId })
      setFavorites((prev) => new Set(prev).add(propertyId))
    }
  }

  const clearFilters = () => {
    setCategory("")
    setPropertyType("")
    setMinPrice(0)
    setMaxPrice(10000000)
    setBedrooms("")
  }

  const hasActiveFilters = category || propertyType || minPrice > 0 || maxPrice < 10000000 || bedrooms

  return (
    <div className="flex flex-col">
      {/* Search Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-4">
        <div className="mx-auto max-w-lg space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search location..."
                className="pl-10"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchProperties()}
              />
            </div>
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <SlidersHorizontal className="h-4 w-4" />
                  {hasActiveFilters && (
                    <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-primary" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh]">
                <SheetHeader>
                  <SheetTitle className="flex items-center justify-between">
                    Filters
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Clear all
                      </Button>
                    )}
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6 overflow-y-auto pb-20">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={(v) => setCategory(v as PropertyCategory | "")}>
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Property Type</Label>
                    <Select value={propertyType} onValueChange={(v) => setPropertyType(v as PropertyType | "")}>
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        {propertyTypes.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Bedrooms</Label>
                    <Select value={bedrooms} onValueChange={setBedrooms}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        {[1, 2, 3, 4, 5].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}+ bedrooms
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <Label>
                      Price Range: ${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()}
                    </Label>
                    <Slider
                      min={0}
                      max={10000000}
                      step={50000}
                      value={[minPrice, maxPrice]}
                      onValueChange={([min, max]) => {
                        setMinPrice(min)
                        setMaxPrice(max)
                      }}
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => {
                      fetchProperties()
                      setFiltersOpen(false)
                    }}
                  >
                    Apply Filters
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex justify-center">
            <ListingTypeToggle
              value={listingType}
              onChange={(v) => {
                setListingType(v)
                setTimeout(fetchProperties, 0)
              }}
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="px-4 py-6">
        <div className="mx-auto max-w-lg">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {loading ? "Searching..." : `${properties.length} properties found`}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : properties.length > 0 ? (
            <div className="space-y-4">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onFavorite={handleFavorite}
                  isFavorited={favorites.has(property.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="font-medium text-foreground">No properties found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
              {hasActiveFilters && (
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  )
}
