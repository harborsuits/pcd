// Demo theme system - 3 distinct visual styles
import { resolveVisualKey, getFallbackChain, hasTradeImagery, getVisualDebugInfo, type VisualKey } from "@/lib/visualTaxonomy";
import { pickUnique, createGallerySeed } from "@/lib/imagePick";

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
import barberHero from "@/assets/heroes/barber-hero.jpg";
// Neutral fallback heroes (NOT construction!)
import homeServicesHero from "@/assets/heroes/home-services-hero.jpg";
import professionalHero from "@/assets/heroes/professional-hero.jpg";
import defaultGenericHero from "@/assets/heroes/default-generic-hero.jpg";

const heroImages: Record<VisualKey, string> = {
  // Exact trades
  plumber: plumberHero,
  roofer: rooferHero,
  electrician: electricianHero,
  hvac: hvacHero,
  landscaper: landscaperHero,
  painter: painterHero,
  cleaner: cleanerHero,
  contractor: contractorHero,
  restaurant: restaurantHero,
  barber: barberHero,
  // Industry groups - use appropriate neutral imagery
  home_services: homeServicesHero,
  auto: homeServicesHero, // automotive uses same as home services for now
  health: professionalHero,
  personal_services: professionalHero,
  legal: professionalHero,
  real_estate: professionalHero,
  fitness: professionalHero,
  professional: professionalHero,
  retail: defaultGenericHero,
  // Neutral default - NOT construction!
  default_generic: defaultGenericHero,
};

// ============= GALLERY IMAGES =============
// Industry-specific gallery images - 6 per trade for variety
import plumberGallery1 from "@/assets/gallery/plumber-1.jpg";
import plumberGallery2 from "@/assets/gallery/plumber-2.jpg";
import plumberGallery3 from "@/assets/gallery/plumber-3.jpg";
import plumberGallery4 from "@/assets/gallery/plumber-4.jpg";
import plumberGallery5 from "@/assets/gallery/plumber-5.jpg";
import plumberGallery6 from "@/assets/gallery/plumber-6.jpg";

import rooferGallery1 from "@/assets/gallery/roofer-1.jpg";
import rooferGallery2 from "@/assets/gallery/roofer-2.jpg";
import rooferGallery3 from "@/assets/gallery/roofer-3.jpg";
import rooferGallery4 from "@/assets/gallery/roofer-4.jpg";
import rooferGallery5 from "@/assets/gallery/roofer-5.jpg";
import rooferGallery6 from "@/assets/gallery/roofer-6.jpg";

import electricianGallery1 from "@/assets/gallery/electrician-1.jpg";
import electricianGallery2 from "@/assets/gallery/electrician-2.jpg";
import electricianGallery3 from "@/assets/gallery/electrician-3.jpg";
import electricianGallery4 from "@/assets/gallery/electrician-4.jpg";
import electricianGallery5 from "@/assets/gallery/electrician-5.jpg";
import electricianGallery6 from "@/assets/gallery/electrician-6.jpg";

import hvacGallery1 from "@/assets/gallery/hvac-1.jpg";
import hvacGallery2 from "@/assets/gallery/hvac-2.jpg";
import hvacGallery3 from "@/assets/gallery/hvac-3.jpg";
import hvacGallery4 from "@/assets/gallery/hvac-4.jpg";
import hvacGallery5 from "@/assets/gallery/hvac-5.jpg";
import hvacGallery6 from "@/assets/gallery/hvac-6.jpg";

import landscaperGallery1 from "@/assets/gallery/landscaper-1.jpg";
import landscaperGallery2 from "@/assets/gallery/landscaper-2.jpg";
import landscaperGallery3 from "@/assets/gallery/landscaper-3.jpg";
import landscaperGallery4 from "@/assets/gallery/landscaper-4.jpg";
import landscaperGallery5 from "@/assets/gallery/landscaper-5.jpg";
import landscaperGallery6 from "@/assets/gallery/landscaper-6.jpg";

import painterGallery1 from "@/assets/gallery/painter-1.jpg";
import painterGallery2 from "@/assets/gallery/painter-2.jpg";
import painterGallery3 from "@/assets/gallery/painter-3.jpg";
import painterGallery4 from "@/assets/gallery/painter-4.jpg";
import painterGallery5 from "@/assets/gallery/painter-5.jpg";
import painterGallery6 from "@/assets/gallery/painter-6.jpg";

