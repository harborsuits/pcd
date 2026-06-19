// Single source of truth for the Google review write-link.
//
// IMPORTANT: this must be the Google review write URL, which opens the
// "leave a review" dialog directly. Two valid formats:
//   1. https://g.page/r/<place_id_hash>/review
//   2. https://search.google.com/local/writereview?placeid=<place_id>
//
// A Maps share link (maps.app.goo.gl/... or goo.gl/maps/...) does NOT
// open the review dialog — it opens the listing. Do not use one here.
//
// To swap in the real link, replace REVIEW_URL below with the URL Google
// gave you from your Business Profile → "Get more reviews" → "Share review form".
// The QR script (scripts/generate-review-qr.mjs) and a runtime check both
// validate the format and refuse to ship a Maps share link.

export const REVIEW_URL_PLACEHOLDER =
  "https://search.google.com/local/writereview?placeid=REPLACE_WITH_PLACE_ID";

export const REVIEW_URL: string = REVIEW_URL_PLACEHOLDER;

const VALID_PATTERNS: RegExp[] = [
  /^https:\/\/g\.page\/r\/[A-Za-z0-9_-]+\/review\/?$/,
  /^https:\/\/search\.google\.com\/local\/writereview\?placeid=[A-Za-z0-9_-]+$/,
];

const FORBIDDEN_PATTERNS: RegExp[] = [
  /maps\.app\.goo\.gl/i,
  /goo\.gl\/maps/i,
  /google\.com\/maps/i,
];

export type ReviewLinkStatus =
  | { kind: "placeholder" }
  | { kind: "valid" }
  | { kind: "forbidden"; reason: string }
  | { kind: "malformed"; reason: string };

export function checkReviewUrl(url: string): ReviewLinkStatus {
  if (url === REVIEW_URL_PLACEHOLDER) return { kind: "placeholder" };
  for (const p of FORBIDDEN_PATTERNS) {
    if (p.test(url)) {
      return {
        kind: "forbidden",
        reason:
          "This looks like a Google Maps share link. Maps links open the listing — they do NOT open the review dialog. Use the URL from Business Profile → Get more reviews → Share review form (g.page/r/.../review or search.google.com/local/writereview?placeid=...).",
      };
    }
  }
  for (const p of VALID_PATTERNS) {
    if (p.test(url)) return { kind: "valid" };
  }
  return {
    kind: "malformed",
    reason:
      "Expected https://g.page/r/<id>/review or https://search.google.com/local/writereview?placeid=<id>.",
  };
}

export const REVIEW_URL_STATUS = checkReviewUrl(REVIEW_URL);
export const REVIEW_URL_IS_LIVE = REVIEW_URL_STATUS.kind === "valid";
