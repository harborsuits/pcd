// Demo theme system - 3 distinct visual styles
export type ThemeId = "classic" | "bold" | "premium";

export interface DemoTheme {
  id: ThemeId;
  name: string;
  description: string;
  // Hero styling
  heroBg: string;
  heroOverlay: string;
  heroText: string;
  heroSubtext: string;
  // Card styling
  cardBg: string;
  cardBorder: string;
  cardHover: string;
  cardRadius: string;
  // Button styling
  buttonPrimary: string;
  buttonSecondary: string;
  // Section styling
  sectionBg: string;
  // Typography
  headingWeight: string;
  bodySize: string;
  // Spacing
  sectionPadding: string;
}

export const themes: Record<ThemeId, DemoTheme> = {
  classic: {
    id: "classic",
    name: "Clean",
    description: "Clean and professional — great for service businesses",
    heroBg: "bg-gradient-to-br from-primary/5 via-background to-accent/5",
    heroOverlay: "",
    heroText: "text-foreground",
    heroSubtext: "text-muted-foreground",
    cardBg: "bg-card",
    cardBorder: "border-border",
    cardHover: "hover:border-primary/30 hover:shadow-md",
    cardRadius: "rounded-lg",
    buttonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
    buttonSecondary: "border border-border text-foreground hover:bg-muted",
    sectionBg: "bg-muted/30",
    headingWeight: "font-bold",
    bodySize: "text-base",
    sectionPadding: "py-12",
  },
  bold: {
    id: "bold",
    name: "Contractor",
    description: "Bold and confident — stands out for contractors",
    heroBg: "bg-gradient-to-br from-primary via-primary/95 to-primary/90",
    heroOverlay: "absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBzdHJva2Utb3BhY2l0eT0iMC4wNSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNncmlkKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-50",
    heroText: "text-primary-foreground",
    heroSubtext: "text-primary-foreground/80",
    cardBg: "bg-card",
    cardBorder: "border-transparent shadow-lg",
    cardHover: "hover:shadow-xl hover:-translate-y-1",
    cardRadius: "rounded-xl",
    buttonPrimary: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg",
    buttonSecondary: "bg-primary-foreground/10 text-primary-foreground border border-primary-foreground/20 hover:bg-primary-foreground/20",
    sectionBg: "bg-gradient-to-b from-muted/50 to-background",
    headingWeight: "font-extrabold",
    bodySize: "text-lg",
    sectionPadding: "py-16",
  },
  premium: {
    id: "premium",
    name: "Boutique",
    description: "Elegant and refined — perfect for premium services",
    heroBg: "bg-gradient-to-b from-secondary via-background to-background",
    heroOverlay: "",
    heroText: "text-foreground",
    heroSubtext: "text-muted-foreground",
    cardBg: "bg-card/50 backdrop-blur-sm",
    cardBorder: "border-border/50",
    cardHover: "hover:bg-card hover:border-accent/30",
    cardRadius: "rounded-2xl",
    buttonPrimary: "bg-foreground text-background hover:bg-foreground/90",
    buttonSecondary: "border border-foreground/20 text-foreground hover:border-foreground/40",
    sectionBg: "bg-secondary/30",
    headingWeight: "font-semibold",
    bodySize: "text-base",
    sectionPadding: "py-16",
  },
};

// ============= HERO IMAGES =============
// Industry-specific hero images - custom generated for each trade
import plumberHero from "@/assets/heroes/plumber-hero.jpg";
import rooferHero from "@/assets/heroes/roofer-hero.jpg";
import electricianHero from "@/assets/heroes/electrician-hero.jpg";
import hvacHero from "@/assets/heroes/hvac-hero.jpg";
import landscaperHero from "@/assets/heroes/landscaper-hero.jpg";
import painterHero from "@/assets/heroes/painter-hero.jpg";
import cleanerHero from "@/assets/heroes/cleaner-hero.jpg";
import contractorHero from "@/assets/heroes/contractor-hero.jpg";
import restaurantHero from "@/assets/heroes/restaurant-hero.jpg";

export const industryImages: Record<string, string> = {
  plumber: plumberHero,
  roofer: rooferHero,
  electrician: electricianHero,
  hvac: hvacHero,
  landscaper: landscaperHero,
  painter: painterHero,
  cleaner: cleanerHero,
  contractor: contractorHero,
  restaurant: restaurantHero,
  default: contractorHero,
};

// HERO getter: always returns a valid URL - bulletproof fallback
export function getHeroImage(templateType?: string): string {
  const key = (templateType || "").toLowerCase();
  return industryImages[key] || industryImages.default;
}

