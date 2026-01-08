// ============================================
// INTAKE TEMPLATE CONFIGURATION
// ============================================
// Each product/button maps to a template that defines:
// - Required sections for "missing essentials" computation
// - Step order for the wizard
// - Track options (new_site vs improve_existing)
// ============================================

export type IntakeTrack = "new_site" | "improve_existing" | null;

export type ProductKey = 
  | "web_design"
  | "ai_receptionist"
  | "bundle"
  | "care_plan"
  | "alacarte"
  | "pilot"
  | "other";

export type IntakeTemplate =
  | "web_new_build"
  | "web_existing"
  | "ai_receptionist"
  | "bundle_web_ai"
  | "bundle_starter"
  | "bundle_growth"
  | "bundle_full_ops"
  | "care_plan"
  | "alacarte_seo"
  | "alacarte_landing"
  | "pilot"
  | "other";

export type RequiredSection =
  | "content"
  | "links"
  | "hours"
  | "design"
  | "features"
  | "trust_signals"
  | "existing_site"
  | "access_checklist"
  | "ai_coverage"
  | "ai_operations"
  | "ai_emergency"
  | "ai_leads"
  | "ai_voice";

export interface TemplateConfig {
  productKey: ProductKey;
  template: IntakeTemplate;
  label: string;
  description: string;
  requiredSections: RequiredSection[];
  supportsTrackSelection: boolean;
  defaultTrack: IntakeTrack;
}

// Template configurations
export const TEMPLATE_CONFIGS: Record<IntakeTemplate, TemplateConfig> = {
  web_new_build: {
    productKey: "web_design",
    template: "web_new_build",
    label: "New Website Build",
    description: "We handle everything: design, hosting, and updates.",
    requiredSections: ["content", "links", "hours", "design"],
    supportsTrackSelection: false,
    defaultTrack: "new_site",
  },
  web_existing: {
    productKey: "web_design",
    template: "web_existing",
    label: "Improve Existing Site",
    description: "We'll work inside your current platform.",
    requiredSections: ["existing_site", "access_checklist"],
    supportsTrackSelection: false,
    defaultTrack: "improve_existing",
  },
  ai_receptionist: {
    productKey: "ai_receptionist",
    template: "ai_receptionist",
    label: "AI Receptionist",
    description: "24/7 call, text & form handling.",
    requiredSections: ["ai_coverage", "ai_operations", "ai_leads", "ai_voice"],
    supportsTrackSelection: false,
    defaultTrack: null,
  },
  bundle_web_ai: {
    productKey: "bundle",
    template: "bundle_web_ai",
    label: "Website + AI Receptionist",
    description: "Complete digital presence with automated lead capture.",
    requiredSections: ["content", "links", "hours", "design", "ai_coverage", "ai_operations", "ai_leads", "ai_voice"],
    supportsTrackSelection: true,
    defaultTrack: "new_site",
  },
  bundle_starter: {
    productKey: "bundle",
    template: "bundle_starter",
    label: "PCD Starter System",
    description: "Website + AI Receptionist starter package.",
    requiredSections: ["content", "links", "hours", "design", "ai_coverage", "ai_operations"],
    supportsTrackSelection: true,
    defaultTrack: "new_site",
  },
  bundle_growth: {
    productKey: "bundle",
    template: "bundle_growth",
    label: "PCD Growth System",
    description: "Website + AI Receptionist growth package.",
    requiredSections: ["content", "links", "hours", "design", "ai_coverage", "ai_operations", "ai_leads", "ai_voice"],
    supportsTrackSelection: true,
    defaultTrack: "new_site",
  },
  bundle_full_ops: {
    productKey: "bundle",
    template: "bundle_full_ops",
    label: "PCD Full Operations",
    description: "Complete digital operations system.",
    requiredSections: ["content", "links", "hours", "design", "features", "trust_signals", "ai_coverage", "ai_operations", "ai_leads", "ai_voice"],
    supportsTrackSelection: true,
    defaultTrack: "new_site",
  },
  care_plan: {
    productKey: "care_plan",
    template: "care_plan",
    label: "Website Care Plan",
    description: "Ongoing maintenance and support.",
    requiredSections: [],
    supportsTrackSelection: false,
    defaultTrack: null,
  },
  alacarte_seo: {
    productKey: "alacarte",
    template: "alacarte_seo",
    label: "SEO Services",
    description: "Search engine optimization.",
    requiredSections: ["existing_site"],
    supportsTrackSelection: false,
    defaultTrack: "improve_existing",
  },
  alacarte_landing: {
    productKey: "alacarte",
    template: "alacarte_landing",
    label: "Landing Page",
    description: "Single-page campaign site.",
    requiredSections: ["content", "design"],
    supportsTrackSelection: false,
    defaultTrack: "new_site",
  },
  pilot: {
    productKey: "pilot",
    template: "pilot",
    label: "7-Day AI Pilot",
    description: "Try AI receptionist for a week.",
    requiredSections: ["ai_coverage", "ai_operations"],
    supportsTrackSelection: false,
    defaultTrack: null,
  },
  other: {
    productKey: "other",
    template: "other",
    label: "Custom Request",
    description: "Something specific or unique.",
    requiredSections: [],
    supportsTrackSelection: false,
    defaultTrack: null,
  },
};

