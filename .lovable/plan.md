# Midcoast Maine Repositioning + Local SEO Plan

This plan acts on the audit. All changes are copy + new landing pages + light structural additions. No backend, auth, or operator console changes. Visual system (emerald, fonts, layout) stays.

---

## 1. Local identity (homepage + global)

**`src/pages/Index.tsx` — hero & nav**
- Subhead: add "Based in Newcastle, Maine — serving Midcoast: Damariscotta, Wiscasset, Boothbay, Camden, Rockland, Brunswick, Bath."
- Add a small "Midcoast Maine" eyebrow chip above the H1.
- New "Why local matters" one-liner under the hero CTAs.

**`src/components/portal/TrustFooter.tsx` and footer on Index/Pricing/WhatWeBuild**
- Add NAP block: "Pleasant Cove Design · Newcastle, ME · hello@pleasantcove.design · phone".
- Add service-area line.

**`src/components/SEOHead.tsx`**
- Extend props with optional `localBusiness` flag; when true, inject JSON-LD `LocalBusiness` schema (name, areaServed = Midcoast towns, address region = ME). Use on Index + each town page.

---

## 2. Social proof section (homepage)

New component `src/components/LocalProofStrip.tsx`:
- 2–3 mini case-study cards (use existing demo pages as the "before/after" — link to `/d/...` demos already generated for local trades).
- Each card: trade icon, business type, one-line outcome ("Roofer in Damariscotta — clear quote button + mobile fix"), thumbnail, link to demo.
- Inserted on Index between hero and "What's hurting your business?".

If we don't yet have real testimonials, label honestly as "Recent demos we built for local businesses" — not fake quotes.

---

## 3. Simplify pricing presentation

**`src/components/ui/pricing-section.tsx` + `src/pages/Pricing.tsx`**
- Reframe top of pricing into two phases above the bundle cards:
  - **Phase 1 — Build** (one-time, range)
  - **Phase 2 — Keep it running** (monthly care)
  - **Optional add-ons** (booking, local SEO, AI receptionist)
- Keep existing bundle cards but rename emphasis: lead with "Build + monthly care," demote "AI/CRM dashboards" language to the "Full Ops" card description only.
- Remove unsourced stats anywhere they appear; replace with plain-language statements ("Slow follow-up loses jobs.").
- Hero copy on `/pricing`: drop "AI Front Door" from the first paragraph; surface it inside Starter card only.

---

## 4. Homepage copy de-jargoning

**`src/pages/Index.tsx`**
- Audit `capabilities` array and any AI/CRM-forward headings. Push AI/CRM mentions out of hero and primary capability cards. Reframe primary capabilities as: "Fix your website," "Make the phone ring," "Book more jobs," "Stay maintained."
- Remove the unsourced "67%…" stat if present anywhere; replace with "Most people won't call back if no one answers."

---

## 5. Local + vertical SEO landing pages

New route group `src/pages/local/` with a single shared template + data file.

**`src/lib/localPages.ts`** — data:
```ts
export const TOWNS = [
  { slug: "newcastle", name: "Newcastle", ... },
  { slug: "damariscotta", ... },
  // wiscasset, boothbay, camden, rockland, brunswick, bath
];
export const VERTICALS = [
  { slug: "roofers", name: "Roofers", outcome: "more quote calls", demoSlug: "..." },
  // painters, landscapers, restaurants, salons, contractors, galleries, boutiques, marinas, inns
];
```

**`src/pages/local/TownPage.tsx`** — `/web-design/:town`
- H1: "Web design in {Town}, Maine"
- Local intro, service list, link to free review CTA, embedded map of service area, list of verticals served, JSON-LD LocalBusiness with `areaServed = town`.

**`src/pages/local/VerticalPage.tsx`** — `/websites-for/:vertical`
- H1: "Websites for {Vertical} in Midcoast Maine"
- Trade-specific pain points, link to a matching demo (`/d/...`), CTA to free review with `?service={vertical}`.

**`src/pages/local/MidcoastPillar.tsx`** — `/midcoast-maine`
- Pillar page linking to all town + vertical pages.

**`src/App.tsx`** — register the three new routes.

**`public/sitemap.xml`** — add all new URLs.

**`public/robots.txt`** — already permissive, no change.

---

## 6. Outreach surface (optional, low risk)

Add a `?ref=outreach&town=...&vertical=...` capture on `/get-demo` so the operator hub can attribute closed deals to the outreach channel. Just stash in `project_intakes.metadata`. (No schema change — column already JSONB.)

---

## Out of scope (explicitly not touching)
- Operator hub, auth, RLS, edge functions, Stripe flow, portal — all stable per last audit.
- Color system, 3D hero, fonts, animation.
- Demo generation pipeline.

---

## Technical notes
- All new pages use existing `SEOHead`, `LiquidButton`, `Card`, and the emerald page background.
- JSON-LD added via `react-helmet-async` inside `SEOHead` when `localBusiness` prop is set.
- New routes are static React pages — no DB, no edge functions.
- Total new files: ~6. Edited files: `Index.tsx`, `Pricing.tsx`, `pricing-section.tsx`, `SEOHead.tsx`, `App.tsx`, `sitemap.xml`, `TrustFooter.tsx`.
- After approval I'll ask once for: your phone number for NAP, and confirmation of the 7 town slugs + 9 vertical slugs to generate.

Approve and I'll implement, then come back with the two small inputs needed (phone + final town/vertical lists).
