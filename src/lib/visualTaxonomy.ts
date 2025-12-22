// Visual Taxonomy System
// Two-layer resolver: exact trades → industry groups → neutral default
// Ensures every business gets visually appropriate imagery

// ============= VISUAL KEYS =============
// These are the canonical visual categories with dedicated image packs
export const VISUAL_KEYS = [
  // Layer A: Exact trades (11 trades with dedicated imagery)
  "plumber",
  "roofer", 
  "electrician",
  "hvac",
  "landscaper",
  "painter",
  "cleaner",
  "contractor",
  "restaurant",
  "barber",           // barber, salon, hairdresser, stylist
  "flooring",         // flooring, tile, hardwood, carpet, laminate
  // Layer B: Industry groups (broader categories)
  "home_services",    // handyman, movers, pest control, garage doors, pressure washing, etc.
  "auto",             // auto repair, detailing, towing
  "health",           // dentist, chiropractor, PT
  "personal_services", // spa, massage, nails (non-barber beauty)
  "legal",            // law firm
  "real_estate",      // agent, broker, property management
  "fitness",          // gym, trainer, yoga
  "professional",     // accounting, consulting, IT services
  "retail",           // boutiques, shops
  // Neutral fallback
  "default_generic",  // truly unknown - neutral service professional look
] as const;

export type VisualKey = typeof VISUAL_KEYS[number];

// ============= LAYER A: EXACT TRADE ALIASES =============
// Maps variations to canonical trade keys (these get trade-specific imagery)
const EXACT_TRADE_ALIASES: Record<string, VisualKey> = {
  // Painter
  painting: "painter", painters: "painter", paint: "painter", painter: "painter",
  "house painter": "painter", "residential painter": "painter", "commercial painter": "painter",
  "interior painter": "painter", "exterior painter": "painter", "deck staining": "painter",
  "cabinet painting": "painter", "fence staining": "painter",

  // Contractor
  construction: "contractor", contractor: "contractor", contracting: "contractor",
  contractors: "contractor", "general contractor": "contractor", builder: "contractor",
  building: "contractor", remodeling: "contractor", remodeler: "contractor",
  renovation: "contractor", "home builder": "contractor", framing: "contractor",
  masonry: "contractor", "concrete contractor": "contractor",

  // Electrician
  electrical: "electrician", electrician: "electrician", electricians: "electrician",
  electric: "electrician", "electrical contractor": "electrician",
  "electrical service": "electrician",

  // Roofer
  roofing: "roofer", roofer: "roofer", roofers: "roofer", roof: "roofer",
  "roofing contractor": "roofer", "roof repair": "roofer",

  // Plumber
  plumbing: "plumber", plumber: "plumber", plumbers: "plumber",
  "plumbing contractor": "plumber", "drain cleaning": "plumber",

  // Landscaper
  landscaping: "landscaper", landscaper: "landscaper", landscapers: "landscaper",
  lawn: "landscaper", "lawn care": "landscaper", "lawn service": "landscaper",
  "yard work": "landscaper", gardener: "landscaper", gardening: "landscaper",
  "tree service": "landscaper", "tree trimming": "landscaper",

  // Cleaner
  cleaning: "cleaner", cleaner: "cleaner", cleaners: "cleaner",
  "cleaning service": "cleaner", "house cleaning": "cleaner",
  "commercial cleaning": "cleaner", janitorial: "cleaner",
  maid: "cleaner", "maid service": "cleaner",

  // Restaurant
  restaurant: "restaurant", restaurants: "restaurant", dining: "restaurant",
  eatery: "restaurant", cafe: "restaurant", bistro: "restaurant",
  catering: "restaurant", "food service": "restaurant",

  // HVAC
  hvac: "hvac", heating: "hvac", cooling: "hvac",
  "air conditioning": "hvac", ac: "hvac", "hvac contractor": "hvac",
  furnace: "hvac", "heating and cooling": "hvac",

  // Barber / Hair Salon (first-class trade - NOT generic beauty!)
  barber: "barber", barbershop: "barber", "barber shop": "barber",
  hairdresser: "barber", haircutter: "barber", haircutters: "barber",
  "hair salon": "barber", salon: "barber", "hair stylist": "barber",
  stylist: "barber", haircut: "barber", haircuts: "barber",
  grooming: "barber", "men's grooming": "barber", "mens grooming": "barber",
  "hair studio": "barber", "beauty salon": "barber", "mens cuts": "barber",
  "men's haircut": "barber", "women's haircut": "barber",

  // Flooring / Tile (first-class trade)
  flooring: "flooring", "floor installer": "flooring", "flooring installer": "flooring",
  "flooring contractor": "flooring", "flooring company": "flooring",
  tile: "flooring", "tile installer": "flooring", tiling: "flooring",
  "tile contractor": "flooring", "tile setter": "flooring",
  hardwood: "flooring", "hardwood floors": "flooring", "hardwood flooring": "flooring",
  "wood floor": "flooring", "wood flooring": "flooring",
  laminate: "flooring", "laminate flooring": "flooring",
  "vinyl plank": "flooring", lvp: "flooring", "luxury vinyl": "flooring",
  carpet: "flooring", "carpet installer": "flooring", "carpet installation": "flooring",
  "floor refinishing": "flooring", "wood floor refinishing": "flooring",
  "floor sanding": "flooring", "floor polishing": "flooring",
};

