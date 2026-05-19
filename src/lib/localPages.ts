// Midcoast Maine local + vertical SEO data

export interface Town {
  slug: string;
  name: string;
  blurb: string;
}

export interface Vertical {
  slug: string;
  name: string;
  singular: string;
  outcome: string; // "more quote calls"
  pains: string[];
  demoPath?: string; // e.g. /demos/roofer
  service?: string; // ?service= param for /get-demo
}

export interface Region {
  slug: string;
  name: string;
  blurb: string;
  towns: string[]; // town slugs
}

export const TOWNS: Town[] = [
  // Midcoast (home base)
  { slug: "newcastle", name: "Newcastle", blurb: "Historic river town with a tight-knit business community." },
  { slug: "damariscotta", name: "Damariscotta", blurb: "Main Street businesses, restaurants, and shops." },
  { slug: "wiscasset", name: "Wiscasset", blurb: "Working waterfront, antique shops, and seasonal traffic." },
  { slug: "boothbay-harbor", name: "Boothbay Harbor", blurb: "Tourism, marinas, inns, and seafood." },
  { slug: "camden", name: "Camden", blurb: "Schooners, hospitality, and high-end retail." },
  { slug: "rockland", name: "Rockland", blurb: "Galleries, restaurants, and the working harbor." },
  { slug: "brunswick", name: "Brunswick", blurb: "College town with a strong year-round local economy." },
  { slug: "bath", name: "Bath", blurb: "Shipbuilding heritage and downtown small businesses." },
  { slug: "belfast", name: "Belfast", blurb: "Creative hub with independent shops, restaurants, and makers." },
  // Greater Portland
  { slug: "portland", name: "Portland", blurb: "Maine's largest city — restaurants, retail, and professional services." },
  { slug: "freeport", name: "Freeport", blurb: "Destination retail, inns, and outdoor brands." },
  { slug: "yarmouth", name: "Yarmouth", blurb: "Coastal community with strong locally-owned businesses." },
  { slug: "falmouth", name: "Falmouth", blurb: "Established town with professional and home-service trades." },
  { slug: "cumberland", name: "Cumberland", blurb: "Residential community supporting local trades and services." },
  // Southern Maine
  { slug: "saco", name: "Saco", blurb: "Growing downtown with shops, services, and contractors." },
  { slug: "biddeford", name: "Biddeford", blurb: "Mill city revival — restaurants, makers, and new ventures." },
  { slug: "kennebunk", name: "Kennebunk", blurb: "Inns, boutiques, and high-end seasonal businesses." },
  { slug: "wells", name: "Wells", blurb: "Year-round and seasonal businesses along Route 1." },
  // Central / Down East
  { slug: "augusta", name: "Augusta", blurb: "Capital region small businesses and trades." },
  { slug: "waterville", name: "Waterville", blurb: "Revitalized downtown with shops and services." },
  { slug: "bangor", name: "Bangor", blurb: "Northern hub for small businesses across eastern Maine." },
  { slug: "ellsworth", name: "Ellsworth", blurb: "Gateway to Down East with year-round local business." },
  { slug: "bar-harbor", name: "Bar Harbor", blurb: "Inns, restaurants, and seasonal retail near Acadia." },
];

export const REGIONS: Region[] = [
  {
    slug: "midcoast",
    name: "Midcoast Maine",
    blurb: "Our home base — Newcastle, Damariscotta, Boothbay, Camden, Rockland, Brunswick, Bath, Belfast.",
    towns: ["newcastle", "damariscotta", "wiscasset", "boothbay-harbor", "camden", "rockland", "brunswick", "bath", "belfast"],
  },
  {
    slug: "greater-portland",
    name: "Greater Portland",
    blurb: "Portland, Freeport, Yarmouth, Falmouth, Cumberland, and surrounding towns.",
    towns: ["portland", "freeport", "yarmouth", "falmouth", "cumberland"],
  },
  {
    slug: "southern-maine",
    name: "Southern Maine",
    blurb: "Saco, Biddeford, Kennebunk, Wells, and the York County coast.",
    towns: ["saco", "biddeford", "kennebunk", "wells"],
  },
  {
    slug: "central-maine",
    name: "Central Maine",
    blurb: "Augusta, Waterville, and the Kennebec Valley.",
    towns: ["augusta", "waterville"],
  },
  {
    slug: "down-east",
    name: "Down East & Bangor",
    blurb: "Bangor, Ellsworth, Bar Harbor, and the Acadia region.",
    towns: ["bangor", "ellsworth", "bar-harbor"],
  },
];

