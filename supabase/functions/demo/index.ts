import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Token validation: alphanumeric + hyphens, 12-128 chars
function isValidToken(token: string): boolean {
  return /^[a-zA-Z0-9\-_]{12,128}$/.test(token);
}

// Generate a URL-safe token
function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 24; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Generate a URL slug from business name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

// Send Telegram notification (non-blocking)
async function notifyTelegram(text: string): Promise<void> {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
  if (!token || !chatId) {
    console.log("Telegram not configured, skipping notification");
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    
    if (!response.ok) {
      console.error("Telegram notification failed:", await response.text());
    } else {
      console.log("Telegram notification sent successfully");
    }
  } catch (error) {
    console.error("Telegram notification error:", error);
  }
}

// ============================================================================
// CRM CORE: Find existing prospect or create new project
// Matches by email OR phone to prevent duplicates
// ============================================================================
interface ProspectInfo {
  name: string;
  email?: string;
  phone?: string;
  sourceDemoToken?: string;
  sourceDemoBusinessName?: string;
  pipelineStage: "quote_requested" | "claimed";
}

interface ProspectResult {
  projectId: string;
  projectToken: string;
  businessName: string;
  isNew: boolean;
}

async function findOrCreateProspectProject(
  supabase: SupabaseClient,
  info: ProspectInfo
): Promise<ProspectResult | null> {
  const { name, email, phone, sourceDemoToken, sourceDemoBusinessName, pipelineStage } = info;

  // Try to find existing project by email OR phone
  let existingProject = null;

  if (email) {
    const { data } = await supabase
      .from("projects")
      .select("id, project_token, business_name")
      .eq("contact_email", email)
      .is("deleted_at", null)
      .maybeSingle();
    if (data) existingProject = data;
  }

  if (!existingProject && phone) {
    const { data } = await supabase
      .from("projects")
      .select("id, project_token, business_name")
      .eq("contact_phone", phone)
      .is("deleted_at", null)
      .maybeSingle();
    if (data) existingProject = data;
  }

  if (existingProject) {
    // Update existing project with latest info and advance pipeline
    await supabase
      .from("projects")
      .update({
        pipeline_stage: pipelineStage,
        contact_name: name || existingProject.business_name,
        ...(email && { contact_email: email }),
        ...(phone && { contact_phone: phone }),
        ...(sourceDemoToken && { source_demo_token: sourceDemoToken }),
      })
      .eq("id", existingProject.id);

    console.log(`Found existing project for ${email || phone}: ${existingProject.business_name}`);
    return {
      projectId: existingProject.id,
      projectToken: existingProject.project_token,
      businessName: existingProject.business_name,
      isNew: false,
    };
  }

  // Create new project for this prospect
  const businessName = name || "New Prospect";
  const projectToken = generateToken();
  const businessSlug = generateSlug(businessName);

  const { data: newProject, error } = await supabase
    .from("projects")
    .insert({
      business_name: businessName,
      business_slug: businessSlug,
      project_token: projectToken,
      contact_name: name,
      contact_email: email || null,
      contact_phone: phone || null,
      source: pipelineStage === "quote_requested" ? "quote_request" : "claim",
      pipeline_stage: pipelineStage,
      status: "lead",
      source_demo_token: sourceDemoToken || null,
    })
    .select("id, project_token, business_name")
    .single();

  if (error || !newProject) {
    console.error("Failed to create prospect project:", error);
    return null;
  }

  console.log(`Created new prospect project: ${newProject.business_name} (${newProject.project_token})`);

  // Insert welcome message so portal is never empty - actionable upload guidance
  const welcomeMsg = pipelineStage === "claimed"
    ? `Hey! Thanks for claiming your design${sourceDemoBusinessName ? ` based on ${sourceDemoBusinessName}` : ""}. I'm excited to bring this to life for you!\n\nTo get started, please upload:\n• Your logo (PNG or SVG preferred)\n• 3-5 photos of your work or team\n• Any brand colors or fonts you use\n\nTap the 📎 button below to add files.`
    : `Thanks for requesting a quote! I'll get back to you within 1 business day with pricing.\n\nMeanwhile, feel free to upload:\n• Your current logo\n• Photos of your work\n• Any examples of sites you like\n\nThis helps me give you an accurate quote!`;

  await supabase.from("messages").insert({
    project_id: newProject.id,
    project_token: projectToken,
    sender_type: "admin",
    content: welcomeMsg,
  });

  return {
    projectId: newProject.id,
    projectToken: newProject.project_token,
    businessName: newProject.business_name,
    isNew: true,
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const demoIdx = pathParts.lastIndexOf("demo");
  const subPath = demoIdx >= 0 ? pathParts.slice(demoIdx + 1).join("/") : "";

  // Route: POST /demo/claim (legacy, still works for non-auth claims)
  if (subPath === "claim" && req.method === "POST") {
    return handleClaim(req);
  }
  
  // Route: POST /demo/claim-with-auth (new auth-based claim)
  if (subPath === "claim-with-auth" && req.method === "POST") {
    return handleClaimWithAuth(req);
  }

  // Route: POST /demo/quote - Handle quote requests from demo visitors
  if (subPath === "quote" && req.method === "POST") {
    return handleQuoteRequest(req);
  }

  // Route: GET /demo/:token (existing)
  if (req.method === "GET") {
    return handleGetDemo(req);
  }

  return new Response(
    JSON.stringify({ error: "Method not allowed" }),
    { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

// POST /demo/claim - Handle claim submissions (legacy, non-auth)
// Now creates a prospect project for CRM tracking
async function handleClaim(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { project_token, name, phone, email, notes } = body;

    if (!project_token || (!phone && !email)) {
      return new Response(
        JSON.stringify({ error: "project_token and at least phone or email required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isValidToken(project_token)) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the DEMO project (this is the demo they're claiming from)
    const { data: demoProject, error: projectError } = await supabase
      .from("projects")
      .select("id, business_name")
      .eq("project_token", project_token)
      .is("deleted_at", null)
      .maybeSingle();

    if (projectError || !demoProject) {
      console.error("Demo project not found for claim:", project_token);
      return new Response(
        JSON.stringify({ error: "Demo not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================================================
    // CRM: Find or create a PROSPECT project for this person
    // ========================================================================
    const prospectResult = await findOrCreateProspectProject(supabase, {
      name: name || demoProject.business_name,
      email,
      phone,
      sourceDemoToken: project_token,
      sourceDemoBusinessName: demoProject.business_name,
      pipelineStage: "claimed",
    });

    if (!prospectResult) {
      return new Response(
        JSON.stringify({ error: "Failed to create prospect record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find associated lead from the demo and record event
    const { data: lead } = await supabase
      .from("leads")
      .select("id")
      .eq("demo_project_id", demoProject.id)
      .maybeSingle();

    if (lead) {
      await supabase.from("lead_outreach_events").insert({
        lead_id: lead.id,
        channel: "web",
        status: "claimed",
        message: JSON.stringify({ name, phone, email, notes, prospect_token: prospectResult.projectToken }),
      });

      await supabase
        .from("leads")
        .update({ outreach_status: "replied" })
        .eq("id", lead.id);
    }

    // If they provided notes, add as a message
    if (notes) {
      await supabase.from("messages").insert({
        project_id: prospectResult.projectId,
        project_token: prospectResult.projectToken,
        sender_type: "client",
        content: notes,
      });
    }

    console.log(`Claim: prospect ${prospectResult.projectToken} from demo ${project_token}`);

    // Send Telegram notification
    const baseUrl = Deno.env.get("PUBLIC_BASE_URL") || "https://pleasantcovedesign.com";
    const telegramMsg =
      `🟢 <b>Design Claim!</b>\n` +
      `• <b>Prospect:</b> ${name || "—"}\n` +
      `• <b>Phone:</b> ${phone || "—"}\n` +
      `• <b>Email:</b> ${email || "—"}\n` +
      `• <b>From Demo:</b> ${demoProject.business_name}\n` +
      `• <b>Status:</b> ${prospectResult.isNew ? "🆕 New" : "📎 Existing"}\n\n` +
      `🔗 <a href="${baseUrl}/p/${prospectResult.projectToken}">View Portal</a>`;
    
    try { await notifyTelegram(telegramMsg); } catch (_) { /* fail silently */ }

    return new Response(
      JSON.stringify({ 
        ok: true,
        portal_token: prospectResult.projectToken,
        is_new: prospectResult.isNew,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Claim error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// POST /demo/claim-with-auth - Handle authenticated claim (extracts user from JWT)
// Now creates a prospect project for CRM tracking
async function handleClaimWithAuth(req: Request): Promise<Response> {
  try {
    // Extract user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT and get user
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { project_token, name } = body;

    if (!project_token) {
      return new Response(
        JSON.stringify({ error: "project_token required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isValidToken(project_token)) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the DEMO project (this is the demo they're claiming from)
    const { data: demoProject, error: projectError } = await supabase
      .from("projects")
      .select("id, business_name")
      .eq("project_token", project_token)
      .is("deleted_at", null)
      .maybeSingle();

    if (projectError || !demoProject) {
      return new Response(
        JSON.stringify({ error: "Demo not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================================================
    // CRM: Find or create a PROSPECT project for this authenticated user
    // ========================================================================
    const prospectResult = await findOrCreateProspectProject(supabase, {
      name: name || user.user_metadata?.full_name || demoProject.business_name,
      email: user.email,
      sourceDemoToken: project_token,
      sourceDemoBusinessName: demoProject.business_name,
      pipelineStage: "claimed",
    });

    if (!prospectResult) {
      return new Response(
        JSON.stringify({ error: "Failed to create prospect record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Link the prospect project to this authenticated user
    await supabase
      .from("projects")
      .update({ owner_user_id: user.id })
      .eq("id", prospectResult.projectId);

    // Find associated lead from the demo and record event
    const { data: lead } = await supabase
      .from("leads")
      .select("id")
      .eq("demo_project_id", demoProject.id)
      .maybeSingle();

    if (lead) {
      await supabase.from("lead_outreach_events").insert({
        lead_id: lead.id,
        channel: "web",
        status: "claimed",
        message: JSON.stringify({ name, email: user.email, auth: true, prospect_token: prospectResult.projectToken }),
      });

      await supabase
        .from("leads")
        .update({ outreach_status: "replied" })
        .eq("id", lead.id);
    }

    console.log(`Auth claim: prospect ${prospectResult.projectToken} from demo ${project_token}`);

    // Send Telegram notification
    const baseUrl = Deno.env.get("PUBLIC_BASE_URL") || "https://pleasantcovedesign.com";
    const telegramMsg =
      `🟢 <b>Design Claim (Auth)</b>\n` +
      `• <b>Prospect:</b> ${name || user.user_metadata?.full_name || "—"}\n` +
      `• <b>Email:</b> ${user.email || "—"}\n` +
      `• <b>From Demo:</b> ${demoProject.business_name}\n` +
      `• <b>Status:</b> ${prospectResult.isNew ? "🆕 New" : "📎 Existing"}\n\n` +
      `🔗 <a href="${baseUrl}/p/${prospectResult.projectToken}">View Portal</a>`;
    
    try { await notifyTelegram(telegramMsg); } catch (_) { /* fail silently */ }

    return new Response(
      JSON.stringify({ 
        ok: true,
        portal_token: prospectResult.projectToken,
        is_new: prospectResult.isNew,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Claim with auth error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// GET /demo/:token - Existing demo fetch logic
async function handleGetDemo(req: Request): Promise<Response> {
  try {
    // Extract token from URL path: /demo/:token or /functions/v1/demo/:token
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    
    // Find "demo" in path and get the next segment as token
    const demoIdx = pathParts.lastIndexOf("demo");
    const token = demoIdx >= 0 && demoIdx < pathParts.length - 1 
      ? pathParts[demoIdx + 1] 
      : pathParts[pathParts.length - 1];
    const slugParam = url.searchParams.get("slug");

    if (!token || token === "demo" || token === "claim") {
      console.log("Missing token in request");
      return new Response(
        JSON.stringify({ error: "Token required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Token sanity check
    if (!isValidToken(token)) {
      console.log("Invalid token format");
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching demo for token: ${token.slice(0, 8)}...`);

    // Initialize Supabase client with service role for bypassing RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build project query
    let projectQuery = supabase
      .from("projects")
      .select("id, business_name, business_slug, status, project_token, city, state, address, website, contact_phone")
      .eq("project_token", token)
      .is("deleted_at", null);

    // Optional slug enforcement
    if (slugParam) {
      projectQuery = projectQuery.eq("business_slug", slugParam);
    }

    const { data: project, error: projectError } = await projectQuery.maybeSingle();

    if (projectError) {
      console.error("Project query error:", projectError);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!project) {
      console.log("Project not found for token");
      return new Response(
        JSON.stringify({ error: "Demo not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch demo content
    const { data: demo, error: demoError } = await supabase
      .from("demos")
      .select("template_type, content")
      .eq("project_id", project.id)
      .maybeSingle();

    if (demoError) {
      console.error("Demo query error:", demoError);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!demo) {
      console.log("Demo content not found for project");
      return new Response(
        JSON.stringify({ error: "Demo not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try to fetch enriched lead data if available
    const { data: lead } = await supabase
      .from("leads")
      .select("lead_enriched, industry_template, category, phone, query_term")
      .eq("demo_project_id", project.id)
      .maybeSingle();

    // Extract enriched data from lead_enriched (object, not array)
    const enrichedData = lead?.lead_enriched as Record<string, unknown> || {};
    
    // Merge demo content with enriched data
    const mergedContent = {
      ...(demo.content as Record<string, unknown>),
      // Add enriched fields (prefer demo content if explicitly set)
      city: (demo.content as Record<string, unknown>).city || project.city || enrichedData.city,
      state: (demo.content as Record<string, unknown>).state || project.state || enrichedData.state,
      phone: (demo.content as Record<string, unknown>).phone || project.contact_phone || lead?.phone,
      rating: enrichedData.rating || null,
      reviewCount: enrichedData.review_count || null,
      photoReferences: enrichedData.photo_references || [],
      nearbyTowns: enrichedData.neighborhood ? [enrichedData.neighborhood] : [],
      // CRITICAL: Include category and occupation for visual taxonomy resolution
      category: lead?.category || null,
      occupation: lead?.query_term || null,
    };

    // Clean response - no internal IDs exposed, but include token for claim
    const response = {
      business: {
        name: project.business_name,
        slug: project.business_slug,
      },
      project_token: project.project_token,
      demo: {
        template_type: lead?.industry_template || demo.template_type,
        content: mergedContent,
      },
    };

    console.log(`Demo fetched successfully for: ${project.business_name}`);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// POST /demo/quote - Handle quote requests from demo page visitors
// Now creates/attaches a prospect project for CRM tracking
async function handleQuoteRequest(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { project_token, name, phone, email, service, message } = body;

    if (!project_token) {
      return new Response(
        JSON.stringify({ error: "project_token required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isValidToken(project_token)) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!name || !phone || !email) {
      return new Response(
        JSON.stringify({ error: "name, phone, and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Quote request for demo ${project_token} from ${name}`);

    // Find the DEMO project (this is the demo they're viewing, not their prospect project)
    const { data: demoProject, error: projectError } = await supabase
      .from("projects")
      .select("id, business_name, project_token")
      .eq("project_token", project_token)
      .is("deleted_at", null)
      .maybeSingle();

    if (projectError || !demoProject) {
      console.error("Demo project not found:", projectError);
      return new Response(
        JSON.stringify({ error: "Demo not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================================================
    // CRM: Find or create a PROSPECT project for this person
    // This is their personal project, not the demo they viewed
    // ========================================================================
    const prospectResult = await findOrCreateProspectProject(supabase, {
      name,
      email,
      phone,
      sourceDemoToken: project_token,
      sourceDemoBusinessName: demoProject.business_name,
      pipelineStage: "quote_requested",
    });

    if (!prospectResult) {
      return new Response(
        JSON.stringify({ error: "Failed to create prospect record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the associated lead (if this demo came from lead gen)
    const { data: lead } = await supabase
      .from("leads")
      .select("id")
      .eq("demo_project_id", demoProject.id)
      .maybeSingle();

    // Record the quote request as an outreach event
    if (lead) {
      await supabase.from("lead_outreach_events").insert({
        lead_id: lead.id,
        channel: "web",
        status: "quote_requested",
        message: JSON.stringify({ name, email, phone, service, message, prospect_token: prospectResult.projectToken }),
      });
    }

    // Create quote request message in the PROSPECT's project thread
    // Tag with [QUOTE_REQUEST] marker for easy filtering
    await supabase.from("messages").insert({
      project_id: prospectResult.projectId,
      project_token: prospectResult.projectToken,
      sender_type: "client",
      content: `[QUOTE_REQUEST]\n📝 **Quote Request**\n\n**Service:** ${service || "Not specified"}\n**Details:** ${message || "None provided"}\n\n_Requested from demo: ${demoProject.business_name}_`,
    });

    // Send Telegram notification with actionable links
    const baseUrl = Deno.env.get("PUBLIC_BASE_URL") || "https://pleasantcovedesign.com";
    const telegramText = `🔔 <b>Quote Request!</b>\n\n` +
      `<b>Prospect:</b> ${name}\n` +
      `<b>Phone:</b> ${phone}\n` +
      `<b>Email:</b> ${email}\n` +
      `<b>Service:</b> ${service || "Not specified"}\n` +
      `<b>From Demo:</b> ${demoProject.business_name}\n` +
      `<b>Status:</b> ${prospectResult.isNew ? "🆕 New prospect" : "📎 Existing prospect"}\n\n` +
      `🔗 <a href="${baseUrl}/p/${prospectResult.projectToken}">View Portal</a> | ` +
      `<a href="${baseUrl}/operator">Open Operator</a>`;
    
    notifyTelegram(telegramText);

    console.log(`Quote request saved, prospect: ${prospectResult.projectToken} (new: ${prospectResult.isNew})`);

    // Return success with the prospect's portal token so frontend can show link
    return new Response(
      JSON.stringify({ 
        ok: true,
        portal_token: prospectResult.projectToken,
        is_new: prospectResult.isNew,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Quote request error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
