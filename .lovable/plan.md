## Phone number update — (207) 380-5680

### Findings
- The old `(207) 200-4281` only exists in **one** place: `src/lib/localPages.ts` (the `NAP` constant). No other files in the codebase reference the old number.
- `NAP` is currently imported in `Index.tsx`, `MidcoastPillar.tsx`, `TownPage.tsx`, `VerticalPage.tsx` — but the existing footers only render `NAP.name`, `NAP.city`, `NAP.region`, `NAP.email`. The phone is never actually displayed or linked anywhere on the live site.
- Demo pages (`RooferDemo`, `SalonDemo`, `RestaurantDemo`, `GalleryHero`) use fake placeholder phone numbers (e.g. `(555) 987-6543`) — these are intentional sample-business stand-ins and should NOT be touched.

### Changes

**1. `src/lib/localPages.ts` — update NAP**
- Replace `phone: "(207) 200-4281"` with `phone: "(207) 380-5680"`.
- Add `phoneE164: "+12073805680"` to the `NAP` object so all `tel:` links use the canonical format.
- Drop the `// TODO: replace with real number` comment.

**2. Surface the phone in footer NAP blocks** (currently it's set but not displayed)
Add a clickable phone line to the NAP footers in:
- `src/pages/Index.tsx` (around line 485, the "Already a Client + Local NAP" footer)
- `src/pages/local/MidcoastPillar.tsx` (footer NAP block)
- `src/pages/local/TownPage.tsx` (footer NAP block)
- `src/pages/local/VerticalPage.tsx` (footer NAP block)

Format used in each:
```tsx
· <a href={`tel:${NAP.phoneE164}`} className="hover:text-accent">{NAP.phone}</a>
```

This guarantees:
- Visible: `(207) 380-5680`
- Link target: `tel:+12073805680`

### Out of scope
- Demo page placeholder numbers (`555-…`, `+1207555…`) — these are fictitious sample-business phones, not the real PCD number.
- Any other copy changes.
- Voicemail script (operational note from the user, no code impact).

### Verification after build
- `grep -rn "200.?4281" .` → should return zero matches.
- Footer on `/`, `/midcoast-maine`, `/web-design/:town`, `/websites-for/:vertical` shows `(207) 380-5680` as a tappable link.
