# SEO + AEO Audit — Targeted Fixes (no aesthetic changes)

**Hard constraint:** technical/content-structure only. No changes to colors, fonts, spacing, layout, button styles, animations, hero, section styling, or overall feel. New FAQ copy and `[data-speakable]` paragraphs reuse existing typography and slot into existing sections. No redesigns.

The foundation is already strong: rich JSON-LD `@graph` (Organization, WebSite, WebPage/Article, LocalBusiness, Service, FAQPage, Breadcrumbs, Speakable), per-route `react-helmet-async`, 22 town pages + 9 vertical pages + Midcoast pillar, `llms.txt`, full AI-bot allowlist, 60+ sitemap entries. This plan closes the remaining gaps.

## 1. Scanner-flagged fixes

**Sitemap** (`public/sitemap.xml`)
- Add `/start` (public route, currently missing).
- Skip `/create-password`, `/login`, `/d/:token/:slug` (correctly auth/per-token).
- Skip `/demos` index — verify it exists as a public route; if not, leave out.

**Meta descriptions <50 chars** — expand to 50–160 char useful summaries:
- `src/pages/NotFound.tsx`
- `src/pages/PrivacyPolicy.tsx`
- `src/pages/TermsOfService.tsx`

**Descriptive link text** — `src/pages/Blog.tsx:66`: replace "Read more" with `Read: {post.title}`. Visual style unchanged (same component, same icon, same classes — only the inner text changes).

**Icon-only button name** — `src/pages/WhatWeBuild.tsx` GalleryModal close button: add `aria-label="Close gallery"`. No visual change.

**`<main>` landmark** — wrap existing primary content in `<main className="flex-1">` (or equivalent) on routes that lack it: `Pricing`, `Blog`, `BlogPost`, `WhatWeBuild`, `AiReceptionist`, `PrivacyPolicy`, `TermsOfService`, `NotFound`, `PortalHub`, `local/MidcoastPillar`, `local/TownPage`, `local/VerticalPage`. Just a wrapping semantic element around existing markup — zero visual impact.

**LCP / performance** (published-build finding)
- Audit `Index.tsx` / `Hero3DModel` / `HeroStatic` for the LCP element. If it's an `<img>`: add explicit `width`/`height`, remove `loading="lazy"` on the hero image only, add `fetchpriority="high"`. If LCP is the H1 text: add `font-display: swap` to every `@font-face` in `src/index.css`. **No design changes** — only image attributes / font-display directive. Will not touch the 3D hero behavior.

## 2. AEO sharpening

All additions reuse existing page sections, design tokens, and typography. No new visual styles.

**`[data-speakable]` coverage** — add the attribute to 1–2 existing short answer paragraphs already on each of: homepage, `/pricing`, `/ai-receptionist`, `/midcoast-maine`, vertical pages, town pages. This is just a DOM attribute — invisible. Where a quotable summary sentence isn't present, add a single sentence inside an existing intro paragraph using existing typography classes.

**FAQPage schema** — audit `TownPage`, `VerticalPage`, `MidcoastPillar`, `AiReceptionist`, `WhatWeBuild` and confirm each passes a `faq=[…]` array to `SEOHead`. For any missing it, add 3–5 plain-English Q&A (answers 1–3 sentences — AEO snippet length). FAQ content surfaces in the existing FAQ accordion section where one exists, or schema-only where it doesn't (no new UI section added without confirmation).

**`llms.txt` refresh** — expand to include all 22 town pages, all 9 vertical pages, `/start`, the existing 3 blog posts. Add a short `## Facts` block (NAP, founded year, areas served, what we don't do) — LLMs cite this verbatim. Text-only file; no UI impact.

**Blog post Article schema** — verify `BlogPost.tsx` passes `type="article"` + `datePublished` + `dateModified` to `SEOHead` from post frontmatter. Add if missing.

**OG image** — generate a single branded 1200×630 PNG to replace the externally-hosted GIF reference in `SEOHead.tsx` `DEFAULT_IMAGE`. **Affects external previews only** (LinkedIn, Slack, iMessage, ChatGPT citations) — never appears in the live site UI. Ship at `src/assets/og-image.png` and reference via import.

## 3. Mark findings fixed

After changes land, call `seo_chat--update_findings` for:
- `http:sitemap`
- `agent_content:content`
- `agent_metadata:metadata_quality`
- `lighthouse:lighthouse_accessibility` (main landmark portion; contrast portion verified against current code)

Leave `lighthouse:lighthouse_performance` open until republish (it scores the live build).

## Out of scope

- No keyword/backlink strategy work (separate Semrush session).
- No new pages, copy rewrites, or design changes beyond items above.
- No Search Console verification flow (already verified).
- No Stripe / billing / portal logic changes.

## Files touched

- `public/sitemap.xml`, `public/robots.txt` (unchanged — already good), `public/llms.txt`
- `src/components/SEOHead.tsx` (DEFAULT_IMAGE swap only)
- `src/pages/NotFound.tsx`, `PrivacyPolicy.tsx`, `TermsOfService.tsx` (meta description text)
- `src/pages/Blog.tsx` (link text + `<main>`)
- `src/pages/WhatWeBuild.tsx` (close-button aria-label + `<main>`)
- `src/pages/Pricing.tsx`, `BlogPost.tsx`, `AiReceptionist.tsx`, `PortalHub.tsx` (`<main>` wrap)
- `src/pages/local/MidcoastPillar.tsx`, `TownPage.tsx`, `VerticalPage.tsx` (`<main>` + speakable attrs + FAQ if missing)
- `src/pages/Index.tsx` and/or `src/components/Hero3DModel.tsx` / `HeroStatic.tsx` (LCP image attributes only)
- `src/index.css` (font-display: swap, if needed)
- `src/assets/og-image.png` (new file)
