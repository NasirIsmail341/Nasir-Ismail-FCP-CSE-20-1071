"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { PropertyCard } from "@/components/property-card"
import { ListingTypeToggle } from "@/components/listing-type-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Building2, Search, MapPin, Sparkles, ArrowRight, Home, Building, Store, TreePine } from "lucide-react"
import type { Property } from "@/lib/types"

const categories = [
  { icon: Home, label: "Residential", value: "residential" },
  { icon: Building, label: "Commercial", value: "commercial" },
  { icon: Store, label: "Industrial", value: "industrial" },
  { icon: TreePine, label: "Land", value: "land" },
]

export default function HomePage() {
  const [listingType, setListingType] = useState<"buy" | "rent" | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([])
  const [recentProperties, setRecentProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      // Get user
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // Build query for featured properties
      let featuredQuery = supabase
        .from("properties")
        .select("*")
        .eq("status", "available")
        .eq("featured", true)
        .limit(6)

      if (listingType === "buy") {
        featuredQuery = featuredQuery.in("listing_type", ["sale", "both"])
      } else if (listingType === "rent") {
        featuredQuery = featuredQuery.in("listing_type", ["rent", "both"])
      }

      const { data: featured } = await featuredQuery

      // Build query for recent properties
      let recentQuery = supabase
        .from("properties")
        .select("*")
        .eq("status", "available")
        .order("created_at", { ascending: false })
        .limit(10)

      if (listingType === "buy") {
        recentQuery = recentQuery.in("listing_type", ["sale", "both"])
      } else if (listingType === "rent") {
        recentQuery = recentQuery.in("listing_type", ["rent", "both"])
      }

      const { data: recent } = await recentQuery

      setFeaturedProperties(featured || [])
      setRecentProperties(recent || [])

      // Get user favorites if logged in
      if (user) {
        const { data: userFavorites } = await supabase
          .from("favorites")
          .select("property_id")
          .eq("user_id", user.id)

        if (userFavorites) {
          setFavorites(new Set(userFavorites.map((f) => f.property_id)))
        }
      }

      setLoading(false)
    }

    loadData()
  }, [listingType, supabase])

  const handleFavorite = async (propertyId: string) => {
    if (!user) {
      window.location.href = "/auth/login"
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

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/10 px-4 pb-8 pt-12">
        <div className="mx-auto max-w-lg space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-primary p-2">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">PropGenius</span>
            </div>
            {user ? (
              <Link href="/profile">
                <Badge variant="secondary" className="cursor-pointer">
                  <span className="h-2 w-2 rounded-full bg-primary mr-2" />
                  Account
                </Badge>
              </Link>
            ) : (
              <Link href="/auth/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          <div className="space-y-3 text-center">
            <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground">
              Find Your Perfect Property
            </h1>
            <p className="text-pretty text-muted-foreground">
              Buy, sell, or rent homes, apartments, penthouses, shops, and more with AI assistance
            </p>
          </div>

          <div className="flex justify-center">
            <ListingTypeToggle value={listingType} onChange={setListingType} />
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by city, neighborhood, or address..."
              className="h-12 rounded-full bg-background pl-12 pr-4 shadow-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery) {
                  window.location.href = `/search?q=${encodeURIComponent(searchQuery)}&type=${listingType}`
                }
              }}
            />
          </div>

          <Link href="/ai-agent" className="block">
            <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-4 text-primary-foreground shadow-lg transition-transform hover:scale-[1.02]">
              <div className="rounded-full bg-primary-foreground/20 p-2">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">AI Property Assistant</p>
                <p className="text-sm opacity-90">Get personalized help finding your dream property</p>
              </div>
              <ArrowRight className="h-5 w-5" />
            </div>
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="px-4 py-6">
        <div className="mx-auto max-w-lg">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Browse by Category</h2>
          <div className="grid grid-cols-4 gap-3">
            {categories.map((category) => (
              <Link
                key={category.value}
                href={`/search?category=${category.value}&type=${listingType}`}
                className="flex flex-col items-center gap-2 rounded-xl bg-card p-3 shadow-sm transition-all hover:shadow-md hover:bg-secondary"
              >
                <div className="rounded-full bg-primary/10 p-3">
                  <category.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-foreground">{category.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      {featuredProperties.length > 0 && (
        <section className="px-4 py-6">
          <div className="mx-auto max-w-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Featured Properties</h2>
              <Link href={`/search?featured=true&type=${listingType}`} className="text-sm font-medium text-primary">
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {featuredProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onFavorite={handleFavorite}
                  isFavorited={favorites.has(property.id)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Properties */}
      <section className="px-4 py-6">
        <div className="mx-auto max-w-lg">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Recent Listings</h2>
            <Link href={`/search?type=${listingType}`} className="text-sm font-medium text-primary">
              View All
            </Link>
          </div>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : recentProperties.length > 0 ? (
            <div className="space-y-4">
              {recentProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onFavorite={handleFavorite}
                  isFavorited={favorites.has(property.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl bg-muted/50 py-12 text-center">
              <MapPin className="mb-3 h-12 w-12 text-muted-foreground" />
              <p className="font-medium text-foreground">No properties yet</p>
              <p className="text-sm text-muted-foreground">Be the first to list a property!</p>
              <Link href="/owner/properties/new" className="mt-4">
                <Button>List a Property</Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