// Map old service_type to product_key
export function mapServiceTypeToProductKey(serviceType: string): ProductKey {
  switch (serviceType) {
    case "website":
      return "web_design";
    case "ai":
    case "ai_receptionist":
      return "ai_receptionist";
    case "both":
      return "bundle";
    case "other":
      return "other";
    default:
      return "other";
  }
}

// Get template config from product key and track
export function getTemplateForProduct(productKey: ProductKey, track?: IntakeTrack): IntakeTemplate {
  switch (productKey) {
    case "web_design":
      return track === "improve_existing" ? "web_existing" : "web_new_build";
    case "ai_receptionist":
      return "ai_receptionist";
    case "bundle":
      return "bundle_web_ai";
    case "care_plan":
      return "care_plan";
    case "alacarte":
      return "alacarte_seo"; // Default, can be overridden
    case "pilot":
      return "pilot";
    default:
      return "other";
  }
}

// ============================================
// INTAKE DETAILS STRUCTURE
// ============================================

export interface ServiceItem {
  name: string;
  description: string;
}

export interface IntakeContent {
  hero_line: string | null;
  about_blurb: string | null;
  services: ServiceItem[];
  primary_cta: string | null;
  secondary_cta: string | null;
}

export interface IntakeLinks {
  current_website: string | null;
  gbp: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  reviews_google: string | null;
  reviews_yelp: string | null;
  inspiration_sites: string[];
}

export interface IntakeHours {
  monday: string | null;
  tuesday: string | null;
  wednesday: string | null;
  thursday: string | null;
  friday: string | null;
  saturday: string | null;
  sunday: string | null;
  service_area: string | null;
  preferred_contact_method: string | null;
}

export interface IntakeDesign {
  vibe: string | null;
  must_colors: string | null;
  font_preference: string | null;
}

export interface IntakeTrustSignals {
  years_in_business: string | null;
  awards: string | null;
  team_size: string | null;
  review_count: string | null;
  average_rating: string | null;
  testimonials: string[];
}

export interface IntakeExistingSite {
  platform: string | null;
  platform_other: string | null;
  url: string | null;
  work_requested: string[];
  access_method: string | null;
  access_instructions: string | null;
}

export type AccessStatus = "pending" | "granted" | "not_needed" | "blocked";

export interface IntakeAccessChecklist {
  website_editor: AccessStatus;
  domain_dns: AccessStatus;
  search_console: AccessStatus;
  analytics: AccessStatus;
  gbp: AccessStatus;
}

export interface IntakeDetails {
  required_sections: RequiredSection[];
  content: IntakeContent | null;
  links: IntakeLinks | null;
  hours: IntakeHours | null;
  design: IntakeDesign | null;
  features_needed: string[];
  trust_signals: IntakeTrustSignals | null;
  existing_site: IntakeExistingSite | null;
  access_checklist: IntakeAccessChecklist | null;
}

// ============================================
// VIBE OPTIONS
// ============================================

export const VIBE_OPTIONS = [
  { value: "clean", label: "Clean & Modern", description: "Minimal, professional, lots of whitespace" },
  { value: "bold", label: "Bold & High-Impact", description: "Strong colors, attention-grabbing" },
  { value: "rustic", label: "Rustic & Authentic", description: "Warm, handcrafted, natural textures" },
  { value: "luxury", label: "Luxury & Refined", description: "Elegant, high-end, sophisticated" },
  { value: "playful", label: "Playful & Friendly", description: "Fun colors, approachable" },
  { value: "modern", label: "Modern & Tech-Forward", description: "Sleek, cutting-edge, innovative" },
] as const;

