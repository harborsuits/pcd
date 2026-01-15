import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-key, x-twilio-signature",
};

// Admin test phone number for QA (server-side only)
const ADMIN_TEST_PHONE = "+12073805680";

// Validate Twilio webhook signature using Web Crypto API
// See: https://www.twilio.com/docs/usage/webhooks/webhooks-security
async function validateTwilioSignature(req: Request, rawBody: string): Promise<boolean> {
  const signature = req.headers.get("x-twilio-signature");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");

  if (!signature || !authToken) {
    console.error("Missing Twilio signature or auth token");
    return false;
  }

  // Build the validation URL (Twilio uses the full URL including any query params)
  // For edge functions, we need to use the actual public URL that Twilio calls
  const publicBaseUrl = Deno.env.get("PUBLIC_BASE_URL");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  
  // Construct the URL Twilio would have used to call this webhook
  let validationUrl: string;
  if (publicBaseUrl) {
    // Use configured public URL for webhook
    validationUrl = `${publicBaseUrl.replace(/\/$/, "")}/functions/v1/sms/inbound`;
  } else if (supabaseUrl) {
    validationUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/sms/inbound`;
  } else {
    console.error("No PUBLIC_BASE_URL or SUPABASE_URL configured");
    return false;
  }

  // Parse form data and sort parameters alphabetically
  const params = new URLSearchParams(rawBody);
  const sortedParams: [string, string][] = [];
  params.forEach((value, key) => {
    sortedParams.push([key, value]);
  });
  sortedParams.sort((a, b) => a[0].localeCompare(b[0]));

  // Build the data string: URL + sorted params concatenated
  let dataString = validationUrl;
  for (const [key, value] of sortedParams) {
    dataString += key + value;
  }

  try {
    // Calculate HMAC-SHA1 using Web Crypto API
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(authToken),
      { name: "HMAC", hash: "SHA-1" },
      false,
      ["sign"]
    );
    const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(dataString));
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));

    const isValid = signature === expectedSignature;
    if (!isValid) {
      console.error("Invalid Twilio signature", { 
        received: signature.substring(0, 10) + "...", 
        expected: expectedSignature.substring(0, 10) + "...",
        url: validationUrl
      });
    }
    
    return isValid;
  } catch (error) {
    console.error("Error validating Twilio signature:", error);
    return false;
  }
}

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

  // Route: POST /sms/send-test (admin-only) - Send test SMS to admin phone
  if (subPath === "send-test" && req.method === "POST") {
    return handleSendTest(req);
  }

  // Route: POST /sms/inbound (Twilio webhook - public but validated)
  if (subPath === "inbound" && req.method === "POST") {
    return handleInbound(req);
  }

  // Route: POST /sms/status-callback (Twilio delivery status webhook)
  if (subPath === "status-callback" && req.method === "POST") {
    return handleStatusCallback(req);
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    
    const formData = new URLSearchParams();
    formData.append("To", to);
    formData.append("Body", body);
    formData.append("MessagingServiceSid", messagingServiceSid);
    
    // Add status callback for delivery tracking
    if (supabaseUrl) {
      formData.append("StatusCallback", `${supabaseUrl}/functions/v1/sms/status-callback`);
    }

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

// POST /sms/send-test - Send test SMS to admin phone (for QA)
async function handleSendTest(req: Request): Promise<Response> {
  const authError = validateAdminKey(req);
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    const leadId = body.lead_id;

    if (!leadId) {
      return new Response(
        JSON.stringify({ error: "lead_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient();

    // Get the lead to build the message
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, business_name, demo_url, phone_e164")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!lead.demo_url) {
      return new Response(
        JSON.stringify({ error: "Lead has no demo URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the same message that would go to the real lead
    const publicBaseUrl = Deno.env.get("PUBLIC_BASE_URL") || "https://localsite.pro";
    const demoFullUrl = `${publicBaseUrl.replace(/\/$/, "")}${lead.demo_url}`;
    
    const message = `Hi! I built a free website demo for ${lead.business_name}. Check it out: ${demoFullUrl} – Reply STOP to opt out.`;

    console.log(`Sending TEST SMS to ${ADMIN_TEST_PHONE} for lead: ${lead.business_name}`);

    // Send to admin test phone instead of lead's phone
    const result = await sendTwilioSMS(ADMIN_TEST_PHONE, message);

    if (!result.success) {
      console.error("Test SMS failed:", result.error);
      return new Response(
        JSON.stringify({ ok: false, error: result.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log test send (with test_sent status so it doesn't affect real outreach)
    await supabase
      .from("lead_outreach_events")
      .insert({
        lead_id: leadId,
        channel: "sms",
        message,
        status: "test_sent",
        provider_message_id: result.messageId,
      });

    console.log(`Test SMS sent successfully to ${ADMIN_TEST_PHONE}`);

    return new Response(
      JSON.stringify({ 
        ok: true, 
        message: `Test SMS sent to ${ADMIN_TEST_PHONE}`,
        lead_name: lead.business_name,
        demo_url: demoFullUrl,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Send test error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// POST /sms/status-callback - Handle Twilio delivery status updates
async function handleStatusCallback(req: Request): Promise<Response> {
  try {
    const rawBody = await req.text();
    const params = new URLSearchParams(rawBody);
    
    const messageSid = params.get("MessageSid");
    const messageStatus = params.get("MessageStatus"); // queued, sent, delivered, failed, undelivered
    const errorCode = params.get("ErrorCode");
    
    console.log(`Status callback: ${messageSid} -> ${messageStatus}`, errorCode ? `Error: ${errorCode}` : "");
    
    if (!messageSid || !messageStatus) {
      return new Response("OK", { status: 200, headers: corsHeaders });
    }
    
    const supabase = getSupabaseClient();
    
    // Update the outreach event with delivery status
    const { error } = await supabase
      .from("lead_outreach_events")
      .update({
        delivery_status: messageStatus,
        delivery_status_at: new Date().toISOString(),
        delivery_error_code: errorCode || null,
      })
      .eq("provider_message_id", messageSid);
    
    if (error) {
      console.error("Failed to update delivery status:", error);
    }
    
    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Status callback error:", error);
    return new Response("OK", { status: 200, headers: corsHeaders });
  }
}

// POST /sms/inbound - Handle inbound SMS from Twilio webhook
async function handleInbound(req: Request): Promise<Response> {
  try {
    // Clone request to read body for signature validation
    const rawBody = await req.text();
    
    // Validate Twilio signature to prevent spoofed requests
    const isValidSignature = await validateTwilioSignature(req, rawBody);
    if (!isValidSignature) {
      console.error("Invalid Twilio signature - rejecting request");
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { status: 403, headers: { ...corsHeaders, "Content-Type": "text/xml" } }
      );
    }

    // Parse form data from validated request body
    const params = new URLSearchParams(rawBody);
    const from = params.get("From") as string;
    const to = params.get("To") as string;
    const body = params.get("Body") as string;
    const messageSid = params.get("MessageSid") as string;

    console.log(`Inbound SMS from ${from}: ${body}`);

    if (!from || !body) {
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { status: 200, headers: { ...corsHeaders, "Content-Type": "text/xml" } }
      );
    }

    const supabase = getSupabaseClient();
    
    // Sanitize and validate phone number format
    // Only allow digits, plus sign, and common phone characters
    const normalizedFrom = from.replace(/\s+/g, "");
    const phoneRegex = /^\+?[0-9\-\(\)]{7,20}$/;
    if (!phoneRegex.test(normalizedFrom)) {
      console.error("Invalid phone number format:", normalizedFrom.substring(0, 20));
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { status: 200, headers: { ...corsHeaders, "Content-Type": "text/xml" } }
      );
    }

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

      // Find and update any matching leads - use separate queries to avoid SQL injection
      const [{ data: leadsE164 }, { data: leadsRaw }, { data: leadsPhone }] = await Promise.all([
        supabase.from("leads").select("id").eq("phone_e164", normalizedFrom),
        supabase.from("leads").select("id").eq("phone_raw", normalizedFrom),
        supabase.from("leads").select("id").eq("phone", normalizedFrom),
      ]);
      
      // Combine and deduplicate results
      const leadIds = new Set<string>();
      [...(leadsE164 || []), ...(leadsRaw || []), ...(leadsPhone || [])].forEach(l => leadIds.add(l.id));
      const leads = Array.from(leadIds).map(id => ({ id }));

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
    // First, find the lead by phone number - use separate queries to avoid SQL injection
    const [{ data: replyLeadsE164 }, { data: replyLeadsRaw }, { data: replyLeadsPhone }] = await Promise.all([
      supabase.from("leads").select("id").eq("phone_e164", normalizedFrom).limit(1),
      supabase.from("leads").select("id").eq("phone_raw", normalizedFrom).limit(1),
      supabase.from("leads").select("id").eq("phone", normalizedFrom).limit(1),
    ]);
    
    // Take the first matching lead
    const replyLeads = replyLeadsE164?.[0] || replyLeadsRaw?.[0] || replyLeadsPhone?.[0];
    const leads = replyLeads ? [replyLeads] : null;

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
