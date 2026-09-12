// ═══════════════════════════════════════════════════════════════════════════
// SHARED PRICING MENU - Single source of truth for all intake flows
//
// IMPORTANT: The offerings below are the CURRENT PUBLIC OFFER CATALOG, used for
// new inquiries and proposals only. Offers that existing customers already
// accepted live in LEGACY_OFFERS and are never removed, renamed, or repriced —
// lookups fall back to them so stored selections keep displaying exactly what
// the customer agreed to.
//
// All prices here are STARTING prices or quote-only placeholders. They are
// display strings on purpose: nothing in this file should ever be summed into
// an automatic total or treated as an accepted quote.
// ═══════════════════════════════════════════════════════════════════════════

export type PricingTierId = string;

export type RetainerAddonId = "maintenance" | "ai_tuning" | "operations";

export interface PricingTier {
  id: PricingTierId;
  label: string;
  price: string; // Display string only — e.g. "From $1,500" or "Custom proposal"
  description: string;
  features?: string[]; // Starting scope / examples of possible scope
  scopeNote?: string; // Visible limit shown next to the price
  /** true when `price` is a starting point, not a final or accepted price */
  isStartingPrice?: boolean;
  /** true when there is no advertised price at all — proposal required */
  quoteOnly?: boolean;
  /** true when the offer is retired and kept only to display stored selections */
  legacy?: boolean;
}