// ============================================
// PLATFORM OPTIONS (for existing site track)
// ============================================

export const PLATFORM_OPTIONS = [
  { value: "squarespace", label: "Squarespace" },
  { value: "wix", label: "Wix" },
  { value: "wordpress", label: "WordPress" },
  { value: "shopify", label: "Shopify" },
  { value: "godaddy", label: "GoDaddy Website Builder" },
  { value: "weebly", label: "Weebly" },
  { value: "other", label: "Other" },
] as const;

// ============================================
// WORK REQUESTED OPTIONS (for existing site track)
// ============================================

export const WORK_REQUESTED_OPTIONS = [
  { value: "content_edits", label: "Content Edits", description: "Update text, images, and information" },
  { value: "seo", label: "SEO Improvements", description: "Better search engine visibility" },
  { value: "design_refresh", label: "Design Refresh", description: "Updated look and feel" },
  { value: "booking_forms", label: "Add Booking/Forms", description: "Online scheduling or contact forms" },
  { value: "new_pages", label: "New Pages", description: "Additional pages or sections" },
  { value: "speed", label: "Speed Optimization", description: "Faster loading times" },
  { value: "tracking", label: "Tracking/Analytics", description: "Google Analytics, conversion tracking" },
  { value: "domain_dns", label: "Domain/DNS Changes", description: "Domain transfers, DNS updates" },
] as const;

// ============================================
// ACCESS METHOD OPTIONS
// ============================================

export const ACCESS_METHOD_OPTIONS = [
  { 
    value: "collaborator", 
    label: "Invite as Collaborator (Recommended)", 
    description: "No passwords needed - invite us with limited permissions",
    recommended: true,
  },
  { 
    value: "dns_only", 
    label: "DNS/Domain Access Only", 
    description: "We can connect services but not edit your site content",
    recommended: false,
  },
  { 
    value: "password", 
    label: "Send Login Credentials", 
    description: "We recommend collaborator invite instead",
    recommended: false,
  },
  { 
    value: "none", 
    label: "I'm Not Sure / Need Help", 
    description: "We'll help you figure out the best approach",
    recommended: false,
  },
] as const;

// ============================================
// FEATURE OPTIONS (for new site track)
// ============================================

export const FEATURE_OPTIONS = [
  { value: "contact_form", label: "Contact Form", description: "Simple inquiry form" },
  { value: "quote_form", label: "Quote Request Form", description: "Detailed quote/estimate requests" },
  { value: "booking_integration", label: "Booking Integration", description: "Calendly, Acuity, etc." },
  { value: "menu_page", label: "Menu Page", description: "For restaurants/food service" },
  { value: "events_page", label: "Events/Promos Page", description: "Announcements and specials" },
  { value: "gallery", label: "Photo Gallery", description: "Showcase your work" },
  { value: "newsletter", label: "Newsletter Signup", description: "Email list collection" },
  { value: "faq_page", label: "FAQ Page", description: "Common questions answered" },
  { value: "jobs_form", label: "Job Application Form", description: "Hiring/careers form" },
  { value: "popup_banner", label: "Popup/Banner", description: "Promotional announcements" },
] as const;

// ============================================
// CTA OPTIONS
// ============================================

export const PRIMARY_CTA_OPTIONS = [
  { value: "calls", label: "Get Calls", description: "Phone calls are your top priority" },
  { value: "quotes", label: "Get Quote Requests", description: "Collect estimate requests" },
  { value: "bookings", label: "Book Appointments", description: "Online scheduling" },
  { value: "info", label: "Provide Information", description: "Visitors looking for info first" },
] as const;

export const SECONDARY_CTA_OPTIONS = [
  { value: "menu", label: "View Menu" },
  { value: "pricing", label: "See Pricing" },
  { value: "gallery", label: "View Gallery" },
  { value: "contact", label: "Contact Form" },
  { value: "directions", label: "Get Directions" },
] as const;

// ============================================
// MISSING ESSENTIALS COMPUTATION
// ============================================

