# Pricing Page Refresh — Public Page Only

Update the public pricing page to reflect the new bundle, care plan, and à la carte structure. No Stripe, checkout, or backend billing changes.

## New pricing structure

**Bundles** (monthly subscription + one-time build)

| Bundle | Monthly | One-time build |
|---|---|---|
| PCD Starter System | $395/mo | $1,500–$2,500 |
| PCD Growth System | $650/mo | $2,500–$4,000 |
| PCD Full Operations | $895/mo | $4,000–$6,500 |

**Care Plans** (maintenance only, no bundle required)

| Plan | Price |
|---|---|
| Monthly Care – Starter | $125/mo |
| Monthly Care – Growth | $175/mo |

**À La Carte Services** (keep existing 9, add 1 new)

- SEO Audit & Optimization — from $350
- Landing Page — from $500
- Content Refresh — from $250
- Booking Integration — from $300
- Google Business Profile Setup — from $150
- Call Routing Setup — from $200
- Conversion Tracking Setup — from $200
- Forms & Lead Routing — from $200
- Website Cleanup / Fixes — from $300
- **Online Ordering Integration — from $500** (NEW) — scope copy: "Integrate or clean up an existing ordering platform (Toast, Square, Shopify, ChowNow, or similar). Does not include building a custom ordering system from scratch."

## Files to change

1. **`src/lib/pricingMenu.ts`** — single source of truth used by pricing page, intake summary, and demo flows.
   - `BUNDLE_TIERS`: update `price` strings (monthly + build range) and keep feature lists.
   - `CARE_PLANS`: update `monthlyPrice` to 125 / 175. Recompute `yearlyPrice` at a clean ~10% prepay discount (Starter ≈ 1,350; Growth ≈ 1,890) — keeps the existing yearly toggle working without a code change.
   - `ALACARTE_SERVICES`: append `online_ordering_integration` entry with the scope copy above.

2. **`src/components/ui/pricing-section.tsx`** — the rendered page.
   - Update the local `plans` array: `monthlyPrice` (395 / 650 / 895), `yearlyPrice` (10% prepay: 4,266 / 7,020 / 9,666), `buildRange` ($1,500–$2,500 / $2,500–$4,000 / $4,000–$6,500).
   - Rewrite intro/section copy (see "Copy" below).
   - No structural/layout changes. Monthly/Yearly toggle stays. À la carte modal flow stays.

3. **`src/pages/Pricing.tsx`** — refresh hero copy and the FAQ `answer` strings to match new ranges; update the "$1,500 and $4,500" line and care-plan line. Keep SEO scaffolding intact.

## Copy direction (professional, simple, local, trustworthy)

- **Hero subhead:** "Two parts: a one-time build to launch your site or system, and a small monthly plan that keeps it running and improving."
- **Bundles intro:** "Each bundle pairs a one-time website or system build with an ongoing monthly plan. The monthly covers hosting, maintenance, AI/booking features where included, and steady improvements — so your site keeps working for you instead of going stale."
- **Build vs monthly explainer band** (new small block above the bundle cards):
  - *Build fee* — designing, building, and launching your website or system. Paid once.
  - *Monthly plan* — hosting, updates, small changes, AI/booking features, and ongoing tuning. Cancel anytime.
- **Care Plans intro:** "Already have a website? Pick a care plan to keep it healthy — no bundle required."
- **À la carte intro:** unchanged framing; add note that we work with what you already use (Toast, Square, Shopify, ChowNow, etc.) for the new ordering item.
- **FAQ rewrite** on `Pricing.tsx`:
  - "How much does a website cost?" → range now "$1,500–$6,500 for the one-time build, depending on scope," monthly "$125–$895 depending on whether you just want care or a full system."
  - "What's included in the care plan?" → reflect new $125 / $175 tiers.
  - Keep "no long-term contracts" and "free review" FAQs.

## Explicitly NOT in scope

- No changes to Stripe products, prices, payment links, webhooks, deposit logic, or any `supabase/functions/**` billing code.
- No changes to intake wizard logic, demo claim flow, or operator billing.
- Pricing IDs (`bundle_starter`, `care_starter`, etc.) stay the same so downstream references don't break.

## Verification

- Visit `/pricing` — confirm three bundles show new monthly + build ranges, toggle switches yearly correctly, two care plans show $125 / $175, ten à la carte cards render including Online Ordering Integration with the correct scope copy in its modal description.
- Confirm `IntakeSummary` / `PricingSummary` still render selected tier labels correctly (they read from `findTierById`, which is unaffected by price-string changes).
