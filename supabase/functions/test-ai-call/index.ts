import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizePhone(raw: unknown): { ok: true; phone: string } | { ok: false; reason: string; received: unknown } {
  if (typeof raw !== "string") {
    return { ok: false, reason: "Phone must be a string", received: raw };
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, reason: "Phone is empty", received: raw };
  }

  // Keep digits and leading +
  let cleaned = trimmed.replace(/[^\d+]/g, "");

  // If user typed multiple + or + not at start, normalize
  if (cleaned.includes("+")) {
    const plusCount = (cleaned.match(/\+/g) || []).length;
    if (plusCount > 1 || !cleaned.startsWith("+")) {
      cleaned = "+" + cleaned.replace(/\+/g, "");
    }
  }

  // If no +, treat as national digits and try US default rules
  if (!cleaned.startsWith("+")) {
    const digitsOnly = cleaned.replace(/[^\d]/g, "");

    if (digitsOnly.length === 10) {
      cleaned = "+1" + digitsOnly;
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
      cleaned = "+" + digitsOnly;
    } else {
      return {
        ok: false,
        reason: "Invalid phone length. Provide E.164 (+12075551234) or a 10-digit US number.",
        received: raw,
      };
    }
  }

  // Final E.164 validation: + then 10-15 digits
  if (!/^\+\d{10,15}$/.test(cleaned)) {
    return {
      ok: false,
      reason: "Invalid phone format. Expected E.164 like +12075551234.",
      received: raw,
    };
  }

  return { ok: true, phone: cleaned };
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed. Use POST." }, 405);
  }

  // Parse query params (Ulio sometimes sends identifiers in query)
  const url = new URL(req.url);
  const qp = url.searchParams;

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // Allow empty body
    body = {};
  }

  // Log for debugging (no secrets)
  const bodyKeys = Object.keys(body);
  const queryKeys = Array.from(qp.keys());
  console.log("test-ai-call received - body keys:", bodyKeys);
  console.log("test-ai-call received - query keys:", queryKeys);

  // Accept multiple phone field names
  const rawPhone =
    body.to ??
    body.phone ??
    body.to_number ??
    body.phone_number ??
    body.number ??
    qp.get("to") ??
    qp.get("phone") ??
    qp.get("to_number") ??
    qp.get("phone_number") ??
    qp.get("number");

  // If no phone field found at all
  if (rawPhone === undefined || rawPhone === null) {
    return json(
      {
        error: "Missing phone",
        expected: ["to", "phone", "to_number", "phone_number", "number"],
        received_keys: { body: bodyKeys, query: queryKeys },
      },
      400
    );
  }

  const normalized = normalizePhone(rawPhone);
  if (!normalized.ok) {
    return json(
      {
        error: "Invalid phone format",
        details: normalized.reason,
        received: normalized.received,
        expected_format: "+12075551234 (E.164)",
      },
      400
    );
  }

  // Business/shop id handling (body or query) - NOT required for test calls
  const shopId =
    body.shop_id ??
    body.business_id ??
    body.ulio_shop_id ??
    body.ilio_shop_id ??
    qp.get("shop_id") ??
    qp.get("business_id") ??
    qp.get("ulio_shop_id") ??
    null;

  console.log("test-ai-call success - phone:", normalized.phone, "shop_id:", shopId);

  // Return success - Ulio can treat 200 as "ready"
  return json({
    success: true,
    phone: normalized.phone,
    shop_id: shopId,
  });
});
