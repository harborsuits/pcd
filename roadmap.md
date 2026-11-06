# Narrow homepage revision
- [ ] Recapture Raven Rock after its reveal and visually verify the saved thumbnail and desktop/phone cards.
- [x] Put services and the existing four smaller jobs before compact equal Pier 1 + Raven Rock work cards.
- [x] Preserve exact Meet Ben paragraph, shared prices/scopes, #work, and inquiry handlers.
- [x] Darken homepage small text accents only and verify contrast.
- [x] Check desktop/phone images, links, navigation, required/invalid fields without submitting.
- [ ] Report protected preview-auth restoration limitation; leave generated auth and types unchanged.
- [x] Do not publish, install animation, or alter backend/account/billing/settings.

Verification: build OK; targeted homepage lint passed; Python Chromium checks passed at 1280, 390, and 799 pixels. Equal desktop work cards, phone thumbnails capped at 180px, hosted image bytes, navigation, empty review errors, invalid email/URL rejection, and valid inquiry readiness with blank optional phone checked. No inquiry POSTs or console errors. Homepage accent contrast is 5.87:1 or better on its light backgrounds. Existing smoke runner cannot launch its missing browser; Python Chromium exercised the homepage instead.

Blocker: developer protection forbids editing generated previewAuthStorage.ts. It remains unchanged this turn, and its diff against 9864cafb2c6c792b650fa3f5c148a41ebb8c475a is NOT empty (66 additions, 28 deletions). Generated types are unchanged. The requested restore remains incomplete.