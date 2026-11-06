# Homepage update
- [x] Preserve supplied brand marks and capture real Pier 1 client work.
- [x] Implement approved homepage sections and existing inquiry links only.
- [x] Verify desktop/phone layouts, navigation, and validation without submitting inquiries.
- [x] Report changed files and remaining issues; do not publish.

Verification: preview builds OK; targeted lint passed; Python Chromium checks passed at 1280, 390, and 615 pixels. Review required-field errors, inquiry invalid-email rejection, valid-field readiness with optional phone blank, all homepage-linked routes, hosted assets, and expanded samples checked. No real inquiry sent. Existing JavaScript smoke runner cannot launch because its bundled browser version is missing; equivalent homepage browser check passed with preinstalled Python Chromium.