import cleanerGallery1 from "@/assets/gallery/cleaner-1.jpg";
import cleanerGallery2 from "@/assets/gallery/cleaner-2.jpg";
import cleanerGallery3 from "@/assets/gallery/cleaner-3.jpg";
import cleanerGallery4 from "@/assets/gallery/cleaner-4.jpg";
import cleanerGallery5 from "@/assets/gallery/cleaner-5.jpg";
import cleanerGallery6 from "@/assets/gallery/cleaner-6.jpg";

import contractorGallery1 from "@/assets/gallery/contractor-1.jpg";
import contractorGallery2 from "@/assets/gallery/contractor-2.jpg";
import contractorGallery3 from "@/assets/gallery/contractor-3.jpg";
import contractorGallery4 from "@/assets/gallery/contractor-4.jpg";
import contractorGallery5 from "@/assets/gallery/contractor-5.jpg";
import contractorGallery6 from "@/assets/gallery/contractor-6.jpg";

import restaurantGallery1 from "@/assets/gallery/restaurant-1.jpg";
import restaurantGallery2 from "@/assets/gallery/restaurant-2.jpg";
import restaurantGallery3 from "@/assets/gallery/restaurant-3.jpg";
import restaurantGallery4 from "@/assets/gallery/restaurant-4.jpg";
import restaurantGallery5 from "@/assets/gallery/restaurant-5.jpg";
import restaurantGallery6 from "@/assets/gallery/restaurant-6.jpg";

import barberGallery1 from "@/assets/gallery/barber-1.jpg";
import barberGallery2 from "@/assets/gallery/barber-2.jpg";
import barberGallery3 from "@/assets/gallery/barber-3.jpg";
import barberGallery4 from "@/assets/gallery/barber-4.jpg";
import barberGallery5 from "@/assets/gallery/barber-5.jpg";
import barberGallery6 from "@/assets/gallery/barber-6.jpg";

// Neutral gallery images for fallback categories - expanded to 6 each
import homeServicesGallery1 from "@/assets/gallery/home-services-1.jpg";
import homeServicesGallery2 from "@/assets/gallery/home-services-2.jpg";
import homeServicesGallery3 from "@/assets/gallery/home-services-3.jpg";
import homeServicesGallery4 from "@/assets/gallery/home-services-4.jpg";
import homeServicesGallery5 from "@/assets/gallery/home-services-5.jpg";
import homeServicesGallery6 from "@/assets/gallery/home-services-6.jpg";

import professionalGallery1 from "@/assets/gallery/professional-1.jpg";
import professionalGallery2 from "@/assets/gallery/professional-2.jpg";
import professionalGallery3 from "@/assets/gallery/professional-3.jpg";
import professionalGallery4 from "@/assets/gallery/professional-4.jpg";
import professionalGallery5 from "@/assets/gallery/professional-5.jpg";
import professionalGallery6 from "@/assets/gallery/professional-6.jpg";

import defaultGenericGallery1 from "@/assets/gallery/default-generic-1.jpg";
import defaultGenericGallery2 from "@/assets/gallery/default-generic-2.jpg";
import defaultGenericGallery3 from "@/assets/gallery/default-generic-3.jpg";
import defaultGenericGallery4 from "@/assets/gallery/default-generic-4.jpg";
import defaultGenericGallery5 from "@/assets/gallery/default-generic-5.jpg";
import defaultGenericGallery6 from "@/assets/gallery/default-generic-6.jpg";

