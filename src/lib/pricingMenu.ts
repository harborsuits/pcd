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
  | "bundle_growth"
  | "bundle_full_ops";

export type RetainerAddonId = "maintenance" | "ai_tuning" | "operations";

export interface PricingTier {
  id: PricingTierId;
  label: string;
  price: string; // "Starting at $X" format
  description: string;
  features?: string[]; // What's included
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
    features: [
      "1–5 pages, mobile-friendly",
      "Click-to-call + contact forms",
      "Google Maps embed",
      "Basic SEO setup",
    ],
  },
  {
    id: "website_growth",
    label: "Growth Website",
    price: "Starting at $1,500",
    description: "Extended pages, forms, and conversion focus",
    features: [
      "5–8 pages with conversion focus",
      "Booking or intake integration",
      "Lead capture flows",
      "Light animations",
    ],
  },
  {
    id: "website_premium",
    label: "Premium / Interactive",
    price: "Starting at $2,500",
    description: "Custom features, animations, and integrations",
    features: [
      "Advanced interactions",
      "Custom user flows",
      "Third-party integrations",
      "CRM or scheduling connections",
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// WEBSITE CARE PLANS (Monthly Maintenance)
// ─────────────────────────────────────────────────────────────────────────────

export interface CarePlan {
  id: string;
  label: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  features: string[];
}

export const CARE_PLANS: CarePlan[] = [
  {
    id: "care_starter",
    label: "Care Plan – Starter",
    monthlyPrice: 95,
    yearlyPrice: 1010, // ~$84/mo, saves ~$130
    description: "Ongoing maintenance so your site doesn't rot.",
    features: [
      "Monthly content or copy updates (small changes)",
      "Plugin / dependency updates",
      "Uptime monitoring",
      "Security checks",
      "Minor fixes (typos, broken links, form issues)",
    ],
  },
  {
    id: "care_growth",
    label: "Care Plan – Growth",
    monthlyPrice: 145,
    yearlyPrice: 1550, // ~$129/mo, saves ~$190
    description: "Everything in Starter, plus priority support.",
    features: [
      "Everything in Starter, plus:",
      "Priority change requests",
      "Monthly performance review",
      "Conversion tracking check-ins",
      "Direct line for urgent issues",
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// À LA CARTE SERVICES (Built & Managed — Individual services outside bundles)
// ─────────────────────────────────────────────────────────────────────────────

export interface AlaCarteService {
  id: string;
  label: string;
  price: string;
  description: string;
}

export const ALACARTE_SERVICES: AlaCarteService[] = [
  {
    id: "seo_audit",
    label: "SEO Audit & Optimization (Built & Managed)",
    price: "Starting at $350",
    description: "One-time technical SEO review + local search optimization",
  },
  {
    id: "landing_page",
    label: "Landing Page (Built & Managed)",
    price: "Starting at $500",
    description: "Single conversion-focused page for campaigns or promos",
  },
  {
    id: "content_refresh",
    label: "Content Refresh (Built & Managed)",
    price: "Starting at $250",
    description: "Update copy, images, and calls-to-action on existing pages",
  },
  {
    id: "booking_integration",
    label: "Booking Integration (Built & Managed)",
    price: "Starting at $300",
    description: "Connect your existing scheduler to your website",
  },
  {
    id: "google_business_setup",
    label: "Google Business Profile Setup",
    price: "Starting at $150",
    description: "Claim, optimize, and configure your Google listing",
  },
  {
    id: "call_routing_setup",
    label: "Call Routing Setup",
    price: "Starting at $200",
    description: "Configure phone routing without full AI Front Door",
  },
  {
    id: "conversion_tracking",
    label: "Conversion Tracking Setup",
    price: "Starting at $200",
    description: "Google Analytics, Search Console, call tracking + goal setup",
  },
  {
    id: "forms_routing",
    label: "Forms & Lead Routing",
    price: "Starting at $200",
    description: "Contact forms, email routing, SMS alerts, CRM connection",
  },
  {
    id: "website_cleanup",
    label: "Website Cleanup / Fixes",
    price: "Starting at $300",
    description: "Broken links, speed improvements, mobile fixes, outdated content",
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
    price: "$575/mo + one-time build: $750–$1,250",
    description: "Essential website + hosting + AI Front Door. The clean baseline for owner-operators.",
    features: [
      "Essential website build (1–5 pages)",
      "Mobile-friendly, fast loading",
      "Click-to-call + contact forms",
      "Google Maps embed + basic SEO setup",
      "Hosting + maintenance (backups, uptime, minor updates)",
      "AI Front Door (answers calls, captures info, FAQs, after-hours)",
      "Call summaries + emergency routing",
    ],
  },
  {
    id: "bundle_growth",
    label: "PCD Growth System",
    price: "$875/mo + one-time build: $1,500–$2,500",
    description: "Booking + stronger lead capture + CRM basics. Built for businesses that live on appointments.",
    features: [
      "Everything in Starter, plus:",
      "Conversion-focused layout",
      "Booking or intake integration",
      "Lead capture flows + light animations",
      "AI Front Door + Booking (single or multi-staff scheduling)",
      "Confirmation texts/emails",
      "CRM basics (lead tracking + tagging)",
    ],
  },
  {
    id: "bundle_full_ops",
    label: "PCD Full Operations",
    price: "$1,100/mo + one-time build: $2,500–$4,000+",
    description: "Premium site + AI + booking + CRM context + managed updates. The full system.",
    features: [
      "Everything in Growth, plus:",
      "Advanced interactions + custom user flows",
      "CRM pipelines + dashboards",
      "AI + Booking + CRM Context (logging, tagging, follow-ups)",
      "Priority routing + reporting",
      "Managed updates & tuning (pricing, seasonal messaging)",
      "Priority support for digital operations",
    ],
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
