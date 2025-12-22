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
  if (!origin) return true; // Allow requests without origin (server-to-server, etc.)
  return ALLOWED_ORIGINS.some(pattern => pattern.test(origin));
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

// Token validation: alphanumeric + hyphens/underscores, 12-128 chars
function isValidToken(token: string): boolean {
  return /^[a-zA-Z0-9\-_]{12,128}$/.test(token);
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  // Check origin for CORS - reject disallowed origins
  if (origin && !isAllowedOrigin(origin)) {
    return new Response(
      JSON.stringify({ error: "Origin not allowed" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  
  // Check for review-item action: POST /portal/:token/review/:itemId
  const portalIdx = pathParts.lastIndexOf("portal");
  const reviewIdx = pathParts.indexOf("review");
  
  if (reviewIdx > portalIdx && req.method === "POST") {
    const token = pathParts[portalIdx + 1];
    const itemId = pathParts[reviewIdx + 1];
    return handleReviewAction(req, token, itemId, corsHeaders);
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

    // Fetch files (include id for media proxy)
    const { data: files, error: filesError } = await supabase
      .from("files")
      .select("id, file_name, file_type, description, created_at")
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

    // Fetch review items
    const { data: reviewItems, error: reviewItemsError } = await supabase
      .from("review_items")
      .select("id, title, description, item_type, item_url, item_content, status, client_notes, created_at, updated_at")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false });

    if (reviewItemsError) {
      console.error("Review items query error:", reviewItemsError);
      // Non-fatal: continue with empty review items
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
        id: f.id,
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
      review_items: (reviewItems || []).map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        item_type: r.item_type,
        item_url: r.item_url,
        item_content: r.item_content,
        status: r.status,
        client_notes: r.client_notes,
        created_at: r.created_at,
        updated_at: r.updated_at,
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

// Handle review item approval/changes request
async function handleReviewAction(
  req: Request, 
  token: string, 
  itemId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    if (!token || !isValidToken(token)) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!itemId) {
      return new Response(
        JSON.stringify({ error: "Item ID required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { action, notes } = body;

    if (!action || !["approve", "request_changes"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "action must be 'approve' or 'request_changes'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the item belongs to the project with this token
    const { data: item, error: itemError } = await supabase
      .from("review_items")
      .select("id, project_token, title")
      .eq("id", itemId)
      .eq("project_token", token)
      .maybeSingle();

    if (itemError || !item) {
      console.error("Review item not found:", itemError);
      return new Response(
        JSON.stringify({ error: "Item not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the item status
    const newStatus = action === "approve" ? "approved" : "changes_requested";
    const { error: updateError } = await supabase
      .from("review_items")
      .update({
        status: newStatus,
        client_notes: action === "request_changes" ? (notes || null) : null,
      })
      .eq("id", itemId);

    if (updateError) {
      console.error("Update review item error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update item" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Review item ${itemId} updated to ${newStatus}`);

    // Send Telegram notification
    const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const telegramChatId = Deno.env.get("TELEGRAM_CHAT_ID");
    if (telegramBotToken && telegramChatId) {
      const emoji = action === "approve" ? "✅" : "🔄";
      const msg = `${emoji} <b>Review Update</b>\n` +
        `• <b>Item:</b> ${item.title}\n` +
        `• <b>Action:</b> ${action === "approve" ? "Approved" : "Changes Requested"}\n` +
        (notes ? `• <b>Notes:</b> ${notes}\n` : "") +
        `• <b>Token:</b> <code>${token.slice(0, 12)}...</code>`;
      
      try {
        await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text: msg,
            parse_mode: "HTML",
          }),
        });
      } catch (e) {
        console.error("Telegram notification failed:", e);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, status: newStatus }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Review action error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