export interface RetainerAddon {
  id: RetainerAddonId;
  label: string;
  price: string; // Starting price, display only
  description: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT OFFERINGS (One-time build — scope-based, priced by proposal)
// ─────────────────────────────────────────────────────────────────────────────

export const PROJECT_OFFERINGS: PricingTier[] = [
  {
    id: "project_brochure",
    label: "Online Brochure",
    price: "From $1,500",
    isStartingPrice: true,
    description:
      "A simple, professional place for customers to learn what you do and contact you.",
    features: [
      "One straightforward page",
      "Your supplied business information, logo, and photos",
      "Brief business introduction and service overview",
      "A small selection of supplied images",
      "Phone, email, and relevant location information",
      "Mobile-friendly layout and basic technical SEO",
    ],
    scopeNote:
      "A compact informational website. Extensive copywriting, substantial portfolios, additional pages, booking systems, custom forms, and integrations are quoted separately.",
  },
  {
    id: "project_custom_website",
    label: "Custom Business Website",
    price: "From $3,500",
    isStartingPrice: true,
    description:
      "A tailored website that presents your business clearly, showcases your work, and helps customers take the next step.",
    features: [
      "Business-specific design and content organization",
      "Refinement of your supplied business information",
      "Service and project presentation",
      "A gallery and standard inquiry form where appropriate",
      "Basic technical SEO and analytics setup",
    ],
    scopeNote:
      "Your proposal determines the pages, content volume, functionality, revisions, and final price. The starting price does not include every possible feature.",
  },
  {
    id: "project_expanded",
    label: "Expanded Websites & Online Stores",
    price: "From $6,000",
    isStartingPrice: true,
    description:
      "For businesses needing more extensive content, richer project collections, online selling, or more involved customer journeys.",
    features: [
      "Larger portfolios and project case studies",
      "More extensive service or product content",
      "Online stores using established commerce platforms",
      "More involved inquiry and customer workflows",
      "Connections to existing business tools",
    ],
    scopeNote:
      "These are examples of possible scope, not a promise that every feature is included at this price. Final pricing is project-specific.",
  },
  {
    id: "project_business_systems",
    label: "Custom Business Systems",
    price: "Custom proposal",
    quoteOnly: true,
    description: "Websites and connected tools built around how your business operates.",
    features: [
      "Customer portals",
      "Advanced booking workflows",
      "CRM connections",
      "AI call answering",
      "Business automation",
      "Custom integrations and functionality",
    ],
    scopeNote:
      "Implementation and ongoing management quoted separately. AI services also include usage-based charges.",
  },
];

/** Public website/project selector. Same list as PROJECT_OFFERINGS. */
export const WEBSITE_TIERS: PricingTier[] = PROJECT_OFFERINGS;

/** What determines project pricing — shown under the offerings. */
export const PROJECT_PRICING_FACTORS: string[] = [
  "Page count is one factor; content and functionality also determine the work involved.",
  "Mobile layout checks, basic technical SEO, and appropriate launch testing are part of every website build.",
  "Your proposal specifies revision rounds and content responsibilities.",
  "Ongoing SEO, new features, and substantial additional content are separately scoped.",
  "Businesses with smaller budgets can start with a focused first phase.",
  "Projects begin with a deposit, consistent with our existing payment process.",
];

// ─────────────────────────────────────────────────────────────────────────────
// WEBSITE CARE PLANS (Monthly maintenance)
// ─────────────────────────────────────────────────────────────────────────────

export interface CarePlan {
  id: string;
  label: string;
  price: string; // Display string, e.g. "From $150/mo"
  monthlyPrice: number; // For display formatting only — never a billed amount
  isStartingPrice: boolean;
  description: string;
  features: string[];
}

export const CARE_PLANS: CarePlan[] = [
  {
    id: "care_website",
    label: "Website Care",
    price: "From $150/mo",
    monthlyPrice: 150,
    isStartingPrice: true,
    description: "Keep your website maintained, checked, and up to date.",
    features: [
      "Standard hosting within the allowance stated in your proposal",
      "Uptime monitoring and recoverable backups",
      "Routine maintenance appropriate to the website",
      "Scheduled checks of key contact features",
      "Up to 30 minutes total of minor content edits per month",
      "Standard support during business hours",
    ],
  },
  {
    id: "care_managed",
    label: "Managed Website Care",
    price: "From $275/mo",
    monthlyPrice: 275,
    isStartingPrice: true,
    description:
      "For businesses that need more regular website changes and a closer eye on performance.",
    features: [
      "Everything in Website Care",
      "Up to 90 minutes total of minor content edits per month (not in addition to the 30)",
      "Priority scheduling during business hours",
      "A quarterly performance review",
    ],
  },
];

export const CARE_TERMS: string[] = [
  "Included editing time does not roll over.",
  "Minor edits mean changes to existing text, images, links, and similar content.",
  "New pages, new functionality, substantial repair work outside routine maintenance, and ongoing SEO are separately scoped.",
  "Additional work is quoted in advance or billed at $125/hour with your approval.",
  "Hosting allowances, response expectations, and third-party costs are specified in your proposal.",
  "Complex websites and applications receive a custom care quote.",
];

// ─────────────────────────────────────────────────────────────────────────────
// FOCUSED INDIVIDUAL SERVICES (one-time implementation, starting prices)
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
    label: "SEO Audit & Action Plan",
    price: "From $450",
    description:
      "A focused review with prioritized recommendations. Implementation and ongoing SEO are quoted separately.",
  },
  {
    id: "landing_page",
    label: "Landing Page",
    price: "From $750",
    description:
      "One campaign or promotional page within an existing website and design system, using supplied content. Standalone campaign websites and substantial copywriting are quoted separately.",
  },
  {
    id: "content_refresh",
    label: "Content Refresh",
    price: "From $300",
    description:
      "An agreed batch of text, image, and call-to-action updates on existing pages. New pages and substantial new copywriting are additional.",
  },
  {
    id: "booking_integration",
    label: "Booking Integration",
    price: "From $450",
    description:
      "Configure and test an existing scheduling service on your website. Custom booking rules and workflows are additional.",
  },
  {
    id: "google_business_setup",
    label: "Google Business Profile Setup",
    price: "From $250",
    description:
      "Standard setup or optimization using supplied business details. Reinstatement and complicated verification issues require separate assessment.",
  },
  {
    id: "call_routing_setup",
    label: "Call Routing Setup",
    price: "From $300",
    description:
      "Configure a defined routing arrangement using a supported phone service. Phone-service charges are separate.",
  },
  {
    id: "conversion_tracking",
    label: "Conversion Tracking Setup",
    price: "From $450",
    description:
      "Standard tracking for one website and an agreed set of customer actions. Advanced tracking and paid tracking services are additional.",
  },
  {
    id: "forms_routing",
    label: "Forms & Lead Routing",
    price: "From $450",
    description:
      "A standard inquiry form and straightforward delivery workflow. SMS, CRM connections, and advanced automation add scope.",
  },
  {
    id: "website_cleanup",
    label: "Website Cleanup / Fixes",
    price: "From $350",
    description:
      "A specific issue or agreed list of improvements following inspection. Larger repairs receive a separate quote.",
  },
  {
    id: "online_ordering_integration",
    label: "Online Ordering Integration",
    price: "From $750",
    description:
      "Configure and test an existing ordering service. Menu migration, extensive customization, and custom ordering systems are additional.",
  },
];

