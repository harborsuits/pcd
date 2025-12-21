import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-key, x-twilio-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const smsIdx = pathParts.lastIndexOf("sms");
  const subPath = smsIdx >= 0 ? pathParts.slice(smsIdx + 1).join("/") : "";

  console.log(`SMS endpoint called: ${subPath}, method: ${req.method}`);

  // Route: POST /sms/send (admin-only)
  if (subPath === "send" && req.method === "POST") {
    return handleSend(req);
  }

  // Route: POST /sms/inbound (Twilio webhook - public but validated)
  if (subPath === "inbound" && req.method === "POST") {
    return handleInbound(req);
  }

  return new Response(
    JSON.stringify({ error: "Not found" }),
    { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

function validateAdminKey(req: Request): Response | null {
  const adminKey = req.headers.get("x-admin-key");
  const expectedKey = Deno.env.get("ADMIN_KEY");

  if (!expectedKey) {
    console.error("ADMIN_KEY not configured");
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!adminKey || adminKey !== expectedKey) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return null;
}

function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Send SMS via Twilio
async function sendTwilioSMS(to: string, body: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const messagingServiceSid = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");

  if (!accountSid || !authToken) {
    return { success: false, error: "Twilio credentials not configured" };
  }

  if (!messagingServiceSid) {
    return { success: false, error: "Twilio Messaging Service SID not configured" };
  }

  try {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const formData = new URLSearchParams();
    formData.append("To", to);
    formData.append("Body", body);
    formData.append("MessagingServiceSid", messagingServiceSid);

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa(`${accountSid}:${authToken}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Twilio error:", data);
      return { success: false, error: data.message || `Twilio error: ${response.status}` };
    }

    console.log("SMS sent successfully:", data.sid);
    return { success: true, messageId: data.sid };
  } catch (error: unknown) {
    console.error("Twilio request failed:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errMsg };
  }
}

// POST /sms/send - Send queued SMS messages
async function handleSend(req: Request): Promise<Response> {
  const authError = validateAdminKey(req);
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    const limit = Math.min(body.limit || 25, 50); // Max 50 per batch

    const supabase = getSupabaseClient();

    // Get queued events with lead phone info
    const { data: events, error: fetchError } = await supabase
      .from("lead_outreach_events")
      .select(`
        id,
        lead_id,
        message,
        status,
        leads!inner(id, phone, phone_raw, phone_e164, business_name)
      `)
      .eq("channel", "sms")
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(limit);

    if (fetchError) {
      console.error("Failed to fetch queued events:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch queued events" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!events || events.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, sent: 0, failed: 0, message: "No queued events to send" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get suppression list
    const { data: suppressions } = await supabase
      .from("outreach_suppressions")
      .select("phone");
    const suppressedPhones = new Set((suppressions || []).map((s) => s.phone));

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const event of events) {
      const lead = event.leads as any;
      const bestPhone = lead.phone_e164 || lead.phone_raw || lead.phone;

      // Skip if no phone
      if (!bestPhone) {
        await supabase
          .from("lead_outreach_events")
          .update({ status: "failed", error: "No phone number available" })
          .eq("id", event.id);
        failed++;
        continue;
      }

      // Skip if suppressed
      if (suppressedPhones.has(bestPhone) || (lead.phone_e164 && suppressedPhones.has(lead.phone_e164))) {
        await supabase
          .from("lead_outreach_events")
          .update({ status: "failed", error: "Phone is suppressed" })
          .eq("id", event.id);
        await supabase
          .from("leads")
          .update({ outreach_status: "opted_out" })
          .eq("id", lead.id);
        failed++;
        continue;
      }

      // Send SMS
      const result = await sendTwilioSMS(bestPhone, event.message);

      if (result.success) {
        await supabase
          .from("lead_outreach_events")
          .update({ 
            status: "sent", 
            provider_message_id: result.messageId,
            error: null 
          })
          .eq("id", event.id);

        await supabase
          .from("leads")
          .update({ outreach_status: "sent" })
          .eq("id", lead.id);

        sent++;
      } else {
        await supabase
          .from("lead_outreach_events")
          .update({ status: "failed", error: result.error })
          .eq("id", event.id);

        await supabase
          .from("leads")
          .update({ outreach_status: "failed" })
          .eq("id", lead.id);

        failed++;
        errors.push(`${lead.business_name}: ${result.error}`);
      }

      // Small delay between sends to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    console.log(`SMS send complete: ${sent} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        ok: true, 
        sent, 
        failed, 
        errors: errors.slice(0, 5), // Only return first 5 errors
        total_processed: events.length 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Send error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// POST /sms/inbound - Handle inbound SMS from Twilio webhook
async function handleInbound(req: Request): Promise<Response> {
  try {
    // Parse form data from Twilio webhook
    const formData = await req.formData();
    const from = formData.get("From") as string;
    const to = formData.get("To") as string;
    const body = formData.get("Body") as string;
    const messageSid = formData.get("MessageSid") as string;

    console.log(`Inbound SMS from ${from}: ${body}`);

    if (!from || !body) {
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { status: 200, headers: { ...corsHeaders, "Content-Type": "text/xml" } }
      );
    }

    const supabase = getSupabaseClient();
    const normalizedFrom = from.replace(/\s+/g, "");

    // Check for opt-out keywords
    const optOutKeywords = ["STOP", "UNSUBSCRIBE", "CANCEL", "QUIT", "END"];
    const isOptOut = optOutKeywords.some((keyword) => 
      body.trim().toUpperCase().includes(keyword)
    );

    if (isOptOut) {
      console.log(`Opt-out received from ${from}`);

      // Add to suppression list
      await supabase
        .from("outreach_suppressions")
        .upsert({ phone: normalizedFrom, reason: "opted_out" }, { onConflict: "phone" });

      // Find and update any matching leads
      const { data: leads } = await supabase
        .from("leads")
        .select("id")
        .or(`phone_e164.eq.${normalizedFrom},phone_raw.eq.${normalizedFrom},phone.eq.${normalizedFrom}`);

      if (leads && leads.length > 0) {
        for (const lead of leads) {
          await supabase
            .from("leads")
            .update({ outreach_status: "opted_out" })
            .eq("id", lead.id);
        }
      }

      // Return TwiML response confirming opt-out
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Message>You have been unsubscribed and will not receive further messages.</Message></Response>`,
        { status: 200, headers: { ...corsHeaders, "Content-Type": "text/xml" } }
      );
    }

    // Store reply as outreach event
    // First, find the lead by phone number
    const { data: leads } = await supabase
      .from("leads")
      .select("id")
      .or(`phone_e164.eq.${normalizedFrom},phone_raw.eq.${normalizedFrom},phone.eq.${normalizedFrom}`)
      .limit(1);

    if (leads && leads.length > 0) {
      const leadId = leads[0].id;

      // Insert reply event
      await supabase
        .from("lead_outreach_events")
        .insert({
          lead_id: leadId,
          channel: "sms",
          message: body,
          status: "replied",
          provider_message_id: messageSid,
        });

      // Update lead status
      await supabase
        .from("leads")
        .update({ outreach_status: "replied" })
        .eq("id", leadId);
    } else {
      console.log(`No lead found for phone ${from}`);
    }

    // Return empty TwiML response (no auto-reply for regular messages)
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { status: 200, headers: { ...corsHeaders, "Content-Type": "text/xml" } }
    );
  } catch (error) {
    console.error("Inbound webhook error:", error);
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { status: 200, headers: { ...corsHeaders, "Content-Type": "text/xml" } }
    );
  }
}