// ============= GALLERY IMAGES =============
// Industry-specific gallery images - 3 per trade
import plumberGallery1 from "@/assets/gallery/plumber-1.jpg";
import plumberGallery2 from "@/assets/gallery/plumber-2.jpg";
import plumberGallery3 from "@/assets/gallery/plumber-3.jpg";
import rooferGallery1 from "@/assets/gallery/roofer-1.jpg";
import rooferGallery2 from "@/assets/gallery/roofer-2.jpg";
import rooferGallery3 from "@/assets/gallery/roofer-3.jpg";
import electricianGallery1 from "@/assets/gallery/electrician-1.jpg";
import electricianGallery2 from "@/assets/gallery/electrician-2.jpg";
import electricianGallery3 from "@/assets/gallery/electrician-3.jpg";
import hvacGallery1 from "@/assets/gallery/hvac-1.jpg";
import hvacGallery2 from "@/assets/gallery/hvac-2.jpg";
import hvacGallery3 from "@/assets/gallery/hvac-3.jpg";
import landscaperGallery1 from "@/assets/gallery/landscaper-1.jpg";
import landscaperGallery2 from "@/assets/gallery/landscaper-2.jpg";
import landscaperGallery3 from "@/assets/gallery/landscaper-3.jpg";
import painterGallery1 from "@/assets/gallery/painter-1.jpg";
import painterGallery2 from "@/assets/gallery/painter-2.jpg";
import painterGallery3 from "@/assets/gallery/painter-3.jpg";
import cleanerGallery1 from "@/assets/gallery/cleaner-1.jpg";
import cleanerGallery2 from "@/assets/gallery/cleaner-2.jpg";
import cleanerGallery3 from "@/assets/gallery/cleaner-3.jpg";
import contractorGallery1 from "@/assets/gallery/contractor-1.jpg";
import contractorGallery2 from "@/assets/gallery/contractor-2.jpg";
import contractorGallery3 from "@/assets/gallery/contractor-3.jpg";
import restaurantGallery1 from "@/assets/gallery/restaurant-1.jpg";
import restaurantGallery2 from "@/assets/gallery/restaurant-2.jpg";
import restaurantGallery3 from "@/assets/gallery/restaurant-3.jpg";

export const industryGalleries: Record<string, string[]> = {
  plumber: [plumberGallery1, plumberGallery2, plumberGallery3],
  roofer: [rooferGallery1, rooferGallery2, rooferGallery3],
  electrician: [electricianGallery1, electricianGallery2, electricianGallery3],
  hvac: [hvacGallery1, hvacGallery2, hvacGallery3],
  landscaper: [landscaperGallery1, landscaperGallery2, landscaperGallery3],
  painter: [painterGallery1, painterGallery2, painterGallery3],
  cleaner: [cleanerGallery1, cleanerGallery2, cleanerGallery3],
  contractor: [contractorGallery1, contractorGallery2, contractorGallery3],
  restaurant: [restaurantGallery1, restaurantGallery2, restaurantGallery3],
  default: [contractorGallery1, contractorGallery2, contractorGallery3],
};

// GALLERY getter: always returns valid images with safe fallback
export function getGalleryImages(templateType?: string, count: number = 3): string[] {
  const key = (templateType || "").toLowerCase();
  const pool = industryGalleries[key] || industryGalleries.default;
  return pool.slice(0, Math.max(1, Math.min(count, pool.length)));
}

// ============= UTILITIES =============

// Get initials from business name for logo circle
export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(word => word.length > 0)
    .slice(0, 2)
    .map(word => word[0].toUpperCase())
    .join("");
}

// Trade-aware theme descriptions
export function getTradeAwareThemeInfo(themeId: ThemeId, templateType: string): { name: string; description: string } {
  const tradeDescriptions: Record<string, Record<ThemeId, { name: string; description: string }>> = {
    plumber: {
      classic: { name: "Clean", description: "Professional and trustworthy — shows you're reliable" },
      bold: { name: "Pro", description: "Bold and confident — perfect for emergency services" },
      premium: { name: "Premium", description: "Upscale look for high-end plumbing work" },
    },
    electrician: {
      classic: { name: "Clean", description: "Professional look — shows safety and expertise" },
      bold: { name: "Pro", description: "Bold style — great for commercial electrical" },
      premium: { name: "Premium", description: "Refined look for premium electrical services" },
    },
    roofer: {
      classic: { name: "Clean", description: "Professional — builds trust for big jobs" },
      bold: { name: "Pro", description: "Bold and strong — shows you mean business" },
      premium: { name: "Premium", description: "Upscale look for custom roofing work" },
    },
    hvac: {
      classic: { name: "Clean", description: "Professional — reliable comfort specialists" },
      bold: { name: "Pro", description: "Bold presence — stands out for HVAC pros" },
      premium: { name: "Premium", description: "Refined style for high-end HVAC systems" },
    },
    landscaper: {
      classic: { name: "Clean", description: "Fresh and professional — shows quality care" },
      bold: { name: "Pro", description: "Bold look — great for commercial landscaping" },
      premium: { name: "Boutique", description: "Elegant style for luxury landscape design" },
    },
    painter: {
      classic: { name: "Clean", description: "Clean look — shows attention to detail" },
      bold: { name: "Pro", description: "Bold style — perfect for commercial painters" },
      premium: { name: "Boutique", description: "Artistic feel for premium painting services" },
    },
    cleaner: {
      classic: { name: "Clean", description: "Fresh and minimal — just like your work" },
      bold: { name: "Pro", description: "Bold presence for commercial cleaning" },
      premium: { name: "Boutique", description: "Upscale look for premium cleaning services" },
    },
    contractor: {
      classic: { name: "Clean", description: "Professional — trusted for any project" },
      bold: { name: "Pro", description: "Bold and confident — shows you get it done" },
      premium: { name: "Premium", description: "Refined style for custom home builds" },
    },
    restaurant: {
      classic: { name: "Clean", description: "Fresh and inviting — family-friendly feel" },
      bold: { name: "Bold", description: "Bold look — makes a statement" },
      premium: { name: "Fine Dining", description: "Elegant style for upscale dining" },
    },
  };

  // Return trade-specific or fall back to defaults
  const tradeInfo = tradeDescriptions[templateType]?.[themeId];
  if (tradeInfo) return tradeInfo;

  // Default fallbacks
  return {
    classic: { name: "Clean", description: "Clean and professional — great for service businesses" },
    bold: { name: "Bold", description: "Bold and confident — stands out from competition" },
    premium: { name: "Premium", description: "Elegant and refined — perfect for premium services" },
  }[themeId];
}
