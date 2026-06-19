# Google Business Profile + Citations Checklist

Operator-facing checklist for Phase 1 of the SEO push. Everything here is
manual, off-site work — none of it touches the codebase.

Source of truth for NAP (Name, Address, Phone): `src/lib/localPages.ts`
(the `NAP` export). Reconcile every external profile against that.

---

## 1. Google Business Profile (GBP)

The single highest-leverage off-site asset. Get this right before
anything else.

### Identity
- [ ] **Business name** matches `NAP.name` exactly: `Pleasant Cove Design`.
      No keyword stuffing ("Pleasant Cove Design — Maine Web Design" is a
      violation and can get the profile suspended).
- [ ] **Primary category:** `Website designer`.
- [ ] **Secondary categories** (add the ones that apply, max ~9 total):
      `Internet marketing service`, `Marketing consultant`,
      `Graphic designer`.
- [ ] **Address:** matches `NAP.city` / `NAP.region`. If you use a service-area
      business (no walk-in address), hide the street address and set the
      service area instead.
- [ ] **Service area:** mirror the towns in `src/lib/localPages.ts` →
      `TOWNS`. Add the whole list, not just Newcastle.
- [ ] **Phone:** matches `NAP.phone` — `(207) 380-5680`.
- [ ] **Website URL:** `https://pleasantcovedesign.com/?utm_source=gbp&utm_medium=organic&utm_campaign=profile`
      (UTM lets you see GBP traffic separately in analytics).
- [ ] **Hours:** Mon–Fri 9 AM – 5 PM. Add "by appointment" as a note.

### Services
- [ ] Add one service per vertical from `VERTICALS` in `localPages.ts`
      (Roofers, Painters, Landscapers, Restaurants, Salons & Barbers,
      Contractors, Galleries, Boutiques, Inns & B&Bs).
- [ ] Add core services: Website design, Website redesign, Local SEO,
      AI receptionist, Booking integration, Website maintenance.
- [ ] Each service gets a 1–2 sentence description that names the outcome
      (mirror the `outcome` field from `VERTICALS`).

### Content
- [ ] **Logo:** square version, 512×512+, on solid background.
- [ ] **Cover photo:** wide, high-quality, real (no stock).
- [ ] **Photos cadence:** add 1–2 photos per month — real work, real
      Maine settings. Behind-the-scenes counts.
- [ ] **GBP Posts cadence:** 1 per week. Templates:
      - Update post: "New site live for {Client} in {Town} — {1-sentence outcome}." + CTA → `/work/<slug>` (once case study lives).
      - Offer post: "Free website review for Midcoast small businesses." → `/get-demo?utm_source=gbp`.
      - Event post (seasonal): "Booking January slots for {Vertical} sites." → `/get-demo`.
- [ ] **Q&A:** seed 3–5 questions yourself (under a personal Google
      account, not the business owner), then answer from the business
      account:
      - "Do you only build sites for Midcoast Maine businesses?"
      - "How much does a small business website cost?"
      - "Do you fix existing sites or only build new ones?"
      - "Do you offer monthly plans without a long-term contract?"
      - "What does the AI receptionist actually do?"

### Reviews (the loop this whole phase exists for)
- [ ] Verify the "Get more reviews" link in GBP matches what's set in
      `src/lib/reviewLink.ts`. If you got the link from Maps share
      (`maps.app.goo.gl/...`), the QR build script will reject it —
      use **Business Profile → Get more reviews → Share review form** to
      get the correct URL.
- [ ] After every project launch, send the SMS template from
      `/say-thanks` within 48 hours of go-live.
- [ ] Reply to every review within 1 week. Short, specific, no
      AI-shaped boilerplate.

---

## 2. Canonical citations (load-bearing only)

Goal: a small number of authoritative profiles that agree with GBP on
the three load-bearing components — **legal name, physical address,
phone**. Platforms reformat addresses and phone numbers their own way
(Apple wants suite/unit format X, Bing parses addresses differently,
etc.) — that's fine. What matters is component-consistency, not byte
identity.

`src/lib/localPages.ts` is the source of truth to reconcile against,
not a literal string every platform will preserve.

### Definitely self-serve, definitely worth doing
- [ ] **Apple Business Connect** — https://businessconnect.apple.com
      Required for Apple Maps, Siri, and Spotlight surfaces. Free,
      direct, no aggregator.
- [ ] **Bing Places for Business** — https://www.bingplaces.com
      You can import directly from GBP — do that, then verify the
      import didn't drop the service area or categories.

### Verify still self-serve before submitting
The aggregator landscape has consolidated. Before you spend time on
either of these, confirm direct submission still exists (the page
should let you create or claim a listing without a paid plan / reseller
gate). If it's gone reseller-only (Yext etc.), skip — do not pay an
aggregator to syndicate basic NAP.
- [ ] **Data Axle (formerly Infogroup)** — search "Data Axle add a
      business" and confirm a free direct-submit form exists.
- [ ] **Localeze / Neustar Localeze** — confirm the same.

### Explicitly NOT doing
- ❌ "Submit to 50 directories" packages.
- ❌ Yext or any paid aggregator subscription.
- ❌ Niche directories no one uses (Brownbook, Hotfrog, etc.).

### Reconciliation rule
For every external profile, check three things against `localPages.ts`:
1. **Legal name** is `Pleasant Cove Design` — no city or keyword tacked on.
2. **Physical address** components (street, city, state, ZIP) match —
   format differences are fine.
3. **Phone** digits match — formatting (parentheses, dashes, spaces) is
   fine to differ.

If a platform asks for info that isn't in `localPages.ts` (suite
number, fax, founding year), make a decision once and write it down in
`docs/GBP-CHECKLIST.md` so the next platform gets the same answer.

---

## 3. Tracking

- [ ] Add `?utm_source=gbp` to every link out of GBP (profile, Posts,
      Services). Lets you split GBP traffic in analytics.
- [ ] Once a month: pull GBP Insights → record calls, direction
      requests, website clicks. Stash in `docs/CONTENT-CALENDAR.md`
      when that file lands in Phase 3.
