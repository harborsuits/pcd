# Pricing Menu Overhaul — Scope-Based Projects + Usage-Based AI

Replace the current bundle model ($395/$650/$895 with capped build ranges) with four scope-based project offerings, revised care plans, updated individual services, and a setup + management + usage AI model. Visual identity, components, and layout system stay exactly as they are — only content, data, and section ordering change.

## 0. Existing customers are insulated from the new catalog

The new catalog is a **public offer catalog for new inquiries and proposals only**.

- Legacy IDs (`bundle_starter`, `bundle_growth`, `bundle_full_ops`, `website_essential/growth/premium`, `ai_front_door/booking/full`, `care_starter`, `care_growth`) and their original labels and prices are kept in a `LEGACY_OFFERS` record, never deleted. Anything already stored in `projects.selected_tier` or an intake record keeps resolving to the exact label, scope and price the customer agreed to.
- Lookup helpers resolve against current offers first, then `LEGACY_OFFERS`, so operator summaries, onboarding, and project detail views for existing customers display unchanged.
- Legacy offers are excluded from every public selector (pricing page, intake tier step) — visible only where a stored selection is being displayed.
- No silent remapping: an old "Growth System" selection is never rewritten into a new website package. Old `?tier=` deep links keep working via an explicit param map that resolves to the legacy offer they always meant, and new CTAs use new IDs so each inquiry records the offering the customer actually clicked.
- `create-deposit-checkout` and its `TIER_DEPOSITS` map are left untouched. New offerings are not added to that map; deposits for new proposals continue to come from the operator-set `deposit_amount_cents`, which already overrides tier lookup. No billing behaviour changes.

## 1. Shared pricing data (`src/lib/pricingMenu.ts`)

This file is the single source used by the pricing page, the intake wizard, the onboarding wizard, and operator summaries. All new copy lives here so displays can't drift.


- **New `PROJECT_OFFERINGS`** (replaces `BUNDLE_TIERS`):
  - Online Brochure — From $1,500 (one straightforward page, supplied info/logo/photos, short intro + service overview, small image selection, contact + location, mobile-friendly, basic technical SEO). Explicit note that extra pages, booking, custom forms, integrations, and substantial copywriting are quoted separately. No "1–5 pages" language.
  - Custom Business Website — From $3,500 (business-specific design, refined supplied content, service/project presentation, gallery + standard inquiry form where appropriate, basic technical SEO and analytics). Note: proposal sets pages, content volume, functionality, revisions, final price.
  - Expanded Websites & Online Stores — From $6,000 (larger portfolios/case studies, deeper service or product content, stores on established commerce platforms, more involved inquiry workflows, connections to existing tools) — framed as examples, not inclusions. No ceiling.
  - Custom Business Systems — Custom proposal (portals, advanced booking, CRM connections, AI call answering, automation, custom integrations) with the "implementation and ongoing management quoted separately; AI services also include usage-based charges" line.
- **`CARE_PLANS` rewritten**: Website Care from $150/mo (hosting within proposal allowance, uptime monitoring, recoverable backups, routine maintenance, scheduled contact-feature checks, up to 30 minutes of minor content edits per month, business-hours support) and Managed Website Care from $275/mo (everything in Website Care, **up to 90 minutes total of minor content edits per month — not 90 on top of 30**, priority scheduling, quarterly performance review). `yearlyPrice` removed. Shared terms added as a `CARE_TERMS` list: no rollover, definition of minor edits, separately scoped work, $125/hr with approval, allowances in proposal, custom quotes for complex sites.
- **`ALACARTE_SERVICES` repriced and retitled** to the ten services and prices in the spec, with "Built & Managed" removed from every title and scope limits in each description. New line clarifying that ordinary small edits go through a care-plan allowance or a small approved update.
- **New `AI_MODEL` data** (replaces `AI_TIERS` monthly figures): the three components — Setup & Implementation (custom quote), Ongoing Management (based on scope), Usage (billed at agreed rates, with the per-service usage measures) — plus the billing-transparency bullets and the "what if we use more than expected" FAQ. No invented numeric rates.
- **Starting prices are display strings, never arithmetic.** New offerings carry a `priceDisplay` string ("From $1,500", "Custom proposal") and an explicit `isStartingPrice: true` / `quoteOnly: true` flag — no numeric `amount` field that a total could be summed from. Any retained helper that previously produced a computed total is audited and either removed or changed to return a quote-required state; "Custom proposal" can never resolve to $0, "From $3,500" can never render as an accepted quote, and AI usage is never dropped from an automatically calculated monthly figure (there is no automatic monthly figure for AI — setup, management, and usage are shown as three separate items).
- `RETAINER_ADDONS` and `WEBSITE_TIERS` are kept for existing intake code, re-pointed at the new data with legacy entries preserved per section 0.


