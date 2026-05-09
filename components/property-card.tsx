"use client"

import Link from "next/link"
import Image from "next/image"
import { Heart, MapPin, Bed, Bath, Square, Tag } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Property } from "@/lib/types"
import { cn } from "@/lib/utils"

interface PropertyCardProps {
  property: Property
  onFavorite?: (id: string) => void
  isFavorited?: boolean
}

export function PropertyCard({ property, onFavorite, isFavorited }: PropertyCardProps) {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount / 100)
  }

  const getListingBadge = () => {
    if (property.listing_type === "both") return "For Sale / Rent"
    if (property.listing_type === "sale") return "For Sale"
    return "For Rent"
  }

  const getPriceDisplay = () => {
    if (property.listing_type === "sale" && property.sale_price) {
      return formatPrice(property.sale_price)
    }
    if (property.listing_type === "rent" && property.rent_amount) {
      return `${formatPrice(property.rent_amount)}/${property.rent_frequency === "monthly" ? "mo" : property.rent_frequency}`
    }
    if (property.listing_type === "both") {
      if (property.sale_price) return formatPrice(property.sale_price)
      if (property.rent_amount) return `${formatPrice(property.rent_amount)}/mo`
    }
    return "Contact for price"
  }

  const propertyTypeLabel = property.property_type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
      <Link href={`/property/${property.id}`}>
        <div className="relative aspect-[4/3] overflow-hidden">
          {property.images && property.images.length > 0 ? (
            <Image
              src={property.images[0]}
              alt={property.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <Square className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          <div className="absolute left-3 top-3 flex gap-2">
            <Badge
              className={cn(
                "font-semibold",
                property.listing_type === "sale"
                  ? "bg-primary text-primary-foreground"
                  : property.listing_type === "rent"
                    ? "bg-accent text-accent-foreground"
                    : "bg-foreground text-background"
              )}
            >
              {getListingBadge()}
            </Badge>
            {property.featured && (
              <Badge variant="secondary" className="bg-warning text-warning-foreground">
                Featured
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onFavorite?.(property.id)
            }}
          >
            <Heart
              className={cn(
                "h-5 w-5 transition-colors",
                isFavorited ? "fill-destructive text-destructive" : "text-muted-foreground"
              )}
            />
          </Button>
        </div>
      </Link>
      <CardContent className="p-4">
        <Link href={`/property/${property.id}`}>
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-1 font-semibold text-foreground group-hover:text-primary transition-colors">
                {property.title}
              </h3>
            </div>
            <p className="text-xl font-bold text-primary">{getPriceDisplay()}</p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="line-clamp-1">
                {property.city}, {property.state || property.country}
              </span>
            </div>
            <div className="flex items-center gap-4 pt-2 text-sm text-muted-foreground">
              {property.bedrooms !== null && (
                <div className="flex items-center gap-1">
                  <Bed className="h-4 w-4" />
                  <span>{property.bedrooms}</span>
                </div>
              )}
              {property.bathrooms !== null && (
                <div className="flex items-center gap-1">
                  <Bath className="h-4 w-4" />
                  <span>{property.bathrooms}</span>
                </div>
              )}
              {property.area_sqft !== null && (
                <div className="flex items-center gap-1">
                  <Square className="h-4 w-4" />
                  <span>{property.area_sqft.toLocaleString()} sqft</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Badge variant="outline" className="text-xs">
                <Tag className="mr-1 h-3 w-3" />
                {propertyTypeLabel}
              </Badge>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  )
}
