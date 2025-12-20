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

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

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

    if (!token || token === "demo") {
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
      .select("id, business_name, business_slug, status, project_token")
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

    // Clean response - no internal IDs exposed
    const response = {
      business: {
        name: project.business_name,
        slug: project.business_slug,
      },
      demo: {
        template_type: demo.template_type,
        content: demo.content,
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
});