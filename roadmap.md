# Narrow homepage revision
- [x] Recapture Raven Rock after its reveal and visually verify the saved thumbnail and desktop/phone cards.
- [x] Put services and the existing four smaller jobs before compact equal Pier 1 + Raven Rock work cards.
- [x] Preserve exact Meet Ben paragraph, shared prices/scopes, #work, and inquiry handlers.
- [x] Darken homepage small text accents only and verify contrast.
- [x] Check desktop/phone images, links, navigation, required/invalid fields without submitting.
- [ ] Report protected preview-auth restoration limitation; leave generated auth and types unchanged.
- [x] Do not publish, install animation, or alter backend/account/billing/settings.

Verification: build OK; targeted homepage lint passed; Python Chromium checks passed at 1280, 390, and 799 pixels. Equal desktop work cards, phone thumbnails capped at 180px, hosted image bytes, navigation, empty review errors, invalid email/URL rejection, and valid inquiry readiness with blank optional phone checked. No inquiry POSTs or console errors. Homepage accent contrast is 5.87:1 or better on its light backgrounds. Existing smoke runner cannot launch its missing browser; Python Chromium exercised the homepage instead.

Blocker: developer protection forbids editing generated previewAuthStorage.ts. It remains unchanged this turn, and its diff against 9864cafb2c6c792b650fa3f5c148a41ebb8c475a is NOT empty (66 additions, 28 deletions). Generated types are unchanged. The requested restore remains incomplete.

Raven Rock recapture: waited 12 seconds for the real public homepage reveal, then captured its visible headline and stone-and-timber photo. Visually inspected both the downloaded saved CDN image and rendered cards at 1280 and 390 pixels. Only its image pointer changed; compact layout, copy, links, and all inquiry handlers preserved. Preview build OK; nothing published or submitted.
# About + homepage SEO (Nov 6)
- [x] Compact About section (logo beside eyebrow/H2, two supplied paragraphs, /get-demo link) replaces Meet Ben.
- [x] Homepage title/description updated; hidden FAQ prop removed.
- [ ] Preview's in-browser title/canonical/schema tags not applying (pre-existing; live site applies them) — needs follow-up investigation.

- Done: static fallback meta tags managed by SEOHead carry data-rh="true" so Helmet replaces them (no duplicates).
# Contact + style refinement (Nov 6)
- [x] /get-demo leads with Email Ben (gmail), Start with an account, returning-client login, secondary Text Ben (sms).
- [x] Short inquiry: 3 visible essentials (business, email, message); optional details in disclosure; deep links honored; city required for demo/website/existing.
- [x] Guest receipt in place + optional create-password; IntakeWizard session via portalSupabase.
- [x] NAP.email -> pleasantcovedesign@gmail.com; replace stale hello@ emails in marketing UI/llms.txt.
- [x] Contact as nav route; restrained homepage/contact style refinement.
- [x] Verify 1280/390/320, mocked submissions only, no publish.
- Ben confirms the current live editor preview loads the wave wordmark correctly; no asset/server changes are needed.

# Contact typing regression (Nov 6)
- [x] Stabilize inquiry DOM identity, preserve both disclosures and values on service changes, expose required fields, and separate mobile email helper.
- [x] Verify sequential typing/focus/caret and mocked loading/success/error; no real submissions or publishing.
- Verification: reproduced PCD becoming P before the fix; PCD and full email/message typing now retain DOM nodes, focus and caret. Five focused tests and targeted lint pass; Chromium checks at 1280/390/320 pass with mocked loading, error/retry and success, preserved service/disclosure values, and no overflow. Preview build OK. Only contact page, regression tests, architecture rule and this note changed; no backend/auth/config changes.

# Streamlined service deep links (Nov 6)
- [x] Replace large service cards with a compact preselected native selector; preserve auto-open, contextual town and service/tier/product/trial payloads.
- [x] Run contact regressions and desktop/phone deep-link checks with mocked submissions only; leave assets/server unchanged and do not publish.
- Verification: 13 contact tests and targeted lint pass; build OK. Chromium checked all eight supported service/pilot intent mappings at 1280/390/320, including automatic opening, 40px selector, natural typing/focus, service changes, required town and no overflow. Mocked payload assertions preserve service, tier, product and trial. No real submissions or publishing.
