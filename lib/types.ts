export type UserType = "buyer" | "tenant" | "owner" | "agent" | "all"

export type ListingType = "rent" | "sale" | "both"

export type PropertyType =
  | "apartment"
  | "studio"
  | "penthouse"
  | "house"
  | "villa"
  | "townhouse"
  | "duplex"
  | "shop"
  | "office"
  | "warehouse"
  | "commercial_building"
  | "restaurant"
  | "hotel"
  | "land"
  | "farm"
  | "industrial"
  | "mixed_use"
  | "other"

export type PropertyCategory = "residential" | "commercial" | "industrial" | "land"

export type PropertyStatus = "available" | "rented" | "sold" | "pending" | "under_contract" | "unlisted"

export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  user_type: UserType
  interests: string[]
  bio: string | null
  company_name: string | null
  license_number: string | null
  verified: boolean
  created_at: string
  updated_at: string
}

export interface Property {
  id: string
  owner_id: string
  title: string
  description: string | null
  listing_type: ListingType
  property_type: PropertyType
  property_category: PropertyCategory
  status: PropertyStatus
  address: string
  city: string
  state: string | null
  country: string
  postal_code: string | null
  latitude: number | null
  longitude: number | null
  neighborhood: string | null
  rent_amount: number | null
  deposit_amount: number | null
  rent_frequency: "daily" | "weekly" | "monthly" | "yearly"
  sale_price: number | null
  price_negotiable: boolean
  bedrooms: number | null
  bathrooms: number | null
  area_sqft: number | null
  amenities: string[]
  images: string[]
  virtual_tour_url: string | null
  featured: boolean
  views_count: number
  created_at: string
  updated_at: string
  owner?: Profile
}

export interface Conversation {
  id: string
  property_id: string | null
  participant_one: string
  participant_two: string
  last_message_at: string
  created_at: string
  property?: Property
  other_participant?: Profile
  last_message?: Message
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  read: boolean
  created_at: string
  sender?: Profile
}

export interface Viewing {
  id: string
  property_id: string
  requester_id: string
  owner_id: string
  scheduled_at: string
  duration_minutes: number
  viewing_purpose: "rent" | "buy"
  status: "pending" | "confirmed" | "cancelled" | "completed"
  notes: string | null
  created_at: string
  property?: Property
  requester?: Profile
  owner?: Profile
}

export interface Review {
  id: string
  reviewer_id: string
  reviewee_id: string
  property_id: string | null
  rating: number
  comment: string | null
  review_type: "owner_review" | "buyer_tenant_review" | "property"
  created_at: string
  reviewer?: Profile
  reviewee?: Profile
  property?: Property
}

export interface Offer {
  id: string
  property_id: string
  buyer_id: string
  seller_id: string
  offer_amount: number
  message: string | null
  status: "pending" | "accepted" | "rejected" | "countered" | "expired" | "withdrawn"
  counter_amount: number | null
  expires_at: string | null
  created_at: string
  updated_at: string
  property?: Property
  buyer?: Profile
  seller?: Profile
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  data: Record<string, unknown> | null
  read: boolean
  created_at: string
}

export interface Favorite {
  id: string
  user_id: string
  property_id: string
  created_at: string
  property?: Property
}
