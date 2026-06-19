#!/usr/bin/env node
// Generates public/review-qr.svg from the Google review URL exported in
// src/lib/reviewLink.ts.
//
// Behavior:
//   - If the URL is the placeholder, writes a clearly-marked placeholder
//     SVG and exits 0 (so builds don't fail before the user has supplied
//     the real link).
//   - If the URL is a forbidden Maps share link OR is malformed, exits 1
//     with a clear error. This is the guardrail — wrong URL never ships.
//   - If the URL is valid, regenerates the QR SVG.
//
// Run via the `prebuild` npm script.

import { writeFileSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REVIEW_LINK_SRC = resolve(__dirname, "..", "src", "lib", "reviewLink.ts");
const OUT_PATH = resolve(__dirname, "..", "public", "review-qr.svg");

function extractReviewUrl(src) {
  // Match: export const REVIEW_URL: string = REVIEW_URL_PLACEHOLDER;
  //    or: export const REVIEW_URL: string = "https://...";
  const re = /export const REVIEW_URL\s*:\s*string\s*=\s*([^;]+);/;
  const m = src.match(re);
  if (!m) throw new Error("Could not find REVIEW_URL export in src/lib/reviewLink.ts");
  const raw = m[1].trim();
  if (raw === "REVIEW_URL_PLACEHOLDER") {
    const ph = src.match(/REVIEW_URL_PLACEHOLDER\s*=\s*"([^"]+)"/);
    if (!ph) throw new Error("Could not resolve REVIEW_URL_PLACEHOLDER constant");
    return { url: ph[1], isPlaceholder: true };
  }
  const strMatch = raw.match(/^["'`](.+)["'`]$/);
  if (!strMatch) throw new Error(`REVIEW_URL must be a string literal, got: ${raw}`);
  return { url: strMatch[1], isPlaceholder: false };
}

const VALID_PATTERNS = [
  /^https:\/\/g\.page\/r\/[A-Za-z0-9_-]+\/review\/?$/,
  /^https:\/\/search\.google\.com\/local\/writereview\?placeid=[A-Za-z0-9_-]+$/,
];
const FORBIDDEN_PATTERNS = [
  { re: /maps\.app\.goo\.gl/i, name: "maps.app.goo.gl" },
  { re: /goo\.gl\/maps/i, name: "goo.gl/maps" },
  { re: /google\.com\/maps/i, name: "google.com/maps" },
];

function validate(url) {
  for (const f of FORBIDDEN_PATTERNS) {
    if (f.re.test(url)) {
      return {
        ok: false,
        reason: `URL matches forbidden Maps share pattern (${f.name}). Maps share links open the listing — they do NOT open the review dialog. Use Business Profile → "Get more reviews" → "Share review form" to get the correct URL (g.page/r/<id>/review or search.google.com/local/writereview?placeid=<id>).`,
      };
    }
  }
  for (const v of VALID_PATTERNS) {
    if (v.test(url)) return { ok: true };
  }
  return {
    ok: false,
    reason: `URL does not match an accepted Google review write-link format. Expected https://g.page/r/<id>/review or https://search.google.com/local/writereview?placeid=<id>.`,
  };
}

const PLACEHOLDER_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <rect width="200" height="200" fill="#f3f4f6"/>
  <text x="100" y="92" font-family="system-ui, sans-serif" font-size="11" fill="#6b7280" text-anchor="middle" font-weight="600">QR placeholder</text>
  <text x="100" y="110" font-family="system-ui, sans-serif" font-size="9" fill="#9ca3af" text-anchor="middle">Set REVIEW_URL in</text>
  <text x="100" y="122" font-family="system-ui, sans-serif" font-size="9" fill="#9ca3af" text-anchor="middle">src/lib/reviewLink.ts</text>
</svg>
`;

async function main() {
  const src = readFileSync(REVIEW_LINK_SRC, "utf8");
  const { url, isPlaceholder } = extractReviewUrl(src);

  if (isPlaceholder) {
    writeFileSync(OUT_PATH, PLACEHOLDER_SVG);
    console.log("[review-qr] REVIEW_URL is the placeholder — wrote placeholder SVG. Real QR will generate once you set the real Google review link in src/lib/reviewLink.ts.");
    return;
  }

  const v = validate(url);
  if (!v.ok) {
    console.error("\n[review-qr] BUILD FAILED — invalid Google review URL.");
    console.error(`[review-qr] URL: ${url}`);
    console.error(`[review-qr] Reason: ${v.reason}\n`);
    process.exit(1);
  }

  const svg = await QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
    color: { dark: "#000000", light: "#ffffff" },
  });
  writeFileSync(OUT_PATH, svg);
  console.log(`[review-qr] Wrote ${OUT_PATH} for ${url}`);
}

main().catch((err) => {
  console.error("[review-qr] Unexpected error:", err);
  process.exit(1);
});