// ============= LAYER B: INDUSTRY GROUP KEYWORDS =============
// Keyword patterns that map to broader industry groups
const INDUSTRY_KEYWORDS: Array<{ patterns: string[]; visualKey: VisualKey }> = [
  // Home services (catch-all for residential services not matching exact trades)
  // NOTE: flooring/tile/carpet/hardwood are handled as first-class trades above
  {
    patterns: [
      "handyman", "handy", "movers", "moving", "pest control", "exterminator",
      "garage door", "pressure wash", "power wash", "locksmith",
      "window", "blinds", "shutters", "gutter", "siding", "insulation",
      "fence", "deck", "patio", "pool service", "appliance repair", "door",
      "drywall", "countertop", "cabinet",
      "home improvement", "home repair", "home maintenance",
    ],
    visualKey: "home_services",
  },
  // Auto
  {
    patterns: [
      "auto", "car", "mechanic", "automotive", "vehicle", "tire", "oil change",
      "auto repair", "body shop", "detailing", "towing", "transmission",
      "brake", "muffler", "exhaust", "alignment",
    ],
    visualKey: "auto",
  },
  // Health
  {
    patterns: [
      "dentist", "dental", "chiropractor", "chiropractic", "physical therapy",
      "pt", "doctor", "physician", "clinic", "medical", "optometrist",
      "dermatologist", "orthodontist", "pediatric", "veterinar", "vet",
    ],
    visualKey: "health",
  },
  // Personal services (non-barber beauty: spa, massage, nails, etc.)
  {
    patterns: [
      "spa", "nail", "nails", "manicure", "pedicure", "beauty",
      "massage", "facial", "waxing", "lash", "brow", "makeup",
      "tattoo", "piercing", "cosmetic", "esthetician", "aesthetician",
    ],
    visualKey: "personal_services",
  },
  // Legal
  {
    patterns: [
      "law", "lawyer", "attorney", "legal", "notary", "paralegal",
      "law firm", "litigation", "counsel",
    ],
    visualKey: "legal",
  },
  // Real estate
  {
    patterns: [
      "real estate", "realtor", "realty", "property", "broker", "agent",
      "property management", "rental", "leasing", "apartment",
    ],
    visualKey: "real_estate",
  },
  // Fitness
  {
    patterns: [
      "gym", "fitness", "trainer", "personal training", "yoga", "pilates",
      "crossfit", "martial art", "boxing", "dance studio", "workout",
    ],
    visualKey: "fitness",
  },
  // Professional services
  {
    patterns: [
      "accounting", "accountant", "cpa", "bookkeeping", "tax",
      "consulting", "consultant", "it service", "computer", "tech support",
      "marketing", "advertising", "design", "graphic", "web design",
      "photography", "photographer", "videograph", "insurance", "financial",
      "advisor", "planning", "coaching", "tutor", "education",
    ],
    visualKey: "professional",
  },
  // Retail
  {
    patterns: [
      "shop", "store", "boutique", "retail", "gift", "florist", "flower",
      "bakery", "grocery", "market", "antique", "furniture", "jewelry",
    ],
    visualKey: "retail",
  },
];

// ============= TOKENIZER =============
// Short aliases that need word-boundary matching to avoid false positives
const SHORT_ALIASES = new Set(["ac", "pt", "law", "vet", "spa", "gym", "car", "tax"]);

/**
 * Tokenize input into words for safer matching
 */
function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ") // Replace punctuation with spaces
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

/**
 * Check if tokens contain a phrase (handles multi-word phrases)
 */
function tokensContainPhrase(tokens: string[], phrase: string): boolean {
  const phraseTokens = tokenize(phrase);
  if (phraseTokens.length === 1) {
    // Single word - check for exact token match or as substring in longer tokens
    const word = phraseTokens[0];
    // For short aliases, require exact match
    if (SHORT_ALIASES.has(word)) {
      return tokens.includes(word);
    }
    // For longer words, allow substring matching (e.g., "painting" matches "painter")
    return tokens.some((t) => t.includes(word) || word.includes(t));
  }
  // Multi-word phrase - check if consecutive tokens match
  const phraseStr = phraseTokens.join(" ");
  const inputStr = tokens.join(" ");
  return inputStr.includes(phraseStr);
}

