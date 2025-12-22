// Trade alias normalizer - ensures consistent trade keys regardless of input variations
// This prevents fallback to default/contractor when we know the actual trade

const TRADE_ALIASES: Record<string, string> = {
  // Painter variations
  painting: "painter",
  painters: "painter",
  paint: "painter",
  painter: "painter",
  "house painter": "painter",
  "residential painter": "painter",
  "commercial painter": "painter",
  "interior painter": "painter",
  "exterior painter": "painter",

  // Contractor variations
  construction: "contractor",
  contractor: "contractor",
  contracting: "contractor",
  contractors: "contractor",
  "general contractor": "contractor",
  builder: "contractor",
  building: "contractor",
  remodeling: "contractor",
  remodeler: "contractor",
  renovation: "contractor",
  handyman: "contractor",

  // Electrician variations
  electrical: "electrician",
  electrician: "electrician",
  electricians: "electrician",
  electric: "electrician",
  "electrical contractor": "electrician",

  // Roofer variations
  roofing: "roofer",
  roofer: "roofer",
  roofers: "roofer",
  roof: "roofer",
  "roofing contractor": "roofer",

  // Plumber variations
  plumbing: "plumber",
  plumber: "plumber",
  plumbers: "plumber",
  "plumbing contractor": "plumber",

  // Landscaper variations
  landscaping: "landscaper",
  landscaper: "landscaper",
  landscapers: "landscaper",
  lawn: "landscaper",
  "lawn care": "landscaper",
  "lawn service": "landscaper",
  "yard work": "landscaper",
  gardener: "landscaper",
  gardening: "landscaper",

  // Cleaner variations
  cleaning: "cleaner",
  cleaner: "cleaner",
  cleaners: "cleaner",
  "cleaning service": "cleaner",
  "house cleaning": "cleaner",
  "commercial cleaning": "cleaner",
  janitorial: "cleaner",
  maid: "cleaner",
  "maid service": "cleaner",

  // Restaurant variations
  restaurant: "restaurant",
  restaurants: "restaurant",
  dining: "restaurant",
  eatery: "restaurant",
  cafe: "restaurant",
  bistro: "restaurant",

  // HVAC variations
  hvac: "hvac",
  heating: "hvac",
  cooling: "hvac",
  "air conditioning": "hvac",
  ac: "hvac",
  "hvac contractor": "hvac",
  furnace: "hvac",
};

// List of known normalized trade keys
export const KNOWN_TRADES = [
  "painter",
  "contractor", 
  "electrician",
  "roofer",
  "plumber",
  "landscaper",
  "cleaner",
  "restaurant",
  "hvac",
] as const;

export type KnownTrade = typeof KNOWN_TRADES[number];

/**
 * Normalizes any trade input string to a consistent key.
 * Case-insensitive, handles plurals, and common variations.
 * Returns the normalized key or the original lowercased input if no alias found.
 */
export function normalizeTradeKey(input?: string): string {
  const key = (input || "").trim().toLowerCase();
  return TRADE_ALIASES[key] || key;
}

/**
 * Checks if a trade input normalizes to a known trade with dedicated assets.
 */
export function isKnownNormalizedTrade(input?: string): boolean {
  const normalized = normalizeTradeKey(input);
  return KNOWN_TRADES.includes(normalized as KnownTrade);
}

/**
 * Dev-only warning helper to catch fallback issues
 */
export function warnIfTradeFallback(templateType?: string, businessName?: string): void {
  if (import.meta.env.DEV) {
    const normalized = normalizeTradeKey(templateType);
    const isKnown = KNOWN_TRADES.includes(normalized as KnownTrade);
    
    if (!isKnown && templateType && templateType !== "default") {
      console.warn("⚠️ TRADE IMAGE FALLBACK:", { 
        input: templateType, 
        normalized, 
        businessName,
        suggestion: `Add "${templateType.toLowerCase()}: "${normalized}" to TRADE_ALIASES in tradeNormalize.ts`
      });
    }
  }
}
