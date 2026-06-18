## Scanner-flagged SEO/AEO Fixes

Constraint: no aesthetic changes. Only semantic wrappers, invisible attributes, and text inside existing elements.

### Already correct (verified, no changes needed)
- `/start` already in `public/sitemap.xml` (line 7).
- `GalleryModal` close button in `WhatWeBuild.tsx` already has `aria-label="Close gallery"`.
- `BlogPost.tsx` already passes `type="article"`, `datePublished`, `dateModified` to `SEOHead`.
- `Blog`, `BlogPost`, `NotFound`, `Pricing`, `WhatWeBuild`, `AiReceptionist`, `PrivacyPolicy`, `TermsOfService`, `MidcoastPillar`, `TownPage`, `VerticalPage` already wrap content in `<main>`.
- Font `display=swap` already set in the Google Fonts URL in `index.html`. LCP is the H1 text; the 700-weight woff2 preload is already in place. No safe attribute-only LCP change remains.

### Changes to make

1. **Meta descriptions** — trim to ≤160 chars (currently 164/176):
   - `src/pages/PrivacyPolicy.tsx` — shorten description.
   - `src/pages/TermsOfService.tsx` — shorten description.
   - `src/pages/NotFound.tsx` — currently exactly 160; leave as-is (within range).

2. **Blog link text** — `src/pages/Blog.tsx` line 68: change visible text from `Read article` to `Read: {post.title}`. Keep the existing classes, icon, and `aria-label`.

3. **PortalHub `<main>` landmark** — `src/pages/PortalHub.tsx` has multiple return branches (loading, error, intake-pending, intake-submitted, no-projects, has-projects, create-password, auth). Wrap the primary content container in each branch with `<main>` using existing wrapper classes — no new layout.

### Out of scope this turn
- No GEO changes.
- No hero/3D changes, no font/file changes, no CSS/Tailwind/theme edits.

### Report
After edits, list touched files and confirm only semantic wrappers and meta-text were changed.