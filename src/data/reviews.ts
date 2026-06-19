// Curated Google reviews shown in <ReviewsStrip /> and (optionally)
// emitted as Review / aggregateRating JSON-LD on the Organization.
//
// HARD RULES — do not violate:
// 1. Every entry must be a real, verifiable Google review with a real
//    reviewer name. No composites, no paraphrased quotes, no AI-written
//    reviews. If you don't have it in Google Business Profile, it does
//    not go here.
// 2. REVIEWS_SCHEMA_ENABLED stays false until there are at least 3
//    entries below AND you have manually verified each reviewer name
//    and quoted text matches the live Google review byte-for-byte.
//    Fabricated aggregateRating is a Google policy violation.
// 3. No photos / avatars — text + star only.

export interface Review {
  author: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  date: string; // ISO YYYY-MM-DD
  source: "google";
  sourceUrl?: string; // optional permalink to the live review
}

export const REVIEWS: Review[] = [
  // Add real reviews here as they come in, e.g.:
  // {
  //   author: "Jane D.",
  //   rating: 5,
  //   text: "They rebuilt our menu and the phone hasn't stopped ringing.",
  //   date: "2026-07-12",
  //   source: "google",
  // },
];

// Schema gate — leave false until at least 3 real reviews exist and you
// have personally verified each one.
export const REVIEWS_SCHEMA_ENABLED = false;

export function averageRating(reviews: Review[]): number | null {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Number((sum / reviews.length).toFixed(2));
}