## 2. Pricing page (`src/pages/Pricing.tsx` + `src/components/ui/pricing-section.tsx`)

Reordered to: intro and project offerings → what determines project pricing → website care → focused individual services → AI receptionist and business automation → pricing FAQ and inquiry CTA.

- New hero intro copy ("Practical starting points. Pricing built around your project.") and the scope-explainer bullets.
- Four offering cards using the existing `Card` grid (four across on desktop, stacked on mobile) with starting price, description, scope list, and the scope-limit note visible on the card.
- **Yearly/monthly toggle removed** along with the prepaid-discount line; care prices display plainly as `$150/mo` and `$275/mo` with "From".
- Care section shows both plans plus the shared-terms list.
- Individual services grid keeps the existing click-to-request modal behaviour; only labels, prices, and descriptions change.
- New AI section explaining setup + management + usage, with the three components presented side by side and the billing-transparency notes.
- Pilot block reworded: seven-day pilot remains an inquiry option for selected businesses, scope and any fees agreed beforehand — no free/unlimited trial language.
- CTAs become "Discuss your project" / "Request a quote", all pointing at the existing `/get-demo` routes with the same query parameters so lead handling is unchanged.
- FAQ on the page updated to match the new structure, including the usage-overage question.

## 3. Related references

- `src/pages/local/TownPage.tsx` and `src/pages/local/VerticalPage.tsx`: FAQ answers rewritten to the new starting prices and care/AI model (removing the $1,500–$6,500 cap and $395–$895 bundle framing) while keeping the town/vertical specificity.
- `public/llms.txt`: pricing facts block updated to the new starting prices, care plans, and usage-based AI model.
- `src/pages/AiReceptionist.tsx`: add a short pricing-model paragraph (setup + management + usage) in existing styling, and route its CTAs to the quote flow.
- `src/pages/WhatWeBuild.tsx` and homepage: adjust any pricing phrasing that implies flat monthly bundles. No visual edits.
- `src/pages/IntakeWizard.tsx`: tier options become the four project offerings (new IDs) plus the AI setup/management/usage framing. The `?tier=` param map keeps every old value working and resolves it to its legacy offer. An **optional** website budget select is added on the website path: Under $1,500 / $1,500–$3,000 / $3,000–$6,000 / $6,000–$12,000 / $12,000+ / Not sure yet — skippable, never blocking.
- **The budget answer is actually stored.** It is added as a `budget_range` field on the `leads/request-demo` payload, and `supabase/functions/leads/index.ts` appends it to the operator-visible `notesLines` block (the same mechanism already used for timeline, website goal, and selected services) so it lands on the project record. This is inquiry metadata only — no billing tables involved. Verified end to end before the work is called done.
- `src/pages/portal/OnboardingWizard.tsx`, `src/components/intake/IntakeForm.tsx`, and operator summaries inherit labels through `pricingMenu.ts`; existing stored selections resolve through the legacy lookup and display unchanged.

## 4. What is not touched

No Stripe products, checkout, payment links, subscriptions, invoices, billing tables, deposit logic, or automated metering. The only edge-function change is appending the optional budget answer to inquiry notes. No claims that metering, usage dashboards, or spending controls are operational — they are described as agreed in the proposal. Existing client agreements, negotiated prices, and historical selections stay exactly as recorded.

## 5. Verification

Beyond the type check:

1. **Existing customer regression** — open a project whose `selected_tier` is a legacy ID and confirm the operator view, onboarding summary, and intake summary still show the original offering label and price, unmodified.
2. **All four offerings** — click each offering CTA and confirm the resulting inquiry records that specific offering ID, and that an old `?tier=growth` link still resolves to the legacy Growth System rather than a new package.
3. **Budget persistence** — submit an inquiry with a budget selected and one with it skipped; confirm the answer reaches the stored project notes and the skipped case submits cleanly.
4. **No computed totals** — confirm nowhere renders a summed total from starting prices, "Custom proposal" never shows as $0, and AI never shows a single flat monthly number.
5. **Copy checks** — Managed care reads "up to 90 minutes total per month"; brochure scope reads visibly limited; no "1–5 pages" at $1,500–$2,500; no capped build ranges; no ceiling on larger projects; one-time vs recurring clearly separated.
6. **Layout** — desktop and 390px mobile pass, price formatting and links correct, service-selection behaviour intact.


Run through desktop and mobile (390px) previews: brochure scope reads as visibly limited, no remaining "1–5 pages at $1,500–$2,500", no capped build ranges, no advertised ceiling on larger projects, one-time vs recurring clearly separated, AI pricing always split into setup / management / usage, service prices and care allowances match spec, every CTA reaches its existing flow, and the type check passes.
