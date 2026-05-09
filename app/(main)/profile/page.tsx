"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Settings,
  Building2,
  Heart,
  MessageCircle,
  Calendar,
  Star,
  LogOut,
  ChevronRight,
  Loader2,
  Plus,
  Bell,
  DollarSign,
  FileText,
} from "lucide-react"
import type { Profile } from "@/lib/types"

const menuItems = [
  { href: "/owner/dashboard", icon: Building2, label: "My Properties", badge: null },
  { href: "/favorites", icon: Heart, label: "Saved Properties", badge: null },
  { href: "/messages", icon: MessageCircle, label: "Messages", badge: null },
  { href: "/bookings", icon: Calendar, label: "Viewings", badge: null },
  { href: "/buyer/my-offers", icon: DollarSign, label: "My Offers", badge: null },
  { href: "/notifications", icon: Bell, label: "Notifications", badge: null },
  { href: "/profile/reviews", icon: Star, label: "Reviews", badge: null },
  { href: "/profile/edit", icon: Settings, label: "Settings", badge: null },
]

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ properties: 0, favorites: 0, reviews: 0 })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      setProfile(profile)

      // Get stats
      const [propertiesRes, favoritesRes, reviewsRes] = await Promise.all([
        supabase.from("properties").select("id", { count: "exact" }).eq("owner_id", user.id),
        supabase.from("favorites").select("id", { count: "exact" }).eq("user_id", user.id),
        supabase.from("reviews").select("id", { count: "exact" }).eq("reviewee_id", user.id),
      ])

      setStats({
        properties: propertiesRes.count || 0,
        favorites: favoritesRes.count || 0,
        reviews: reviewsRes.count || 0,
      })

      setLoading(false)
    }

    loadProfile()
  }, [supabase, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return null
  }

  const userTypeLabel = profile.user_type.charAt(0).toUpperCase() + profile.user_type.slice(1)

  return (
    <div className="flex flex-col pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-accent/10 px-4 py-8">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
                {profile.full_name?.charAt(0) || profile.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">
                {profile.full_name || "User"}
              </h1>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="secondary">{userTypeLabel}</Badge>
                {profile.verified && (
                  <Badge className="bg-primary text-primary-foreground">Verified</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-card p-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-foreground">{stats.properties}</p>
              <p className="text-xs text-muted-foreground">Properties</p>
            </div>
            <div className="rounded-xl bg-card p-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-foreground">{stats.favorites}</p>
              <p className="text-xs text-muted-foreground">Saved</p>
            </div>
            <div className="rounded-xl bg-card p-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-foreground">{stats.reviews}</p>
              <p className="text-xs text-muted-foreground">Reviews</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-6">
        <div className="mx-auto max-w-lg space-y-4">
          <Link href="/owner/properties/new">
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              List a Property
            </Button>
          </Link>
        </div>
      </div>

      {/* Menu */}
      <div className="px-4">
        <div className="mx-auto max-w-lg">
          <Card>
            <CardContent className="p-0">
              {menuItems.map((item, index) => (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-secondary"
                  >
                    <div className="rounded-full bg-primary/10 p-2">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="flex-1 font-medium text-foreground">{item.label}</span>
                    {item.badge && (
                      <Badge variant="destructive" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </Link>
                  {index < menuItems.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>

          <Button
            variant="outline"
            className="mt-6 w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
