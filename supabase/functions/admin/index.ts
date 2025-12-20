import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-key",
};

// Token validation: alphanumeric + hyphens/underscores, 12-128 chars
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
  
  // Find "admin" in path and get remaining segments
  const adminIdx = pathParts.lastIndexOf("admin");
  const subPath = adminIdx >= 0 ? pathParts.slice(adminIdx + 1).join("/") : "";

  console.log(`Admin endpoint called: ${subPath}`);

  // Route: POST /admin/messages/reply
  if (subPath === "messages/reply" && req.method === "POST") {
    return handleMessagesReply(req);
  }

  return new Response(
    JSON.stringify({ error: "Not found" }),
    { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

async function handleMessagesReply(req: Request): Promise<Response> {
  try {
    // Validate admin key
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
      console.log("Invalid or missing admin key");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    let body: { project_token?: string; content?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { project_token, content } = body;

    if (!project_token || !isValidToken(project_token)) {
      return new Response(
        JSON.stringify({ error: "Valid project_token required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trimmedContent = content?.trim();
    if (!trimmedContent || trimmedContent.length === 0) {
      return new Response(
        JSON.stringify({ error: "Message content required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (trimmedContent.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Message too long (max 5000 chars)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Admin reply for token: ${project_token.slice(0, 8)}...`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Resolve project by token
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, project_token")
      .eq("project_token", project_token)
      .is("deleted_at", null)
      .maybeSingle();

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
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert admin message
    const { data: message, error: insertError } = await supabase
      .from("messages")
      .insert({
        project_id: project.id,
        project_token: project.project_token,
        sender_type: "admin",
        content: trimmedContent,
      })
      .select("sender_type, content, created_at")
      .single();

    if (insertError) {
      console.error("Message insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to send message" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Admin message sent successfully");

    return new Response(
      JSON.stringify({
        ok: true,
        message: {
          sender_type: message.sender_type,
          content: message.content,
          created_at: message.created_at,
        },
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
