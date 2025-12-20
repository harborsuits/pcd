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

  console.log(`Admin endpoint called: ${subPath}, method: ${req.method}`);

  // Route: GET /admin/inbox
  if (subPath === "inbox" && req.method === "GET") {
    return handleInbox(req);
  }

  // Route: POST /admin/messages/reply
  if (subPath === "messages/reply" && req.method === "POST") {
    return handleMessagesReply(req);
  }

  return new Response(
    JSON.stringify({ error: "Not found" }),
    { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

// Validate admin key helper
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
    console.log("Invalid or missing admin key");
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return null; // Valid
}

// GET /admin/inbox - List projects with last message and unread count
async function handleInbox(req: Request): Promise<Response> {
  const authError = validateAdminKey(req);
  if (authError) return authError;

  try {
    console.log("Fetching admin inbox...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all active projects
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id, project_token, business_name, status, updated_at")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });

    if (projectsError) {
      console.error("Projects query error:", projectsError);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!projects || projects.length === 0) {
      return new Response(
        JSON.stringify([]),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all project IDs for batch queries
    const projectIds = projects.map(p => p.id);

    // Batch fetch latest messages for all projects
    const { data: latestMessages } = await supabase
      .from("messages")
      .select("project_id, content, sender_type, created_at")
      .in("project_id", projectIds)
      .order("created_at", { ascending: false });

    // Batch fetch unread counts (client messages with no read_at)
    const { data: unreadData } = await supabase
      .from("messages")
      .select("project_id")
      .in("project_id", projectIds)
      .eq("sender_type", "client")
      .is("read_at", null);

    // Build maps for efficient lookup
    const lastMessageMap = new Map<string, { content: string; sender_type: string; created_at: string }>();
    for (const msg of latestMessages || []) {
      if (!lastMessageMap.has(msg.project_id)) {
        lastMessageMap.set(msg.project_id, {
          content: msg.content,
          sender_type: msg.sender_type,
          created_at: msg.created_at,
        });
      }
    }

    const unreadCountMap = new Map<string, number>();
    for (const msg of unreadData || []) {
      unreadCountMap.set(msg.project_id, (unreadCountMap.get(msg.project_id) || 0) + 1);
    }

    // Build response
    const inbox = projects.map(p => ({
      project_token: p.project_token,
      business_name: p.business_name,
      status: p.status,
      last_message: lastMessageMap.get(p.id) || null,
      unread_count: unreadCountMap.get(p.id) || 0,
    }));

    // Sort by last_message.created_at desc, nulls last
    inbox.sort((a, b) => {
      if (!a.last_message && !b.last_message) return 0;
      if (!a.last_message) return 1;
      if (!b.last_message) return -1;
      return new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime();
    });

    console.log(`Inbox fetched: ${inbox.length} projects`);

    return new Response(
      JSON.stringify(inbox),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Inbox error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function handleMessagesReply(req: Request): Promise<Response> {
  const authError = validateAdminKey(req);
  if (authError) return authError;

  try {

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
