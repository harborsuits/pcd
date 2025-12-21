import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Token validation: alphanumeric + hyphens, 12-128 chars
function isValidToken(token: string): boolean {
  return /^[a-zA-Z0-9\-_]{12,128}$/.test(token);
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

  // Route: POST /demo/claim
  if (subPath === "claim" && req.method === "POST") {
    return handleClaim(req);
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

// POST /demo/claim - Handle claim submissions
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

    // Find the project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, business_name")
      .eq("project_token", project_token)
      .is("deleted_at", null)
      .maybeSingle();

    if (projectError || !project) {
      console.error("Project not found for claim:", project_token);
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find associated lead
    const { data: lead } = await supabase
      .from("leads")
      .select("id")
      .eq("demo_project_id", project.id)
      .maybeSingle();

    // Record the claim as a lead outreach event (inbound)
    if (lead) {
      await supabase.from("lead_outreach_events").insert({
        lead_id: lead.id,
        channel: "web",
        status: "claimed",
        message: JSON.stringify({ name, phone, email, notes }),
      });

      // Update lead status
      await supabase
        .from("leads")
        .update({ outreach_status: "replied" })
        .eq("id", lead.id);
    }

    // Also update project status to interested
    await supabase
      .from("projects")
      .update({ 
        status: "interested",
        contact_name: name || null,
        contact_phone: phone || null,
        contact_email: email || null,
        notes: notes || null,
      })
      .eq("id", project.id);

    console.log(`Claim received for ${project.business_name}`);

    return new Response(
      JSON.stringify({ ok: true }),
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
      .select("lead_enriched, industry_template, category, phone")
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