export function computeMissingEssentials(
  intakeDetails: IntakeDetails | null | undefined,
  requiredSections: RequiredSection[]
): string[] {
  if (!intakeDetails) {
    // If no details at all, everything required is missing
    return requiredSections.map(s => sectionToLabel(s));
  }

  const missing: string[] = [];

  for (const section of requiredSections) {
    switch (section) {
      case "content":
        if (!intakeDetails.content?.hero_line) missing.push("Hero line");
        if (!intakeDetails.content?.services?.length) missing.push("Services");
        break;
      case "links":
        // Links are nice-to-have, not strictly required
        break;
      case "hours":
        if (!intakeDetails.hours?.monday) missing.push("Business hours");
        break;
      case "design":
        if (!intakeDetails.design?.vibe) missing.push("Design vibe");
        break;
      case "features":
        // Features are optional
        break;
      case "trust_signals":
        // Trust signals are optional
        break;
      case "existing_site":
        if (!intakeDetails.existing_site?.platform) missing.push("Platform");
        if (!intakeDetails.existing_site?.url) missing.push("Site URL");
        break;
      case "access_checklist":
        // Check if any access is still pending that we need
        if (intakeDetails.access_checklist) {
          const { website_editor, domain_dns } = intakeDetails.access_checklist;
          if (website_editor === "pending") missing.push("Website editor access");
          if (domain_dns === "pending") missing.push("Domain/DNS access");
        }
        break;
      // AI sections - defer to existing AI intake checks
      default:
        break;
    }
  }

  return missing;
}

function sectionToLabel(section: RequiredSection): string {
  const labels: Record<RequiredSection, string> = {
    content: "Content",
    links: "Links",
    hours: "Hours",
    design: "Design",
    features: "Features",
    trust_signals: "Trust Signals",
    existing_site: "Existing Site",
    access_checklist: "Access Checklist",
    ai_coverage: "AI Coverage",
    ai_operations: "AI Operations",
    ai_emergency: "AI Emergency",
    ai_leads: "AI Leads",
    ai_voice: "AI Voice",
  };
  return labels[section] || section;
}

// ============================================
// "WHAT WE CAN DO RIGHT NOW" AUTO-TEXT
// ============================================

export function computeWhatWeCanDo(accessChecklist: IntakeAccessChecklist | null): string {
  if (!accessChecklist) {
    return "We can write copy, prep assets, build a replacement site, or provide step-by-step instructions for you to apply changes.";
  }

  const hasEditor = accessChecklist.website_editor === "granted";
  const hasDns = accessChecklist.domain_dns === "granted";
  const hasSearchConsole = accessChecklist.search_console === "granted";
  const hasAnalytics = accessChecklist.analytics === "granted";
  const hasGbp = accessChecklist.gbp === "granted";

  if (hasEditor) {
    const extras: string[] = [];
    if (hasDns) extras.push("connect domains");
    if (hasSearchConsole) extras.push("manage SEO visibility");
    if (hasAnalytics) extras.push("set up conversion tracking");
    if (hasGbp) extras.push("update your Google listing");
    
    if (extras.length > 0) {
      return `We can ship edits directly, plus ${extras.join(", ")}.`;
    }
    return "We can ship edits directly.";
  }

  if (hasDns) {
    return "We can connect a new site, verify tools, and set redirects, but not edit the existing builder content.";
  }

  return "We can write copy, prep assets, build a replacement site, or provide step-by-step instructions for you to apply changes.";
}

// ============================================
// PLATFORM-SPECIFIC ACCESS INSTRUCTIONS
// ============================================

export function getCollaboratorInstructions(platform: string): string {
  switch (platform) {
    case "squarespace":
      return "Go to Settings → Permissions → Add contributor. Invite us with 'Content Editor' or 'Administrator' role.";
    case "wix":
      return "Go to Settings → Roles & Permissions → Invite People. Add us as a 'Website Manager' or 'Admin'.";
    case "wordpress":
      return "Go to Users → Add New. Create an account for us with 'Editor' or 'Administrator' role.";
    case "shopify":
      return "Go to Settings → Users and permissions → Add staff. Give us the permissions we need.";
    case "godaddy":
      return "Go to your GoDaddy account → Delegate Access. Add our email with website editing permissions.";
    case "weebly":
      return "Go to Settings → Editors → Invite Editor. Add our email address.";
    default:
      return "Look for 'Team', 'Users', or 'Permissions' in your platform settings and invite us as a collaborator.";
  }
}
