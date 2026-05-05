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

export const TOWNS: Town[] = [
  { slug: "newcastle", name: "Newcastle", blurb: "Historic river town with a tight-knit business community." },
  { slug: "damariscotta", name: "Damariscotta", blurb: "Main Street businesses, restaurants, and shops." },
  { slug: "wiscasset", name: "Wiscasset", blurb: "Working waterfront, antique shops, and seasonal traffic." },
  { slug: "boothbay-harbor", name: "Boothbay Harbor", blurb: "Tourism, marinas, inns, and seafood." },
  { slug: "camden", name: "Camden", blurb: "Schooners, hospitality, and high-end retail." },
  { slug: "rockland", name: "Rockland", blurb: "Galleries, restaurants, and the working harbor." },
  { slug: "brunswick", name: "Brunswick", blurb: "College town with a strong year-round local economy." },
  { slug: "bath", name: "Bath", blurb: "Shipbuilding heritage and downtown small businesses." },
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

export const NAP = {
  name: "Pleasant Cove Design",
  city: "Midcoast Maine",
  region: "ME",
  email: "hello@pleasantcove.design",
  phone: "(207) 380-5680",
  phoneE164: "+12073805680",
  serviceArea: "Midcoast Maine — Newcastle, Damariscotta, Wiscasset, Boothbay Harbor, Camden, Rockland, Brunswick, Bath",
};
