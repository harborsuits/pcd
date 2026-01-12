import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-ulio-signature",
};

// Map Ulio event types to canonical event names
const EVENT_MAP: Record<string, string> = {
  "call.completed": "ai_call_completed",
  "call.started": "ai_call_started",
  "call.missed": "ai_call_missed",
  "appointment.booked": "ai_appointment_booked",
  "appointment.cancelled": "ai_appointment_cancelled",
  "appointment.failed": "ai_booking_failed",
  "call.escalated": "ai_escalation_triggered",
  "message.taken": "ai_message_taken",
  "voicemail.received": "ai_voicemail_received",
};

// Mask phone number for privacy (207) 555-1234 → (207) 555-xxxx
function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  // Remove non-digits
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "xxx-xxxx";
  
  // Format as (xxx) xxx-xxxx with last 4 masked
  if (digits.length >= 10) {
    const area = digits.slice(-10, -7);
    const prefix = digits.slice(-7, -4);
    return `(${area}) ${prefix}-xxxx`;
  }
  return `xxx-${digits.slice(-4).replace(/./g, 'x')}`;
}

// Truncate text safely
function truncate(text: string | null | undefined, maxLen: number): string | null {
  if (!text) return null;
  return text.length > maxLen ? text.slice(0, maxLen - 3) + "..." : text;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Parse the webhook payload
    const payload = await req.json();
    console.log("[ulio-webhook] Received payload:", JSON.stringify(payload).slice(0, 500));

    // Validate webhook signature if secret is configured
    const secret = Deno.env.get("ULIO_WEBHOOK_SECRET");
    const signature = req.headers.get("x-ulio-signature");
    
    if (secret && signature) {
      // Ulio uses HMAC-SHA256 for webhook signatures
      // For now, log the signature for debugging - implement full validation later
      console.log("[ulio-webhook] Signature received:", signature.slice(0, 20) + "...");
    }

    // Extract the Ulio event type and shop_id (business ID)
    const ulioEventType = payload?.type || payload?.event_type || payload?.event;
    const ulioShopId = payload?.data?.shop_id || payload?.shop_id || payload?.business_id;

    if (!ulioEventType) {
      console.error("[ulio-webhook] No event type in payload");
      return new Response(JSON.stringify({ error: "Missing event type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!ulioShopId) {
      console.error("[ulio-webhook] No shop_id in payload");
      return new Response(JSON.stringify({ error: "Missing shop_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map to canonical event name
    const canonicalEvent = EVENT_MAP[ulioEventType];
    if (!canonicalEvent) {
      console.log(`[ulio-webhook] Unknown event type: ${ulioEventType}, storing as-is`);
    }
    const eventName = canonicalEvent || `ai_${ulioEventType.replace(/\./g, "_")}`;

    // Initialize Supabase client with service role for database access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Look up the project by ulio_business_id
    const { data: project, error: lookupError } = await supabase
      .from("projects")
      .select("project_token, business_name")
      .eq("ulio_business_id", ulioShopId)
      .single();

    if (lookupError || !project) {
      console.error(`[ulio-webhook] No project found for shop_id: ${ulioShopId}`, lookupError);
      return new Response(JSON.stringify({ error: "Unknown business" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[ulio-webhook] Matched project: ${project.business_name} (${project.project_token})`);

    // Extract event data based on event type
    const eventData = payload?.data || {};
    const metadata: Record<string, unknown> = {
      ulio_event_type: ulioEventType,
      ulio_event_id: payload?.id || payload?.event_id,
    };

    // Build metadata based on event type
    switch (canonicalEvent) {
      case "ai_call_completed":
      case "ai_call_started":
      case "ai_call_missed":
        metadata.caller_phone_masked = maskPhone(eventData.caller_phone || eventData.from);
        metadata.duration_seconds = eventData.duration || eventData.duration_seconds || 0;
        metadata.outcome = eventData.outcome || eventData.result || "completed";
        metadata.summary = truncate(eventData.summary || eventData.transcript_summary, 200);
        break;

      case "ai_appointment_booked":
        metadata.caller_phone_masked = maskPhone(eventData.caller_phone || eventData.customer_phone);
        metadata.scheduled_for = eventData.scheduled_at || eventData.appointment_time;
        metadata.service = truncate(eventData.service || eventData.service_name, 100);
        metadata.staff_member = eventData.staff_name || eventData.assigned_to;
        break;

      case "ai_booking_failed":
        metadata.caller_phone_masked = maskPhone(eventData.caller_phone);
        metadata.error_code = eventData.error_code || eventData.failure_reason;
        metadata.error_message = truncate(eventData.error_message || eventData.failure_details, 200);
        break;

      case "ai_escalation_triggered":
        metadata.caller_phone_masked = maskPhone(eventData.caller_phone);
        metadata.reason = truncate(eventData.escalation_reason || eventData.trigger || eventData.reason, 200);
        metadata.escalated_to = maskPhone(eventData.forwarded_to);
        break;

      case "ai_message_taken":
        metadata.caller_phone_masked = maskPhone(eventData.caller_phone);
        metadata.message_preview = truncate(eventData.message || eventData.message_content, 200);
        metadata.callback_requested = eventData.callback_requested ?? false;
        break;

      case "ai_voicemail_received":
        metadata.caller_phone_masked = maskPhone(eventData.caller_phone);
        metadata.duration_seconds = eventData.duration || 0;
        metadata.transcript_preview = truncate(eventData.transcript, 200);
        break;

      default:
        // Store raw data for unknown events
        metadata.raw_data = eventData;
    }

    // Insert into project_events
    const { error: insertError } = await supabase
      .from("project_events")
      .insert({
        project_token: project.project_token,
        event_name: eventName,
        metadata,
      });

    if (insertError) {
      console.error("[ulio-webhook] Failed to insert event:", insertError);
      return new Response(JSON.stringify({ error: "Failed to store event" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[ulio-webhook] Stored event: ${eventName} for ${project.project_token}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        event: eventName,
        project_token: project.project_token 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[ulio-webhook] Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
