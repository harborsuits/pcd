

# Repositioning: Copy-Only Changes

All UI components, layouts, animations, and visual elements stay exactly as they are. We are only changing text content to match the new positioning: "We help small businesses fix websites that are costing them customers."

---

## Changes by file

### 1. `src/pages/Index.tsx` — Homepage

**SEO Head** (line 104-106)
- Title: "Pleasant Cove Design — We Fix Websites That Cost You Customers"
- Description: "We help small businesses fix outdated websites, broken contact flows, and confusing customer journeys. Get a free website review."

**Hero h1** (line 168-169)
- From: "Never miss a lead again."
- To: "Your website is losing you customers."

**Hero Typewriter** (lines 173-177) — keeps the Typewriter component, just new strings:
- "Outdated design drives visitors away."
- "Broken contact forms lose leads."
- "Confusing navigation kills conversions."
- "Poor mobile experience costs you jobs."

**Hero paragraph** (lines 187-189)
- To: "We fix outdated websites, broken contact flows, and confusing customer journeys for small businesses — so you stop losing the customers you're already attracting."

**Service Chooser section** (lines 196-254) — same 3-card layout, new text:
- Section heading: "What do you need?" → "What's hurting your business?"
- Subheading: "Choose your starting point — we'll handle the rest." → "Pick what sounds familiar — we'll show you how to fix it."
- Card 1 (Bot icon stays): "AI Receptionist" → "Website Refresh" / "Your site looks outdated and customers don't trust it."
- Card 2 (Globe icon stays): "Website" → "One-Page Website" / "You need a simple, professional site that actually converts."
- Card 3 (Sparkles icon stays): "Complete Growth System" → "Booking & Contact Fix" / "Customers can't easily reach you or book your services."
- Links updated: `/get-demo?service=website_refresh`, `?service=one_page`, `?service=contact_fix`
- Bottom text: "Need something else? Tell us what you're looking for →" stays, link unchanged.

**Demos section** (lines 258-272) — accordion component untouched, just heading text:
- "Real websites. Smarter lead handling." → "Recent website fixes we've done."
- "Click any demo to explore — no commitment, just a preview." → "See real before-and-after examples — no commitment."

**AI Receptionist section** (lines 275-365) — all cards stay, just text updates:
- "Your AI Front Desk" → "Problems we find on every audit"
- Subtitle → "Most small business websites have the same issues. Here's what we look for — and fix."
- 4 GlowCards become proof/audit items (same icons, same layout):
  - "Missed calls & slow response" / "67% of customers won't call back if they don't get a response within an hour."
  - "Confusing navigation" / "If visitors can't find your services in 5 seconds, they leave."
  - "No mobile experience" / "Over 60% of your traffic is mobile. If it's broken, you're losing jobs."
  - "No clear next step" / "No booking button, no contact form, no reason to stay."
- YouTube iframe + "Try a 7-Day Demo" button → change button text to "Get Your Free Review" and link to `/get-demo?service=review`
- Video stays as-is (still relevant social proof)

**What We Build section** (lines 367-402) — capabilities array updated:
- "What We Build" → "What we fix"
- Subtext → "Common issues we solve for small businesses every week."
- 6 cards become:
  - Websites → "Outdated Design" / "Modern, clean look that builds trust instantly."
  - Client Portal → "Broken Contact Flow" / "Clear paths to reach you — forms, calls, booking."
  - Booking + Intake → "Missing Booking" / "Online scheduling so customers don't have to chase you."
  - Payments → "Weak Mobile Experience" / "Sites that work perfectly on every phone and tablet."
  - Automations → "Poor SEO" / "Show up when customers search for what you do."
  - AI Receptionist → "No Follow-Up" / "Automated responses so leads don't go cold."
- "See Everything We Build" link text → "See all our services"

**How It Works** (lines 405-438) — same 4-step layout:
1. "Quick call" / "15 minutes to understand your business." → "Free review" / "We audit your website and show you what's costing you customers."
2. "We build" / "Custom site + portal, no templates." → "Fix plan" / "You get a clear list of what to fix and what it costs."
3. "You review" / "Preview, feedback, approve — in your portal." → "We fix it" / "We handle everything — design, code, launch."
4. "Go live" / "Launch + ongoing support included." → "You grow" / "More calls, more bookings, more customers."

**Final CTA** (lines 441-455):
- "Ready to see it for your business?" → "Find out what your website is costing you."
- "Get a personalized website demo — no pressure, no commitment." → "Get a free website review — we'll show you exactly what to fix."
- Button: "See a Demo" → "Get My Free Review"
- Link: `/get-demo?service=demo` → `/get-demo?service=review`

**Already a Client** (lines 458-465) — stays exactly as-is.

**Footer** — stays exactly as-is.

**Nav links** (lines 116-126):
- "What We Build" → "Services"
- "Pricing" stays
- "Client Portal" stays

**Mobile nav** (lines 136-158) — same changes as desktop nav.

### 2. `src/components/portal/PortalHeader.tsx`
- No changes (it's the portal, not marketing).

### 3. `src/pages/Pricing.tsx`
- SEO description: update to mention website fixes/reviews instead of AI receptionists
- Hero heading stays "Pricing & Services"
- Subtitle → "Straightforward pricing. No retainers, no surprises."
- Body text → "Website refreshes, one-page builds, and booking flow fixes for small businesses. Pick what you need."
- "Most clients start with a free demo" → "Most clients start with a free website review."

### 4. `src/pages/WhatWeBuild.tsx`
- Only the FEATURES array text and page heading copy updates to align with "services we offer" framing instead of "infrastructure we build" framing. The video/image bento grid stays untouched.

### 5. `src/components/SEOHead.tsx`
- No changes (it's a utility component).

---

## What does NOT change
- All UI components, animations, layouts, cards, grids
- The Typewriter component (just new strings)
- The 3D model / HeroStatic fallback
- The FeaturedDemosAccordion
- The YouTube embed
- The GlowCard components
- Footer structure
- Portal, operator, demo pages
- Any edge functions, database, or backend code
- Color scheme, fonts, spacing

## Technical notes
- The `capabilities` array at the top of Index.tsx gets new title/description strings
- The `exampleDemos` array stays unchanged
- Nav link labels are inline text in JSX, simple string swaps
- All `/get-demo` links still work — just different `?service=` query params

