# AEO/SEO Upgrade — v2 (with your three additions)

Goal: top-tier AI citation surface — speakable text, entity-linked services, direct booking action, geographically honest internal links.

## Pass 1 — `SEOHead` schema additions

Extend `src/components/SEOHead.tsx`:

**1. `speakableSpecification` on every WebPage node**
- Default selectors: `h1`, `[data-speakable]`
- Pages opt extra blocks in by adding `data-speakable` to hero subhead / first paragraph

**2. Organization upgrades** (in `baseGraph`)
- `contactPoint`: `{ telephone: NAP.phoneE164, contactType: "customer service", areaServed: "US", availableLanguage: "English" }`
- **`logo` as `ImageObject`**: `{ "@type": "ImageObject", url: \`${DOMAIN}/apple-touch-icon.png\`, width: 512, height: 512, caption: NAP.name }`
- **`potentialAction: ReserveAction`**: `{ "@type": "ReserveAction", name: "Book a Free Demo", target: { "@type": "EntryPoint", urlTemplate: \`${DOMAIN}/get-demo\`, actionPlatform: ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"] } }`
- `sameAs`: new optional `socialLinks?: string[]` prop merged in (Google Business Profile URL once supplied)
- **`hasOfferCatalog`**: `OfferCatalog` whose `itemListElement` is an array of `{ "@type": "Offer", itemOffered: { "@id": \`${DOMAIN}/websites-for/${slug}#service\` } }` — one per vertical in `VERTICALS`. Statically generated from `localPages.ts`.

**3. `openingHoursSpecification` on `ProfessionalService`** (localBusiness pages)
- Mon–Fri 09:00–17:00, plus a free-text `note: "Also by appointment"`

**4. `Service` schema for `/websites-for/[vertical]` pages**
- New optional `service?: { slug, name, description, serviceType }` prop
- Emits node with **`"@id": \`${DOMAIN}/websites-for/${slug}#service\`"`** so it's cross-referenced by `hasOfferCatalog`
- `provider: { "@id": ORG_ID }`, `areaServed: DEFAULT_AREAS`, `audience: { "@type": "BusinessAudience", audienceType: "Small business owners" }`

**5. `datePublished` / `dateModified` on WebPage node**
- Optional props; default `dateModified` to today's build date

## Pass 2 — Content / linking

**6. FAQ answer-quality rewrite** (Home, Pricing, WhatWeBuild, MidcoastPillar)
- Self-contained, 2–3 sentences, lead with direct answer, include brand name once where natural
- Specific rewrites: Pricing "How much does a small business website cost?" (give the actual range), WhatWeBuild "Do you handle SEO?" (lead with yes + concrete deliverables), Home "How does pricing work?" (lead with the model)

**7. Internal linking — geographically honest neighbors**

Hard-coded `TOWN_NEIGHBORS` map in `src/lib/localPages.ts`, based on actual Midcoast geography:

```ts
export const TOWN_NEIGHBORS: Record<string, string[]> = {
  "newcastle":       ["damariscotta", "wiscasset", "boothbay-harbor"],
  "damariscotta":    ["newcastle", "wiscasset", "boothbay-harbor"],
  "wiscasset":       ["newcastle", "damariscotta", "bath"],
  "boothbay-harbor": ["damariscotta", "newcastle", "wiscasset"],
  "bath":            ["brunswick", "wiscasset", "damariscotta"],
  "brunswick":       ["bath", "wiscasset", "damariscotta"],
  "camden":          ["rockland", "brunswick", "bath"],
  "rockland":        ["camden", "brunswick", "bath"],
};
```

`TownPage` renders a "Nearby towns" strip from this map (3 links per page).

**8. Vertical link footer on pillar + town pages**
- Explicit `<Link>` list to all `/websites-for/[vertical]` slugs in a small footer block, so every vertical service page is always one hop from a local landing page (avoids orphaning if crawlers don't traverse the GlowCards).

**9. Speakable opt-in markup**
- Add `data-speakable` to: Home hero headline + typewriter subhead; Pricing H1 + two-phase blurb; WhatWeBuild H1 + intro; MidcoastPillar H1 + first paragraph; TownPage H1 + first paragraph; VerticalPage H1 + first paragraph.

## Out of scope

Per-vertical FAQ pages, more social meta variants, hreflang, AggregateRating.

## Files touched

- `src/components/SEOHead.tsx` — schema additions, new props (`socialLinks`, `service`, `datePublished`, `dateModified`)
- `src/lib/localPages.ts` — `TOWN_NEIGHBORS` map
- `src/pages/Index.tsx` — FAQ rewrite, dates, speakable
- `src/pages/Pricing.tsx` — FAQ rewrite, dates, speakable
- `src/pages/WhatWeBuild.tsx` — FAQ rewrite, dates, speakable
- `src/pages/local/MidcoastPillar.tsx` — speakable, vertical link footer, dates
- `src/pages/local/TownPage.tsx` — Nearby Towns strip, vertical link footer, speakable, dates
- `src/pages/local/VerticalPage.tsx` — `service` prop wiring, speakable, dates

## Pending input (won't block — I'll use defaults)

- Business hours: defaulting to Mon–Fri 9–5 + "by appointment" note
- Google Business Profile URL: omitted from `sameAs` until provided
- Phone `(207) 380-5680` — already in `NAP.phoneE164`, used as-is

No backend or DB changes.