// ============= RESOLVER =============

export interface VisualKeyResult {
  visualKey: VisualKey;
  confidence: "exact" | "keyword" | "fallback";
  matchedOn?: string;
}

/**
 * Normalize legacy keys that may still exist in data
 */
function normalizeLegacyKey(s: string): string {
  const v = (s || "").toLowerCase().trim();
  // Handle beauty → personal_services rename for backwards compat
  if (v === "beauty") return "personal_services";
  return v;
}

/**
 * Resolves any occupation/category/templateType to a canonical visualKey
 * Uses two-layer matching: exact trades → industry keywords → neutral default
 * Uses word-boundary matching to prevent false positives from short strings
 */
export function resolveVisualKey(opts: {
  occupation?: string;
  category?: string;
  templateType?: string;
  businessName?: string;
}): VisualKeyResult {
  // Combine all inputs for matching, normalizing legacy keys
  const inputs = [
    opts.occupation,
    opts.category,
    opts.templateType,
    opts.businessName,
  ]
    .filter(Boolean)
    .map((s) => normalizeLegacyKey(s as string));

  // Tokenize all inputs for word-boundary matching
  const allTokens = inputs.flatMap(tokenize);

  // LAYER A: Check exact trade aliases first
  for (const input of inputs) {
    // Direct exact match (fastest path)
    if (EXACT_TRADE_ALIASES[input]) {
      return {
        visualKey: EXACT_TRADE_ALIASES[input],
        confidence: "exact",
        matchedOn: input,
      };
    }
  }

  // Check aliases using word-boundary matching (safe for short strings)
  for (const [alias, visualKey] of Object.entries(EXACT_TRADE_ALIASES)) {
    if (tokensContainPhrase(allTokens, alias)) {
      return {
        visualKey,
        confidence: "exact",
        matchedOn: alias,
      };
    }
  }

  // LAYER B: Check industry keywords using word-boundary matching
  for (const { patterns, visualKey } of INDUSTRY_KEYWORDS) {
    for (const pattern of patterns) {
      if (tokensContainPhrase(allTokens, pattern)) {
        return {
          visualKey,
          confidence: "keyword",
          matchedOn: pattern,
        };
      }
    }
  }

  // FALLBACK: Return neutral default (NOT contractor!)
  return {
    visualKey: "default_generic",
    confidence: "fallback",
  };
}

/**
 * Get the fallback chain for a visualKey
 * Used when a pool doesn't have enough images
 */
export function getFallbackChain(visualKey: VisualKey): VisualKey[] {
  const chains: Partial<Record<VisualKey, VisualKey[]>> = {
    // Trades fall back to home_services then generic
    plumber: ["home_services", "default_generic"],
    roofer: ["home_services", "default_generic"],
    electrician: ["home_services", "default_generic"],
    hvac: ["home_services", "default_generic"],
    landscaper: ["home_services", "default_generic"],
    painter: ["home_services", "default_generic"],
    cleaner: ["home_services", "default_generic"],
    contractor: ["home_services", "default_generic"],
    // Barber falls back to personal_services then generic (NEVER home_services!)
    barber: ["personal_services", "default_generic"],
    // Flooring falls back to home_services then generic
    flooring: ["home_services", "default_generic"],
    // Industry groups fall back to generic
    home_services: ["default_generic"],
    auto: ["default_generic"],
    health: ["professional", "default_generic"],
    personal_services: ["default_generic"],
    legal: ["professional", "default_generic"],
    real_estate: ["professional", "default_generic"],
    fitness: ["professional", "default_generic"],
    professional: ["default_generic"],
    retail: ["default_generic"],
    restaurant: ["default_generic"],
    default_generic: [],
  };

  return chains[visualKey] || ["default_generic"];
}

/**
 * Check if a visualKey has dedicated trade-specific imagery
 */
export function hasTradeImagery(visualKey: VisualKey): boolean {
  const tradeKeys: VisualKey[] = [
    "plumber", "roofer", "electrician", "hvac",
    "landscaper", "painter", "cleaner", "contractor", "restaurant", "barber", "flooring",
  ];
  return tradeKeys.includes(visualKey);
}

/**
 * Dev-only debug info for visual matching
 */
export function getVisualDebugInfo(opts: {
  occupation?: string;
  category?: string;
  templateType?: string;
  businessName?: string;
}): Record<string, unknown> {
  const result = resolveVisualKey(opts);
  return {
    inputs: opts,
    visualKey: result.visualKey,
    confidence: result.confidence,
    matchedOn: result.matchedOn,
    hasDedicatedImagery: hasTradeImagery(result.visualKey),
    fallbackChain: getFallbackChain(result.visualKey),
  };
}