export const VERTICALS: Vertical[] = [
  {
    slug: "roofers",
    name: "Roofers",
    singular: "Roofer",
    outcome: "more quote calls",
    pains: [
      "Customers can't tell if you serve their town",
      "No clear quote button on mobile",
      "Photos of past jobs are buried or missing",
    ],
    demoPath: "/demos/roofer",
    service: "roofer",
  },
  {
    slug: "painters",
    name: "Painters",
    singular: "Painter",
    outcome: "more booked estimates",
    pains: [
      "No gallery of completed jobs",
      "Contact form is broken or buried",
      "Site looks dated — feels untrustworthy",
    ],
    demoPath: "/demos/painter",
    service: "painter",
  },
  {
    slug: "landscapers",
    name: "Landscapers",
    singular: "Landscaper",
    outcome: "fewer missed leads in season",
    pains: [
      "No way to request a quote online",
      "Service area is unclear",
      "Mobile site is hard to use",
    ],
    demoPath: "/demos/landscaper",
    service: "landscaper",
  },
  {
    slug: "restaurants",
    name: "Restaurants",
    singular: "Restaurant",
    outcome: "more reservations and orders",
    pains: [
      "Menu is a slow PDF",
      "Hours and reservations are hard to find",
      "No mobile-friendly ordering",
    ],
    demoPath: "/demos/restaurant",
    service: "restaurant",
  },
  {
    slug: "salons",
    name: "Salons & Barbers",
    singular: "Salon",
    outcome: "more online bookings",
    pains: [
      "Booking lives only on Instagram",
      "No clear list of services and prices",
      "Site looks generic",
    ],
    demoPath: "/demos/salon",
    service: "salon",
  },
  {
    slug: "contractors",
    name: "Contractors",
    singular: "Contractor",
    outcome: "qualified project inquiries",
    pains: [
      "No portfolio of past work",
      "No clear next step for serious leads",
      "Site doesn't match the quality of your work",
    ],
    demoPath: "/demos/contractor",
    service: "contractor",
  },
  {
    slug: "galleries",
    name: "Galleries",
    singular: "Gallery",
    outcome: "more visitors and sales",
    pains: [
      "Current shows are hard to find",
      "Artist pages are missing or thin",
      "No mobile-friendly gallery view",
    ],
    demoPath: "/demos/gallery",
    service: "gallery",
  },
  {
    slug: "boutiques",
    name: "Boutiques",
    singular: "Boutique",
    outcome: "more foot traffic and online orders",
    pains: [
      "No simple way to browse what's in store",
      "Hours and location buried",
      "No newsletter or repeat-customer hook",
    ],
    demoPath: "/demos/boutique",
    service: "boutique",
  },
  {
    slug: "inns",
    name: "Inns & B&Bs",
    singular: "Inn",
    outcome: "more direct bookings",
    pains: [
      "Booking flow sends people to a third party",
      "Photos don't sell the experience",
      "No clear story or seasonal info",
    ],
    service: "inn",
  },
];

// Hand-curated by actual Midcoast Maine geography (not list order).
// Used by TownPage to render an honest "Nearby towns" strip — keeps internal
// linking geographically truthful instead of spammy.
export const TOWN_NEIGHBORS: Record<string, string[]> = {
  "newcastle":       ["damariscotta", "wiscasset", "boothbay-harbor"],
  "damariscotta":    ["newcastle", "wiscasset", "boothbay-harbor"],
  "wiscasset":       ["newcastle", "damariscotta", "bath"],
  "boothbay-harbor": ["damariscotta", "newcastle", "wiscasset"],
  "bath":            ["brunswick", "wiscasset", "damariscotta"],
  "brunswick":       ["bath", "freeport", "yarmouth"],
  "camden":          ["rockland", "belfast", "brunswick"],
  "rockland":        ["camden", "belfast", "brunswick"],
  "belfast":         ["camden", "rockland", "bangor"],
  "portland":        ["falmouth", "yarmouth", "freeport"],
  "freeport":        ["yarmouth", "brunswick", "portland"],
  "yarmouth":        ["freeport", "falmouth", "cumberland"],
  "falmouth":        ["portland", "cumberland", "yarmouth"],
  "cumberland":      ["yarmouth", "falmouth", "freeport"],
  "saco":            ["biddeford", "kennebunk", "portland"],
  "biddeford":       ["saco", "kennebunk", "wells"],
  "kennebunk":       ["wells", "biddeford", "saco"],
  "wells":           ["kennebunk", "biddeford", "saco"],
  "augusta":         ["waterville", "brunswick", "belfast"],
  "waterville":      ["augusta", "bangor", "belfast"],
  "bangor":          ["ellsworth", "belfast", "waterville"],
  "ellsworth":       ["bar-harbor", "bangor", "belfast"],
  "bar-harbor":      ["ellsworth", "bangor", "belfast"],
};

export const NAP = {
  name: "Pleasant Cove Design",
  city: "Midcoast Maine",
  region: "ME",
  email: "hello@pleasantcove.design",
  phone: "(207) 380-5680",
  phoneE164: "+12073805680",
  serviceArea: "Based in Midcoast Maine — serving small businesses statewide, from Portland to Bangor and everywhere in between.",
};
