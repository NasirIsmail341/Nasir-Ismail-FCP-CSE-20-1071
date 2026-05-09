"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { PropertyCard } from "@/components/property-card"
import { Button } from "@/components/ui/button"
import { Heart, Loader2, Search } from "lucide-react"
import type { Property } from "@/lib/types"
import Link from "next/link"

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Property[]>([])
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadFavorites() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/auth/login")
        return
      }
      
      setUser(user)

      const { data: favoritesData } = await supabase
        .from("favorites")
        .select("property_id, properties(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (favoritesData) {
        const properties = favoritesData
          .map((f) => f.properties as unknown as Property)
          .filter(Boolean)
        setFavorites(properties)
        setFavoriteIds(new Set(properties.map((p) => p.id)))
      }

      setLoading(false)
    }

    loadFavorites()
  }, [supabase, router])

  const handleFavorite = async (propertyId: string) => {
    if (!user) return

    await supabase.from("favorites").delete().eq("user_id", user.id).eq("property_id", propertyId)
    setFavorites((prev) => prev.filter((p) => p.id !== propertyId))
    setFavoriteIds((prev) => {
      const next = new Set(prev)
      next.delete(propertyId)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="border-b border-border bg-background/95 px-4 py-4 backdrop-blur-lg">
        <div className="mx-auto max-w-lg">
          <h1 className="text-xl font-semibold text-foreground">Saved Properties</h1>
          <p className="text-sm text-muted-foreground">{favorites.length} properties saved</p>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="mx-auto max-w-lg">
          {favorites.length > 0 ? (
            <div className="space-y-4">
              {favorites.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onFavorite={handleFavorite}
                  isFavorited={favoriteIds.has(property.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <Heart className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">No saved properties</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Start browsing and save properties you like
              </p>
              <Link href="/search" className="mt-4">
                <Button>
                  <Search className="mr-2 h-4 w-4" />
                  Browse Properties
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