export const ALACARTE_NOTE =
  "Ordinary small edits — changing a phone number, adding a standard link — can be handled through a care-plan allowance or a small approved update. You don't need to buy a full service for those.";

// ─────────────────────────────────────────────────────────────────────────────
// AI RECEPTIONIST & BUSINESS AUTOMATION (setup + management + usage)
// ─────────────────────────────────────────────────────────────────────────────

export interface AiComponent {
  id: string;
  label: string;
  price: string;
  description: string;
}

export const AI_MODEL_INTRO = {
  heading: "AI support that scales with your business.",
  body:
    "Your setup fee covers configuration and implementation. Monthly management covers the ongoing support and maintenance defined in your plan. Calls, messages, and AI activity are billed according to your actual usage at the rates agreed in your proposal. Businesses with higher activity pay for the additional capacity they use. We explain the rates and estimated costs before activation.",
};

export const AI_COMPONENTS: AiComponent[] = [
  {
    id: "ai_setup",
    label: "Setup & Implementation",
    price: "Custom quote",
    description:
      "Configuration, business information, call handling instructions, integrations, workflow development, and testing.",
  },
  {
    id: "ai_management",
    label: "Ongoing Management",
    price: "Based on scope",
    description:
      "The agreed monitoring, maintenance, support, and tuning. This does not include unlimited development or usage.",
  },
  {
    id: "ai_usage",
    label: "Usage",
    price: "Billed at agreed rates",
    description:
      "AI receptionist: call minutes. Messaging: messages sent or another clearly defined billable activity. AI workflows: defined workflow runs or another measurable unit specified in your proposal. Other AI services use a clearly explained usage measure.",
  },
];

export const AI_BILLING_NOTES: string[] = [
  "Every proposal states setup fees, management fees, usage rates, billing frequency, and any included allowance.",
  "Additional usage beyond an allowance is billed at the agreed rate.",
  "Rounding, minimum charges, and separately billed third-party fees are disclosed up front.",
  "Estimated monthly costs are estimates, not unlimited-service promises.",
  "Each customer's usage is measured separately and supported by itemized records.",
  "Spending alerts, optional limits, and what happens when a limit is reached are agreed before activation.",
  "Each proposal states whether website care is included, so you can see the total without overlapping charges.",
];

/**
 * AI selector option used by intake flows. Intentionally a single quote-only
 * option — there is no flat monthly AI price to select.
 */
