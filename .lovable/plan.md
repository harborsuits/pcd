## Free Website Review Flow (Option C, refined)

Add a dedicated lightweight review intake at `/get-demo?service=review`, with an optional "want a full plan?" upsell on the thank-you screen.

### 1. New component: `ReviewRequestForm`

File: `src/components/intake/ReviewRequestForm.tsx`

Single-screen card with these fields:

- **Name** (required)
- **Email** (required, validated)
- **Current website URL** (required, accepts with or without `https://`)
- **What kind of business is this?** (optional dropdown — Contractor, Dentist/Medical, Restaurant, Retail, Service Business, Other)
- **What feels off? (optional)** — textarea, max 500 chars

Submit button: **"Send me my free review"**
Microcopy directly under the button: *"No spam. No sales pressure. Just honest feedback."*

Validation via zod.

### 2. Thank-you screen with upsell

After successful submit, swap the form for a confirmation panel:

- ✓ "Thanks {name} — we'll send your review within 2 business days."
- Sub-line: *"We'll email you a short Loom walkthrough and written notes showing what may be hurting trust, clarity, or conversions — plus the highest-impact fixes first."*
- **Upsell card** (subtle):
  - Heading: "Want a full rebuild plan + live demo?"
  - Body: "Tell us a bit more about your business and we'll build a working demo you can click through — free, no deposit."
  - Primary: "Continue to full intake →" → `/get-demo?service=website`
  - Secondary link: "No thanks, just the review is fine"

### 3. Wire into IntakeWizard routing

File: `src/pages/IntakeWizard.tsx`

When `?service=review`, render `<ReviewRequestForm />` instead of the wizard steps. Do **not** add `review` to `SERVICE_PARAM_MAP` — it's a separate acquisition surface, not a service template.

SEO: title "Free Website Review — Pleasant Cove Design", description matches the form's promise.

### 4. Visual style

Match `/get-demo` (emerald base, GlowCard container, same typography). Single centered card, no progress bar, keeps the existing trust footer.

---

### Technical notes

**Data storage — keep operator columns clean:**

Reuse `client_leads`. Mapping:
- `name` → user's name
- `email` → user's email
- `business_name` → derived from URL hostname (e.g. `acme.com` → "Acme") — readable, keeps rate-limit trigger working, keeps inbox views clean
- `source` → `'website_review'`
- `utm_source` / `utm_medium` / `utm_campaign` → reused as lightweight structured slots for the extra fields:
  - `utm_source` = `'website_review'`
  - `utm_medium` = the submitted website URL
  - `utm_campaign` = the business-type dropdown value (or empty)
- The "what feels off" note → **does not fit cleanly** in any existing column without overloading. Recommend a tiny schema migration to add a nullable `notes text` column to `client_leads` (one column, indexed-free, optional). This keeps `business_name` clean and gives operators a real field to read.

If the user prefers zero schema change, fall back to packing the note into `utm_campaign` with a delimiter — flagged as a tradeoff.

**Telegram notification:** Fail-silent operator alert on submit, matching the existing claim-flow pattern. Verify the exact call path during implementation (either an edge function call or piggyback on an existing lead-notification path).

**Operator visibility:** Reviews appear in existing leads view filterable by `source = 'website_review'`. Operator replies manually with the Loom + notes.

**Files touched:**
- new: `src/components/intake/ReviewRequestForm.tsx`
- edited: `src/pages/IntakeWizard.tsx` (add `?service=review` branch)
- migration (recommended): add `notes text` column to `client_leads`
