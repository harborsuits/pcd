import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allowed origins for widget embedding
const ALLOWED_ORIGINS = [
  /^https?:\/\/.*\.lovable\.app$/,
  /^https?:\/\/.*\.lovableproject\.com$/,
  /^https?:\/\/.*\.squarespace\.com$/,
  /^https?:\/\/.*\.sqsp\.com$/,
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https?:\/\/.*\.pleasantcove\.design$/,
];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true;
  return ALLOWED_ORIGINS.some(pattern => pattern.test(origin));
}

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  const allowedOrigin = origin && isAllowedOrigin(origin) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

// Token validation: alphanumeric + hyphens/underscores, 12-128 chars
function isValidToken(token: string): boolean {
  return /^[a-zA-Z0-9\-_]{12,128}$/.test(token);
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

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
    // Extract token from URL path: /portal/:token or /functions/v1/portal/:token
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    
    // Find "portal" in path and get the next segment as token
    const portalIdx = pathParts.lastIndexOf("portal");
    const token = portalIdx >= 0 && portalIdx < pathParts.length - 1 
      ? pathParts[portalIdx + 1] 
      : pathParts[pathParts.length - 1];

    // Pagination params
    const messagesLimit = Math.min(
      parseInt(url.searchParams.get("messages_limit") || "50", 10),
      100 // Cap at 100
    );
    const messagesBefore = url.searchParams.get("messages_before"); // ISO timestamp cursor

    // Validate messages_before if provided
    if (messagesBefore) {
      const parsedDate = new Date(messagesBefore);
      if (isNaN(parsedDate.getTime())) {
        console.log("Invalid messages_before timestamp");
        return new Response(
          JSON.stringify({ error: "Invalid messages_before" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (!token || token === "portal") {
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

    console.log(`Fetching portal for token: ${token.slice(0, 8)}...`);

    // Initialize Supabase client with service role for bypassing RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch project by token (exclude soft-deleted)
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, business_name, business_slug, status, project_token")
      .eq("project_token", token)
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
        JSON.stringify({ error: "Portal not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch messages (paginated, oldest first for proper ordering) - include id for deduplication
    // We fetch in ascending order so messages display oldest → newest
    let messagesQuery = supabase
      .from("messages")
      .select("id, content, sender_type, created_at, read_at")
      .eq("project_id", project.id)
      .order("created_at", { ascending: true })
      .limit(messagesLimit + 1);

    if (messagesBefore) {
      messagesQuery = messagesQuery.lt("created_at", messagesBefore);
    }

    const { data: rawMessages, error: messagesError } = await messagesQuery;

    if (messagesError) {
      console.error("Messages query error:", messagesError);
      // Non-fatal: continue with empty messages
    }

    // Check if there are more messages and slice to limit
    const hasMoreMessages = (rawMessages || []).length > messagesLimit;
    const messages = hasMoreMessages ? (rawMessages || []).slice(0, messagesLimit) : (rawMessages || []);

    // Fetch files (metadata only, no IDs)
    const { data: files, error: filesError } = await supabase
      .from("files")
      .select("file_name, file_type, description, created_at")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false });

    if (filesError) {
      console.error("Files query error:", filesError);
      // Non-fatal: continue with empty files
    }

    // Fetch payments (history, no internal IDs)
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("amount_cents, payment_type, status, created_at")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false });

    if (paymentsError) {
      console.error("Payments query error:", paymentsError);
      // Non-fatal: continue with empty payments
    }

    // Clean response - include id for deduplication
    const response = {
      business: {
        name: project.business_name,
        slug: project.business_slug,
        status: project.status,
      },
      messages: (messages || []).map((m) => ({
        id: m.id,
        content: m.content,
        sender_type: m.sender_type,
        created_at: m.created_at,
        read_at: m.read_at,
      })),
      files: (files || []).map((f) => ({
        file_name: f.file_name,
        file_type: f.file_type,
        description: f.description,
        created_at: f.created_at,
      })),
      payments: (payments || []).map((p) => ({
        amount_cents: p.amount_cents,
        payment_type: p.payment_type,
        status: p.status,
        created_at: p.created_at,
      })),
      pagination: {
        messages_limit: messagesLimit,
        messages_before: messagesBefore,
        has_more_messages: hasMoreMessages,
      },
    };

    console.log(`Portal fetched successfully for: ${project.business_name}`);

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