export const AI_TIERS: PricingTier[] = [
  {
    id: "ai_services",
    label: "AI Receptionist & Business Automation",
    price: "Setup + management + usage",
    quoteOnly: true,
    description:
      "Setup and implementation quoted for your business, ongoing management based on scope, and usage billed at the rates agreed in your proposal.",
    features: AI_COMPONENTS.map((c) => `${c.label} — ${c.price}`),
    scopeNote:
      "No flat monthly fee includes unlimited calls, messages, or AI activity. Rates and estimated costs are explained before activation.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// BUDGET RANGES (optional inquiry question)
// ─────────────────────────────────────────────────────────────────────────────

export const BUDGET_RANGES: { value: string; label: string }[] = [
  { value: "under_1500", label: "Under $1,500 — focused improvements" },
  { value: "1500_3000", label: "$1,500–$3,000" },
  { value: "3000_6000", label: "$3,000–$6,000" },
  { value: "6000_12000", label: "$6,000–$12,000" },
  { value: "12000_plus", label: "$12,000+" },
  { value: "not_sure", label: "Not sure yet" },
];

export function findBudgetLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return BUDGET_RANGES.find((b) => b.value === value)?.label ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// RETAINER ADD-ONS (Monthly)
// ─────────────────────────────────────────────────────────────────────────────

export const RETAINER_ADDONS: RetainerAddon[] = [
  {
    id: "maintenance",
    label: "Hosting & Maintenance",
    price: "From $75/mo",
    description: "Updates, backups, and uptime monitoring",
  },
  {
    id: "ai_tuning",
    label: "AI Updates & Tuning",
    price: "From $100/mo",
    description: "Ongoing call flow optimization, billed alongside AI usage",
  },
  {
    id: "operations",
    label: "Digital Operations Support",
    price: "From $150/mo",
    description: "Reporting, analytics, and conversion tracking",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY OFFERS — retired public offers, retained so existing customer records
// keep displaying the label, scope, and price they actually agreed to.
// NEVER remove entries here and never show them in a public selector.
// ─────────────────────────────────────────────────────────────────────────────

export const LEGACY_OFFERS: PricingTier[] = [
  {
    id: "website_essential",
    label: "Essential Website",
    price: "Starting at $750",
    description: "Fast, mobile-optimized site with core pages",
    legacy: true,
  },
  {
    id: "website_growth",
    label: "Growth Website",
    price: "Starting at $1,500",
    description: "Extended pages, forms, and conversion focus",
    legacy: true,
  },
  {
    id: "website_premium",
    label: "Premium / Interactive",
    price: "Starting at $2,500",
    description: "Custom features, animations, and integrations",
    legacy: true,
  },
  {
    id: "ai_front_door",
    label: "AI Front Door",
    price: "Starting at $450/mo",
    description: "24/7 call answering, routing, and follow-ups",
    legacy: true,
  },
  {
    id: "ai_booking",
    label: "AI Front Door + Booking",
    price: "Starting at $700/mo",
    description: "Includes scheduling integration",
    legacy: true,
  },
  {
    id: "ai_full",
    label: "AI + Booking + CRM",
    price: "Starting at $950/mo",
    description: "Full automation with lead management",
    legacy: true,
  },
  {
    id: "bundle_starter",
    label: "PCD Starter System",
    price: "$395/mo + one-time build: $1,500–$2,500",
    description: "Essential website + hosting + AI Front Door",
    legacy: true,
  },
  {
    id: "bundle_growth",
    label: "PCD Growth System",
    price: "$650/mo + one-time build: $2,500–$4,000",
    description: "Booking + stronger lead capture + CRM basics",
    legacy: true,
  },
  {
    id: "bundle_full_ops",
    label: "PCD Full Operations",
    price: "$895/mo + one-time build: $4,000–$6,500",
    description: "Premium site + AI + booking + CRM context + managed updates",
    legacy: true,
  },
  {
    id: "care_starter",
    label: "Monthly Care – Starter",
    price: "$125/mo",
    description: "Ongoing maintenance so your site doesn't go stale or break quietly",
    legacy: true,
  },
  {
    id: "care_growth",
    label: "Monthly Care – Growth",
    price: "$175/mo",
    description: "Everything in Starter, plus priority support and a monthly review",
    legacy: true,
  },
];

/**
 * Retired bundle list. Kept as an alias of LEGACY bundles so any remaining
 * reference resolves to historical data — never shown as a current offer.
 */
export const BUNDLE_TIERS: PricingTier[] = LEGACY_OFFERS.filter((o) =>
  o.id.startsWith("bundle_")
);

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export type ServiceType = "ai" | "website" | "both" | "demo" | "other" | null | "";

/**
 * Current public offerings for a service type.
 * demo / other return an empty array (no pricing step).
 */
export function getPricingTiersForService(serviceType: ServiceType): PricingTier[] {
  switch (serviceType) {
    case "ai":
      return AI_TIERS;
    case "website":
    case "both":
      return PROJECT_OFFERINGS;
    default:
      return [];
  }
}

/**
 * Find an offering by ID. Current offers first, then retired offers, so an
 * existing customer's stored selection always resolves to what they agreed to.
 */
export function findTierById(tierId: string | null | undefined): PricingTier | undefined {
  if (!tierId) return undefined;
  return (
    PROJECT_OFFERINGS.find((t) => t.id === tierId) ||
    AI_TIERS.find((t) => t.id === tierId) ||
    LEGACY_OFFERS.find((t) => t.id === tierId)
  );
}

/** Find a care plan by ID, including retired plans. */
export function findCarePlanById(planId: string | null | undefined) {
  if (!planId) return undefined;
  return (
    CARE_PLANS.find((p) => p.id === planId) || LEGACY_OFFERS.find((o) => o.id === planId)
  );
}

/** True when the offering has no fixed price and requires a proposal. */
export function requiresQuote(tier: PricingTier | undefined | null): boolean {
  if (!tier) return true;
  return Boolean(tier.quoteOnly || tier.isStartingPrice);
}

export function findAddonsByIds(addonIds: string[]): RetainerAddon[] {
  return RETAINER_ADDONS.filter((a) => addonIds.includes(a.id));
}

export function shouldShowPricing(serviceType: ServiceType): boolean {
  return serviceType === "ai" || serviceType === "website" || serviceType === "both";
}
