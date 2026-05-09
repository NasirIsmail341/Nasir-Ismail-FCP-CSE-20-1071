"use client"

import { useEffect, useState, use } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Bed,
  Bath,
  Square,
  Calendar,
  MessageCircle,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  DollarSign,
  Tag,
  Building2,
  Check,
  Loader2,
} from "lucide-react"
import type { Property, Profile } from "@/lib/types"
import { cn } from "@/lib/utils"

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [property, setProperty] = useState<Property | null>(null)
  const [owner, setOwner] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)
  const [user, setUser] = useState<{ id: string } | null>(null)

  useEffect(() => {
    async function loadProperty() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      const { data: property } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .single()

      if (property) {
        setProperty(property)

        // Fetch owner
        const { data: owner } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", property.owner_id)
          .single()
        setOwner(owner)

        // Check if favorited
        if (user) {
          const { data: favorite } = await supabase
            .from("favorites")
            .select("id")
            .eq("user_id", user.id)
            .eq("property_id", id)
            .single()
          setIsFavorited(!!favorite)
        }

        // Increment view count
        await supabase
          .from("properties")
          .update({ views_count: (property.views_count || 0) + 1 })
          .eq("id", id)
      }

      setLoading(false)
    }

    loadProperty()
  }, [id, supabase])

  const handleFavorite = async () => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    if (isFavorited) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("property_id", id)
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, property_id: id })
    }
    setIsFavorited(!isFavorited)
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: property?.title,
        text: `Check out this property: ${property?.title}`,
        url: window.location.href,
      })
    } else {
      await navigator.clipboard.writeText(window.location.href)
      alert("Link copied to clipboard!")
    }
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount / 100)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="text-xl font-semibold text-foreground">Property not found</h1>
        <p className="mb-4 text-muted-foreground">This property may have been removed.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  const propertyTypeLabel = property.property_type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  return (
    <div className="pb-24">
      {/* Image Gallery */}
      <div className="relative aspect-[4/3] bg-muted">
        {property.images && property.images.length > 0 ? (
          <>
            <Image
              src={property.images[currentImageIndex]}
              alt={property.title}
              fill
              className="object-cover"
            />
            {property.images.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentImageIndex((prev) =>
                      prev === 0 ? property.images.length - 1 : prev - 1
                    )
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 backdrop-blur-sm"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() =>
                    setCurrentImageIndex((prev) =>
                      prev === property.images.length - 1 ? 0 : prev + 1
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 backdrop-blur-sm"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {property.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={cn(
                        "h-2 w-2 rounded-full transition-colors",
                        i === currentImageIndex ? "bg-primary" : "bg-background/60"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <Building2 className="h-16 w-16 text-muted-foreground" />
          </div>
        )}

        {/* Header Actions */}
        <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-background/80 backdrop-blur-sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-background/80 backdrop-blur-sm"
              onClick={handleShare}
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-background/80 backdrop-blur-sm"
              onClick={handleFavorite}
            >
              <Heart
                className={cn(
                  "h-5 w-5",
                  isFavorited ? "fill-destructive text-destructive" : ""
                )}
              />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-lg px-4 py-6">
        <div className="space-y-6">
          {/* Title & Price */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge
                className={cn(
                  property.listing_type === "sale"
                    ? "bg-primary text-primary-foreground"
                    : property.listing_type === "rent"
                      ? "bg-accent text-accent-foreground"
                      : "bg-foreground text-background"
                )}
              >
                {property.listing_type === "both"
                  ? "For Sale / Rent"
                  : property.listing_type === "sale"
                    ? "For Sale"
                    : "For Rent"}
              </Badge>
              <Badge variant="outline">
                <Tag className="mr-1 h-3 w-3" />
                {propertyTypeLabel}
              </Badge>
              {property.featured && (
                <Badge className="bg-warning text-warning-foreground">Featured</Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground">{property.title}</h1>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                {property.address}, {property.city}, {property.state || property.country}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 pt-2">
              {property.sale_price && (
                <div>
                  <p className="text-sm text-muted-foreground">Sale Price</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(property.sale_price)}
                  </p>
                </div>
              )}
              {property.rent_amount && (
                <div>
                  <p className="text-sm text-muted-foreground">Rent</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(property.rent_amount)}/{property.rent_frequency}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            {property.bedrooms !== null && (
              <div className="flex flex-col items-center rounded-lg bg-secondary/50 p-3">
                <Bed className="h-5 w-5 text-primary" />
                <span className="mt-1 text-sm font-medium">{property.bedrooms}</span>
                <span className="text-xs text-muted-foreground">Beds</span>
              </div>
            )}
            {property.bathrooms !== null && (
              <div className="flex flex-col items-center rounded-lg bg-secondary/50 p-3">
                <Bath className="h-5 w-5 text-primary" />
                <span className="mt-1 text-sm font-medium">{property.bathrooms}</span>
                <span className="text-xs text-muted-foreground">Baths</span>
              </div>
            )}
            {property.area_sqft !== null && (
              <div className="flex flex-col items-center rounded-lg bg-secondary/50 p-3">
                <Square className="h-5 w-5 text-primary" />
                <span className="mt-1 text-sm font-medium">{property.area_sqft.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">sqft</span>
              </div>
            )}
            <div className="flex flex-col items-center rounded-lg bg-secondary/50 p-3">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="mt-1 text-sm font-medium">
                {new Date(property.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
              <span className="text-xs text-muted-foreground">Listed</span>
            </div>
          </div>

          {/* Description */}
          {property.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-muted-foreground">{property.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {property.amenities.map((amenity, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm text-foreground">{amenity}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Owner Card */}
          {owner && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Listed By</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={owner.avatar_url || undefined} />
                    <AvatarFallback>
                      {owner.full_name?.charAt(0) || owner.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{owner.full_name || "Property Owner"}</p>
                    <p className="text-sm text-muted-foreground capitalize">{owner.user_type}</p>
                    {owner.verified && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        <Check className="mr-1 h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Assistant CTA */}
          <Link href={`/ai-agent?property=${property.id}`}>
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-full bg-primary/20 p-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Have questions?</p>
                  <p className="text-sm text-muted-foreground">
                    Ask our AI assistant about this property
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-lg px-4 py-3 pb-safe">
        <div className="mx-auto flex max-w-lg gap-3">
          {property.listing_type !== "rent" && property.sale_price && (
            <Button variant="outline" className="flex-1" asChild>
              <Link href={`/property/${property.id}/offer`}>
                <DollarSign className="mr-2 h-4 w-4" />
                Make Offer
              </Link>
            </Button>
          )}
          <Button className="flex-1" asChild>
            <Link href={`/property/${property.id}/contact`}>
              <MessageCircle className="mr-2 h-4 w-4" />
              Contact Owner
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
