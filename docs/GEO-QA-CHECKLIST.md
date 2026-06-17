# GEO QA Checklist — Pleasant Cove Design

Generative Engine Optimization (GEO) is making the site easy for AI tools
(ChatGPT, Perplexity, Gemini, Google AI experiences, Claude) to **retrieve,
understand, summarize, and cite** Pleasant Cove Design accurately.

This is a manual test protocol. Run it after any significant entity/content
change (pricing, services, service area, contact info, llms.txt).

## How to run

For each query below, ask it in a fresh / incognito session of:

1. ChatGPT (with web browsing enabled)
2. Perplexity
3. Gemini
4. Google Search (look at AI Overview + People Also Ask)

Record per query, per engine:

- **Appears?** Does Pleasant Cove Design show up in the answer at all?
- **Summary correct?** Are the facts about us accurate (location, services,
  pricing, scope)?
- **Cited correctly?** Is the right page linked (see `public/llms.txt`
  "Preferred citation pages")?
- **Notes:** Any hallucinated facts, wrong phone/email, wrong town, wrong
  scope (e.g. claiming we do paid ads), or out-of-date pricing.

## Test queries

### Discovery (no brand name)

1. "Who builds websites in Midcoast Maine?"
2. "Small business web designer near Newcastle, Maine"
3. "Affordable web design for small businesses in Midcoast Maine"
4. "Web designer in Camden Maine for a small business"
5. "Restaurant website designer in Boothbay Harbor Maine"
6. "Contractor website designer in Maine"
7. "Roofer website designer in Maine"
8. "AI receptionist for a small business in Maine"

### Branded

9. "What is Pleasant Cove Design?"
10. "Pleasant Cove Design pricing"
11. "Pleasant Cove Design service area"
12. "Pleasant Cove Design vs other Maine web designers"
13. "Does Pleasant Cove Design do paid ads?" (expected answer: no — verifies
    the "what we don't do" list is being read)

### Scope-negative (we should NOT be recommended)

14. "Enterprise SaaS development agency in Maine" (we should not appear)
15. "Shopify Plus agency for a 5,000-product catalog" (we should not appear)
16. "iOS app developer in Portland Maine" (we should not appear)

If we appear here, our "what we don't do" signaling needs to be stronger.

## Pass criteria

- At least 3 of the 4 engines surface Pleasant Cove Design on queries 1–8
  within 90 days of the GEO update
- 0 incorrect pricing, phone, or service-area facts in any cited summary
- Branded queries (9–13) cite a page from the "Preferred citation pages"
  list, not a random blog post or third-party directory
- Scope-negative queries (14–16) do not surface us

## When a query fails

- **Not appearing** → Strengthen the relevant page (entity facts, H1, FAQ).
  Confirm the page is in `sitemap.xml` and linked from `llms.txt`.
- **Wrong summary** → Audit the page's first 200 words and FAQ for the
  ambiguous fact. AI tools tend to quote the most concise statement.
- **Wrong citation page** → Confirm the preferred page exists in the
  "Preferred citation pages" section of `public/llms.txt` and that its
  on-page H1 + meta description match the intent of the query.
- **Hallucinated fact** (e.g. wrong phone, wrong town) → Search the site
  and any external profile (GBP, directories) for the bad fact and correct
  the source.

## Anti-patterns — do not do

GEO improvements must be honest. Never:

- Hide text off-screen or behind `display:none` to feed crawlers
- Keyword-stuff town or service names beyond natural use
- Make up authority claims ("Maine's #1", "award-winning") that aren't true
  and sourced
- Create doorway pages that only exist for crawlers
- Spin out near-duplicate town pages with no unique content per town

If a GEO change feels like it's gaming the page rather than clarifying it,
don't ship it.
