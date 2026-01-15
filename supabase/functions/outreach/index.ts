import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Site URL for SMS templates
const SITE_URL = "https://pleasantcovedesign.com/";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const outreachIdx = pathParts.lastIndexOf("outreach");
  const subPath = outreachIdx >= 0 ? pathParts.slice(outreachIdx + 1).join("/") : "";

  console.log(`Outreach endpoint called: ${subPath}, method: ${req.method}`);

  // Route: POST /outreach/queue
  if (subPath === "queue" && req.method === "POST") {
    return handleQueue(req);
  }

  // Route: GET /outreach/events (list queued events)
  if (subPath === "events" && req.method === "GET") {
    return handleListEvents(req);
  }

  // Route: PATCH /outreach/events/:id (update event status)
  if (subPath.startsWith("events/") && req.method === "PATCH") {
    const eventId = subPath.replace("events/", "");
    return handleUpdateEvent(req, eventId);
  }

  // Route: POST /outreach/suppress (add to suppression list)
  if (subPath === "suppress" && req.method === "POST") {
    return handleSuppress(req);
  }

  return new Response(
    JSON.stringify({ error: "Not found" }),
    { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

// Validate admin access via JWT and role check
async function validateAdminKey(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader?.startsWith("Bearer ")) {
    console.log("Missing or invalid Authorization header");
    return new Response(
      JSON.stringify({ error: "Unauthorized", message: "Missing authentication token" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  
  // Create client with user's auth header to validate JWT
  const supabaseWithAuth = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabaseWithAuth.auth.getClaims(token);

  if (claimsError || !claimsData?.claims) {
    console.log("Invalid JWT token:", claimsError?.message);
    return new Response(
      JSON.stringify({ error: "Unauthorized", message: "Invalid or expired token" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const userId = claimsData.claims.sub as string;
  const email = claimsData.claims.email as string || "unknown";

  // Check if user has admin role using service client
  const supabase = getSupabaseClient();
  const { data: roleData, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (roleError) {
    console.error("Role check error:", roleError);
    return new Response(
      JSON.stringify({ error: "Server error", message: "Failed to verify permissions" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!roleData) {
    console.log(`User ${userId} (${email}) attempted admin access without admin role`);
    return new Response(
      JSON.stringify({ error: "Forbidden", message: "Admin access required" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log(`Admin authenticated: ${email} (${userId})`);
  return null; // Valid
}

function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Render template with variables
function renderTemplate(templateBody: string, businessName: string): string {
  return templateBody
    .replace(/\{\{business_name\}\}/g, businessName)
    .replace(/\{\{site_url\}\}/g, SITE_URL);
}

// POST /outreach/queue - Queue leads for outreach
async function handleQueue(req: Request): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { lead_ids, template_id } = body as { lead_ids?: string[]; template_id?: string };

    if (!lead_ids || !Array.isArray(lead_ids) || lead_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: "lead_ids array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient();

    // Fetch template from database
    let templateBody: string | null = null;
    
    if (template_id) {
      const { data: template, error: templateError } = await supabase
        .from("sms_templates")
        .select("body")
        .eq("id", template_id)
        .eq("is_active", true)
        .single();
      
      if (!templateError && template) {
        templateBody = template.body;
      }
    }

    // Fallback: fetch first active template
    if (!templateBody) {
      const { data: defaultTemplate } = await supabase
        .from("sms_templates")
        .select("body")
        .eq("is_active", true)
        .order("name")
        .limit(1)
        .single();
      
      templateBody = defaultTemplate?.body || null;
    }

    if (!templateBody) {
      return new Response(
        JSON.stringify({ error: "No active SMS template found. Please create a template first." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let queued = 0;
    let skipped = 0;
    const skippedReasons: Record<string, number> = {};

    // Get suppression list
    const { data: suppressions } = await supabase
      .from("outreach_suppressions")
      .select("phone");
    const suppressedPhones = new Set((suppressions || []).map((s) => s.phone));

    for (const leadId of lead_ids) {
      // Fetch lead with phone fields (removed demo requirements)
      const { data: lead, error: leadError } = await supabase
        .from("leads")
        .select("id, business_name, phone, phone_raw, phone_e164, outreach_status")
        .eq("id", leadId)
        .single();

      if (leadError || !lead) {
        skippedReasons["not_found"] = (skippedReasons["not_found"] || 0) + 1;
        skipped++;
        continue;
      }

      // Use best available phone (prefer E.164)
      const bestPhone = lead.phone_e164 || lead.phone_raw || lead.phone;

      // Check skip conditions
      if (["skip", "opted_out", "queued", "sent"].includes(lead.outreach_status || "")) {
        skippedReasons["already_processed"] = (skippedReasons["already_processed"] || 0) + 1;
        skipped++;
        continue;
      }

      if (!bestPhone) {
        skippedReasons["no_phone"] = (skippedReasons["no_phone"] || 0) + 1;
        skipped++;
        continue;
      }

      // Check suppression with best phone (prefer E.164 for consistency)
      if (suppressedPhones.has(bestPhone) || (lead.phone_e164 && suppressedPhones.has(lead.phone_e164))) {
        skippedReasons["suppressed"] = (skippedReasons["suppressed"] || 0) + 1;
        skipped++;
        continue;
      }

      // Generate message using template from database
      const message = renderTemplate(templateBody, lead.business_name);

      // Insert outreach event
      const { error: insertError } = await supabase
        .from("lead_outreach_events")
        .insert({
          lead_id: lead.id,
          channel: "sms",
          message,
          status: "queued",
          direction: "outbound",
        });

      if (insertError) {
        console.error("Failed to queue event:", insertError);
        skippedReasons["insert_error"] = (skippedReasons["insert_error"] || 0) + 1;
        skipped++;
        continue;
      }

      // Update lead status
      await supabase
        .from("leads")
        .update({ outreach_status: "queued" })
        .eq("id", lead.id);

      queued++;
    }

    console.log(`Outreach queue: ${queued} queued, ${skipped} skipped`);

    return new Response(
      JSON.stringify({ ok: true, queued, skipped, skipped_reasons: skippedReasons }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Queue error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// GET /outreach/events - List outreach events
async function handleListEvents(req: Request): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit") || "100", 10);

    const supabase = getSupabaseClient();

    let query = supabase
      .from("lead_outreach_events")
      .select(`
        id,
        lead_id,
        channel,
        message,
        status,
        created_at,
        error,
        leads!inner(id, business_name, phone, demo_url, outreach_status)
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error("List events error:", error);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ events: events || [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("List events error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// PATCH /outreach/events/:id - Update event status
async function handleUpdateEvent(req: Request, eventId: string): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { status, update_lead_status } = body as { status?: string; update_lead_status?: boolean };

    if (!status) {
      return new Response(
        JSON.stringify({ error: "status is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validStatuses = ["queued", "sent", "failed", "replied"];
    if (!validStatuses.includes(status)) {
      return new Response(
        JSON.stringify({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient();

    // Get the event to find lead_id
    const { data: event, error: eventError } = await supabase
      .from("lead_outreach_events")
      .select("lead_id")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: "Event not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update event
    const { error: updateError } = await supabase
      .from("lead_outreach_events")
      .update({ status })
      .eq("id", eventId);

    if (updateError) {
      console.error("Update event error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update event" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Optionally update lead status
    if (update_lead_status !== false) {
      await supabase
        .from("leads")
        .update({ outreach_status: status })
        .eq("id", event.lead_id);
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Update event error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// POST /outreach/suppress - Add phone to suppression list
async function handleSuppress(req: Request): Promise<Response> {
  const authError = await validateAdminKey(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { phone, reason = "opted_out", lead_id } = body as { phone?: string; reason?: string; lead_id?: string };

    if (!phone) {
      return new Response(
        JSON.stringify({ error: "phone is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient();

    // Add to suppressions (upsert)
    const { error: suppressError } = await supabase
      .from("outreach_suppressions")
      .upsert({ phone, reason }, { onConflict: "phone" });

    if (suppressError) {
      console.error("Suppress error:", suppressError);
      return new Response(
        JSON.stringify({ error: "Failed to add suppression" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update lead if provided
    if (lead_id) {
      await supabase
        .from("leads")
        .update({ outreach_status: "opted_out" })
        .eq("id", lead_id);
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Suppress error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
