"use client"

import { cn } from "@/lib/utils"

interface ListingTypeToggleProps {
  value: "buy" | "rent" | "all"
  onChange: (value: "buy" | "rent" | "all") => void
}

export function ListingTypeToggle({ value, onChange }: ListingTypeToggleProps) {
  return (
    <div className="flex items-center rounded-full bg-secondary p-1">
      <button
        onClick={() => onChange("buy")}
        className={cn(
          "rounded-full px-6 py-2 text-sm font-medium transition-all",
          value === "buy"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Buy
      </button>
      <button
        onClick={() => onChange("rent")}
        className={cn(
          "rounded-full px-6 py-2 text-sm font-medium transition-all",
          value === "rent"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Rent
      </button>
      <button
        onClick={() => onChange("all")}
        className={cn(
          "rounded-full px-6 py-2 text-sm font-medium transition-all",
          value === "all"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        All
      </button>
    </div>
  )
}