const galleryImages: Record<VisualKey, string[]> = {
  // Exact trades - 6 images each
  plumber: [plumberGallery1, plumberGallery2, plumberGallery3, plumberGallery4, plumberGallery5, plumberGallery6],
  roofer: [rooferGallery1, rooferGallery2, rooferGallery3, rooferGallery4, rooferGallery5, rooferGallery6],
  electrician: [electricianGallery1, electricianGallery2, electricianGallery3, electricianGallery4, electricianGallery5, electricianGallery6],
  hvac: [hvacGallery1, hvacGallery2, hvacGallery3, hvacGallery4, hvacGallery5, hvacGallery6],
  landscaper: [landscaperGallery1, landscaperGallery2, landscaperGallery3, landscaperGallery4, landscaperGallery5, landscaperGallery6],
  painter: [painterGallery1, painterGallery2, painterGallery3, painterGallery4, painterGallery5, painterGallery6],
  cleaner: [cleanerGallery1, cleanerGallery2, cleanerGallery3, cleanerGallery4, cleanerGallery5, cleanerGallery6],
  contractor: [contractorGallery1, contractorGallery2, contractorGallery3, contractorGallery4, contractorGallery5, contractorGallery6],
  restaurant: [restaurantGallery1, restaurantGallery2, restaurantGallery3, restaurantGallery4, restaurantGallery5, restaurantGallery6],
  barber: [barberGallery1, barberGallery2, barberGallery3, barberGallery4, barberGallery5, barberGallery6],
  // Industry groups - expanded to 6 images each for variety
  home_services: [homeServicesGallery1, homeServicesGallery2, homeServicesGallery3, homeServicesGallery4, homeServicesGallery5, homeServicesGallery6],
  auto: [homeServicesGallery1, homeServicesGallery2, homeServicesGallery3, homeServicesGallery4, homeServicesGallery5, homeServicesGallery6],
  health: [professionalGallery1, professionalGallery2, professionalGallery3, professionalGallery4, professionalGallery5, professionalGallery6],
  personal_services: [professionalGallery1, professionalGallery2, professionalGallery3, professionalGallery4, professionalGallery5, professionalGallery6],
  legal: [professionalGallery1, professionalGallery2, professionalGallery3, professionalGallery4, professionalGallery5, professionalGallery6],
  real_estate: [professionalGallery1, professionalGallery2, professionalGallery3, professionalGallery4, professionalGallery5, professionalGallery6],
  fitness: [professionalGallery1, professionalGallery2, professionalGallery3, professionalGallery4, professionalGallery5, professionalGallery6],
  professional: [professionalGallery1, professionalGallery2, professionalGallery3, professionalGallery4, professionalGallery5, professionalGallery6],
  retail: [defaultGenericGallery1, defaultGenericGallery2, defaultGenericGallery3, defaultGenericGallery4, defaultGenericGallery5, defaultGenericGallery6],
  // Neutral default - NOT construction! - expanded to 6 images
  default_generic: [defaultGenericGallery1, defaultGenericGallery2, defaultGenericGallery3, defaultGenericGallery4, defaultGenericGallery5, defaultGenericGallery6],
};

// ============= VISUAL KEY GETTER =============
export interface VisualResult {
  visualKey: VisualKey;
  heroImage: string;
  usedFallback: boolean;
  confidence: "exact" | "keyword" | "fallback";
  matchedOn?: string;
}

/**
 * Main entry point: resolves inputs to a visual key and returns hero image
 * Logs warnings in dev mode when fallback is used
 */
export function getHeroImage(opts: {
  templateType?: string;
  category?: string;
  occupation?: string;
  businessName?: string;
}): VisualResult {
  const result = resolveVisualKey({
    templateType: opts.templateType,
    category: opts.category,
    occupation: opts.occupation,
    businessName: opts.businessName,
  });

  const heroImage = heroImages[result.visualKey] || heroImages.default_generic;
  const usedFallback = result.confidence === "fallback";

  // Dev warning for fallbacks
  if (import.meta.env.DEV && usedFallback) {
    console.warn("⚠️ VISUAL FALLBACK:", {
      inputs: opts,
      resolvedTo: result.visualKey,
      confidence: result.confidence,
      suggestion: "Add aliases in visualTaxonomy.ts for better matching",
    });
  }

  return {
    visualKey: result.visualKey,
    heroImage,
    usedFallback,
    confidence: result.confidence,
    matchedOn: result.matchedOn,
  };
}

