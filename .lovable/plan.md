# Build out the remaining trade demos

## Scope

Five new bespoke demo pages, matching the quality bar of the existing Roofer / Restaurant / Salon / Gallery / Boutique demos (250–420 lines each, hand-crafted layout, trade-accurate AI imagery).

| # | Trade | Route | Source vertical |
|---|-------|-------|-----------------|
| 1 | Painter | `/demos/painter` | `painters` |
| 2 | Landscaper | `/demos/landscaper` | `landscapers` |
| 3 | Contractor | `/demos/contractor` | `contractors` |
| 4 | Inn / B&B | `/demos/inn` | `inns` |
| 5 | Real Estate | `/demos/real-estate` | new — added to `VERTICALS` |

## Approach: one demo at a time

Per your note, I'll build them sequentially so we can review trade-accuracy and tone before moving on. After each demo ships you eyeball it; if it's good we move to the next, if not we iterate. **Starting with Painter.**

## Per-demo deliverables

For each demo:

1. **AI-generated imagery** (6–8 images per trade, AI-generated per the trade-accuracy rule in project memory). Stored in `src/assets/demos/<trade>/`. Trade-accurate only — no off-trade fallback ever. Saved as `.jpg` (no transparency needed).
2. **Page component** at `src/pages/demos/<Trade>Demo.tsx` — bespoke layout: hero, trust strip, services/portfolio, testimonial, CTA. Same structural quality as the existing five.
3. **Route** wired in `src/App.tsx`.
4. **`demoPath` updated** in `src/lib/localPages.ts` for that vertical so the `VerticalPage` and `MidcoastPillar` "View demo" links activate.
5. **Sitemap entry** added to `public/sitemap.xml`.
6. **Shared marketing header** (`<MarketingHeader />`) at the top so nav stays consistent.

## Painter demo (first)

- **Fictional brand**: "Coastal Coat Painters — Damariscotta, ME"
- **Sections**: Hero with "Free Estimate" CTA → trust strip (licensed/insured/local) → services (interior, exterior, cabinet refinishing, deck staining) → before/after gallery (4 pairs) → 2 testimonials → service area → estimate form / phone CTA
- **Imagery (AI)**: hero exterior repaint of a Maine coastal home, interior living room mid-paint, cabinet refinish close-up, deck staining shot, 4 before/after pairs (or 4 finished-job photos), painter at work in coveralls. All authentically Maine — clapboard, shingle, coastal palettes — never generic suburban.
- **Length target**: ~280–340 lines, matching Roofer/Salon density.

## Real Estate vertical addition

Real Estate isn't in `VERTICALS` yet. I'll add it:
```ts
{ slug: "real-estate", name: "Real Estate Agents", singular: "Agent",
  outcome: "more qualified buyer/seller leads",
  pains: ["Listings buried behind MLS frames",
          "No clear way to capture buyer leads",
          "Agent bio reads like a resume, not a person"],
  demoPath: "/demos/real-estate", service: "real-estate" }
```
This will make it appear on `MidcoastPillar` and get its own `/midcoast-maine/real-estate-agents` vertical page automatically.

## After Painter ships

I'll pause for your visual approval before generating Landscaper. Same loop for Contractor → Inn → Real Estate. If at any point you want me to batch the rest without stopping, just say go.

## Out of scope

- Dental Office demo (you said no)
- Refactoring existing demos
- Changes to `/get-demo` flow — `?service=painter` etc. already works since the verticals exist