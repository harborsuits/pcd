## SEO / AEO / GEO growth plan — v3 (final, approved to build Phase 1)

All v2 guardrails kept. Five refinements folded in from your last review. Phase 1 ships now; Phase 2 + 3 stay gated.

---

### Phase 1 — Reviews + GBP kit + first proof asset (BUILD NOW)

1. **`/review` page** (public, indexed, in sitemap + llms.txt)
   - Primary CTA = real Google review write-link. **Build-time validator** requires `https://g.page/r/<id>/review` or `https://search.google.com/local/writereview?placeid=<id>`. Rejects `maps.app.goo.gl/...` and `goo.gl/maps/...` with a clear error.
   - Copyable link, short script for the client.
   - Static QR (SVG, generated at build by `scripts/generate-review-qr.ts`) pointing at the validated URL.
   - Reuses page-bg, accent, MarketingHeader. No new visual system.

2. **`/say-thanks`** (noindex, in robots.txt Disallow)
   - Copy-paste SMS + email templates with `{name}` / `{link}` placeholders.

3. **`<ReviewsStrip />`** on `/`, `/midcoast-maine`, each `TownPage`
   - Source: `src/data/reviews.ts` (typed, curated, attributed). Text + star only — no avatars.
   - **`Review` / `aggregateRating` JSON-LD: wired but disabled behind a feature flag.** Stays off until you confirm ≥3 real Google reviews with quoted text + reviewer name.

4. **First proof asset — case study (refined per your note)**
   - Route: `/work/pier-one-pizza` via new `src/pages/work/CaseStudyPage.tsx` (NOT the BlogPost shell).
   - Schema: `CreativeWork` with `genre: "Case study"` and `about` → Organization. **No `BlogPosting`, no `Article`.**
   - **No prominent publish date** in the layout. Internal `dateModified` only, no visible "Posted on…" stamp. Reads as evergreen portfolio proof.
   - Real before/after, honest result, 1 client quote. Becomes the canonical citation asset.
   - Listed in sitemap + llms.txt under "Preferred citation pages."

5. **GBP optimization checklist** (`docs/GBP-CHECKLIST.md`, docs-only) — refined per your NAP note:
   - Primary + secondary categories, services mirror `/services`, service-area towns mirror `localPages.ts`.
   - Photo cadence, weekly GBP Post template, Q&A seed questions, UTM-tagged website link (`?utm_source=gbp`).
   - **Citations section reframed: component-consistency, not byte-for-byte.** `localPages.ts` is the source of truth to reconcile against; the checklist tells you to verify each platform's normalized output matches on the three load-bearing components (legal name, physical address, phone). Platforms reformat — that's fine as long as the components agree.
   - **Load-bearing citations (confirmed self-serve at build time):** GBP, Apple Business Connect, Bing Places. Checklist instructs you to verify Data Axle and Localeze still accept direct submissions before submitting; if either has moved to reseller-only (Yext etc.), skip rather than route through paid aggregators. Explicitly NOT a "submit to 50 directories" list.

6. **Sitemap + llms.txt + robots.txt**
   - Add `/review`, `/work/pier-one-pizza` to `public/sitemap.xml`.
   - Add both to "Preferred citation pages" in `public/llms.txt`.
   - Add `/say-thanks` to robots.txt `Disallow`; keep out of sitemap.

---

### Phase 2 — Local landing-page expansion (gated; decision before build)

Substance gate (all 3 required to ship a combo):
1. Real local proof: named example, photo, quote, or Pier One case-study tie-in.
2. Unique 80–120 word hand-written intro tying that vertical to that town's economy.
3. FAQ with **≥2 of 3 questions varied per town** (not the reused vertical set).

**NEW — internal-link reciprocity rule (per your gap-catch):** TownPage and VerticalPage link **only to combos that have shipped**. Backlog combos are not linked from parent pages and are excluded from sitemap + llms.txt. When the backlog drains, parent-page link lists regenerate from a single source-of-truth array (`shippedCombos` in `src/lib/localPages.ts`) — no dead links, no links to non-existent routes.

Likely launch: 4–6 combos, not 12. Rest live in `docs/COMBO-BACKLOG.md`.

Default = gate enforced. Decision required before Phase 2 build.

---

### Phase 3 — AEO answer pages + blog cadence (gated)

- Speakable schema kept but demoted in expectations; structure does the work.
- H1 = question verbatim.
- **Answer callout = its own component** (`<AnswerCallout />`), not reused pullquote styling. Visually built on GlowCard, but semantically distinct — `<aside data-answer data-speakable role="note">` so extractors and future-you can tell canonical answer from decorative quote.
- 300–500 words supporting detail, FAQ schema, 1–2 internal links.
- 6 answer pages, slugs unchanged.
- Blog cadence in `docs/CONTENT-CALENDAR.md`, first 2 posts drafted.
- llms.txt gets an "Answer pages" section.
- GEO-QA-CHECKLIST gets 6 new test queries.

---

### Explicitly NOT doing

No aesthetic changes to existing pages. No `aggregateRating` until ≥3 real reviews. No AI-spun near-duplicate towns. No thin combos. No directory spam. No paid aggregators if Data Axle / Localeze have gone reseller-only. No "Maine's #1" unsourced claims. No SSR migration.

---

### Technical notes (Phase 1 only)

- New routes in `src/App.tsx`: `/review`, `/say-thanks`, `/work/:slug`.
- New files: `src/pages/Review.tsx`, `src/pages/SayThanks.tsx`, `src/pages/work/CaseStudyPage.tsx`, `src/data/caseStudies.ts`, `src/data/reviews.ts`, `src/components/marketing/ReviewsStrip.tsx`, `scripts/generate-review-qr.ts` → `public/review-qr.svg`, `docs/GBP-CHECKLIST.md`.
- QR script validates the Google review URL and fails the build on a Maps share link.
- Case study uses `CreativeWork` JSON-LD via a new `creativeWork` prop on `SEOHead` (small additive change, no impact on existing pages).
- Reviews schema lives behind `REVIEWS_SCHEMA_ENABLED = false` constant until you flip it.
- Sitemap stays hand-edited.

---

### What I need from you to start

1. Real Google review write-link (or I'll wire a placeholder behind the build-time validator that fails until you swap it).
2. Pier One Pizza green-light + whatever before/after assets and a 1-sentence quote exist. If not ready, I'll skip the case study this phase and ship items 1–3, 5, 6.

After Phase 1 ships I'll stop, you verify nothing visual changed on existing pages, then we decide Phase 2.