// Build proxy URL for Google Place photos
function getPhotoUrl(photoRef: string, width: number = 400): string {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${baseUrl}/functions/v1/place-photo?ref=${encodeURIComponent(photoRef)}&w=${width}`;
}

/**
 * Get gallery images for a business with deterministic selection
 * Priority: 1) Google Place photos, 2) Curated stock, 3) Fallback chain
 * Excludes hero image from gallery to prevent duplicates
 */
export function getGalleryImagesForBusiness(opts: {
  templateType?: string;
  category?: string;
  occupation?: string;
  businessName?: string;
  city?: string;
  leadId?: string;
  count?: number;
  excludeHero?: string; // Pass the hero image URL to exclude it from gallery
  photoReferences?: string[]; // Google Place photo references (highest priority)
}): { images: string[]; visualKey: VisualKey; usedFallback: boolean; source: "google" | "stock" | "fallback" } {
  const result = resolveVisualKey({
    templateType: opts.templateType,
    category: opts.category,
    occupation: opts.occupation,
    businessName: opts.businessName,
  });

  const count = opts.count ?? 3;
  const photoRefs = opts.photoReferences || [];
  
  // Seed for deterministic selection
  const seed = createGallerySeed({
    businessName: opts.businessName,
    city: opts.city,
    leadId: opts.leadId,
    templateType: result.visualKey,
  });
  
  // Priority 1 & 2: Use Google Place photos if available
  if (photoRefs.length > 0) {
    // Build unique Google URLs, excluding hero if provided
    const googlePool = Array.from(new Set(
      photoRefs.map(ref => getPhotoUrl(ref, 400))
    )).filter(url => url !== opts.excludeHero);
    
    // Use pickUnique to deterministically select from Google pool
    const googleSeed = `${seed}::google`;
    const googlePicked = pickUnique(googlePool, Math.min(count, googlePool.length), googleSeed);
    
    // If we have enough Google photos, return them
    if (googlePicked.length >= count) {
      return {
        images: googlePicked,
        visualKey: result.visualKey,
        usedFallback: false,
        source: "google",
      };
    }
    
    // Otherwise, top up with stock (excluding hero and already-picked Google URLs)
    const stockPool = [...(galleryImages[result.visualKey] || [])];
    const filteredStock = stockPool
      .filter(img => img !== opts.excludeHero)
      .filter(img => !googlePicked.includes(img));
    const needed = count - googlePicked.length;
    const stockPicked = pickUnique(filteredStock, needed, seed);
    
    return {
      images: [...googlePicked, ...stockPicked],
      visualKey: result.visualKey,
      usedFallback: false,
      source: "google",
    };
  }

  // Priority 3: Use curated stock images
  let pool = [...(galleryImages[result.visualKey] || [])];
  let usedFallback = result.confidence === "fallback";

  // Exclude hero image from gallery pool to prevent duplicates
  if (opts.excludeHero) {
    pool = pool.filter((img) => img !== opts.excludeHero);
  }

  // If pool is too small, top up from fallback chain (NEVER from contractor for non-contractor)
  if (pool.length < count) {
    const chain = getFallbackChain(result.visualKey);
    for (const fallbackKey of chain) {
      if (pool.length >= count) break;
      const fallbackPool = (galleryImages[fallbackKey] || []).filter(
        (img) => img !== opts.excludeHero && !pool.includes(img)
      );
      const needed = count - pool.length;
      // Use deterministic picking from fallback pool too (not just slice)
      const fallbackSeed = createGallerySeed({
        businessName: opts.businessName,
        city: opts.city,
        leadId: opts.leadId,
        templateType: `${result.visualKey}::fallback::${fallbackKey}`,
      });
      const fallbackPicked = pickUnique(fallbackPool, needed, fallbackSeed);
      pool = [...pool, ...fallbackPicked];
      usedFallback = true;
    }
  }

  // Create seed for deterministic selection
  const stockSeed = createGallerySeed({
    businessName: opts.businessName,
    city: opts.city,
    leadId: opts.leadId,
    templateType: result.visualKey,
  });

  const images = pickUnique(pool, count, stockSeed);

  return {
    images,
    visualKey: result.visualKey,
    usedFallback,
    source: usedFallback ? "fallback" : "stock",
  };
}

/**
 * Simple getter for backward compatibility
 */
export function getGalleryImages(templateType?: string, count: number = 3): string[] {
  const result = getGalleryImagesForBusiness({ templateType, count });
  return result.images;
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

// Check if the visual key has trade-specific imagery
export function isKnownVisualTrade(visualKey: VisualKey): boolean {
  return hasTradeImagery(visualKey);
}

// Export debug helper for preview mode
export { getVisualDebugInfo };

// Trade-aware theme descriptions
export function getTradeAwareThemeInfo(themeId: ThemeId, templateType: string): { name: string; description: string } {
  const result = resolveVisualKey({ templateType });
  const normalizedType = result.visualKey;
  
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
    // Industry groups get generic descriptions
    home_services: {
      classic: { name: "Clean", description: "Professional and approachable" },
      bold: { name: "Pro", description: "Bold and confident presence" },
      premium: { name: "Premium", description: "Refined and trustworthy" },
    },
    professional: {
      classic: { name: "Clean", description: "Professional and modern" },
      bold: { name: "Bold", description: "Confident business presence" },
      premium: { name: "Premium", description: "Elegant professional style" },
    },
    default_generic: {
      classic: { name: "Clean", description: "Clean and professional" },
      bold: { name: "Bold", description: "Bold and confident" },
      premium: { name: "Premium", description: "Elegant and refined" },
    },
  };

  // Return trade-specific or fall back to defaults
  const tradeInfo = tradeDescriptions[normalizedType]?.[themeId];
  if (tradeInfo) return tradeInfo;

  // Default fallbacks
  return {
    classic: { name: "Clean", description: "Clean and professional — great for service businesses" },
    bold: { name: "Bold", description: "Bold and confident — stands out from competition" },
    premium: { name: "Premium", description: "Elegant and refined — perfect for premium services" },
  }[themeId];
}
