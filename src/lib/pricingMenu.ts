// ═══════════════════════════════════════════════════════════════════════════
// SHARED PRICING MENU - Single source of truth for all intake flows
// ═══════════════════════════════════════════════════════════════════════════

export type PricingTierId =
  | "website_essential"
  | "website_growth"
  | "website_premium"
  | "ai_front_door"
  | "ai_booking"
  | "ai_full"
  | "bundle_starter"
  | "bundle_growth";

export type RetainerAddonId = "maintenance" | "ai_tuning" | "operations";

export interface PricingTier {
  id: PricingTierId;
  label: string;
  price: string; // "Starting at $X" format
  description: string;
}

export interface RetainerAddon {
  id: RetainerAddonId;
  label: string;
  price: string; // "Starting at $X/mo"
  description: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// WEBSITE TIERS (One-Time)
// ─────────────────────────────────────────────────────────────────────────────

export const WEBSITE_TIERS: PricingTier[] = [
  {
    id: "website_essential",
    label: "Essential Website",
    price: "Starting at $750",
    description: "Fast, mobile-optimized site with core pages",
  },
  {
    id: "website_growth",
    label: "Growth Website",
    price: "Starting at $1,500",
    description: "Extended pages, forms, and conversion focus",
  },
  {
    id: "website_premium",
    label: "Premium / Interactive",
    price: "Starting at $2,500",
    description: "Custom features, animations, and integrations",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// AI RECEPTIONIST TIERS (Monthly)
// ─────────────────────────────────────────────────────────────────────────────

export const AI_TIERS: PricingTier[] = [
  {
    id: "ai_front_door",
    label: "AI Front Door",
    price: "Starting at $450/mo",
    description: "24/7 call answering, routing, and follow-ups",
  },
  {
    id: "ai_booking",
    label: "AI Front Door + Booking",
    price: "Starting at $700/mo",
    description: "Includes scheduling integration",
  },
  {
    id: "ai_full",
    label: "AI + Booking + CRM",
    price: "Starting at $950/mo",
    description: "Full automation with lead management",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// BUNDLE TIERS (Website + AI)
// ─────────────────────────────────────────────────────────────────────────────

export const BUNDLE_TIERS: PricingTier[] = [
  {
    id: "bundle_starter",
    label: "PCD Starter System",
    price: "Starting at $1,200 + $450/mo",
    description: "Essential Website + AI Front Door",
  },
  {
    id: "bundle_growth",
    label: "PCD Growth System",
    price: "Starting at $2,200 + $700/mo",
    description: "Growth Website + AI Front Door + Booking",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// RETAINER ADD-ONS (Monthly)
// ─────────────────────────────────────────────────────────────────────────────

export const RETAINER_ADDONS: RetainerAddon[] = [
  {
    id: "maintenance",
    label: "Hosting & Maintenance",
    price: "Starting at $75/mo",
    description: "Updates, backups, and uptime monitoring",
  },
  {
    id: "ai_tuning",
    label: "AI Updates & Tuning",
    price: "Starting at $100/mo",
    description: "Ongoing call flow optimization",
  },
  {
    id: "operations",
    label: "Digital Operations Support",
    price: "Starting at $150/mo",
    description: "Reporting, analytics, and conversion tracking",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export type ServiceType = "ai" | "website" | "both" | "demo" | "other" | null | "";

/**
 * Returns the appropriate pricing tiers based on service type.
 * demo and other return empty array (no pricing step).
 */
export function getPricingTiersForService(serviceType: ServiceType): PricingTier[] {
  switch (serviceType) {
    case "ai":
      return AI_TIERS;
    case "website":
      return WEBSITE_TIERS;
    case "both":
      return BUNDLE_TIERS;
    default:
      return [];
  }
}

/**
 * Find a tier by its ID across all tier types.
 */
export function findTierById(tierId: string | null | undefined): PricingTier | undefined {
  if (!tierId) return undefined;
  return (
    WEBSITE_TIERS.find((t) => t.id === tierId) ||
    AI_TIERS.find((t) => t.id === tierId) ||
    BUNDLE_TIERS.find((t) => t.id === tierId)
  );
}

/**
 * Find retainer addons by their IDs.
 */
export function findAddonsByIds(addonIds: string[]): RetainerAddon[] {
  return RETAINER_ADDONS.filter((a) => addonIds.includes(a.id));
}

/**
 * Check if a service type should show pricing steps.
 */
export function shouldShowPricing(serviceType: ServiceType): boolean {
  return serviceType === "ai" || serviceType === "website" || serviceType === "both";
}
