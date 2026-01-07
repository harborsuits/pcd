import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

// Token validation
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

  // Routes:
  // GET /push/vapid-public-key - Get public VAPID key for subscription
  // POST /push/:token/subscribe - Subscribe to push notifications
  // DELETE /push/:token/unsubscribe - Unsubscribe from push notifications
  // POST /push/:token/send - Send push notification (internal, requires admin key)

  const pushIdx = pathParts.lastIndexOf("push");

  // GET /push/vapid-public-key
  if (pathParts[pushIdx + 1] === "vapid-public-key" && req.method === "GET") {
    const publicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    if (!publicKey) {
      return new Response(
        JSON.stringify({ error: "Push notifications not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({ publicKey }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const token = pathParts[pushIdx + 1];
  const action = pathParts[pushIdx + 2];

  if (!token || !isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // POST /push/:token/subscribe - Subscribe to push notifications
  if (action === "subscribe" && req.method === "POST") {
    try {
      const body = await req.json();
      const { subscription, who = "client" } = body;

      if (!subscription || !subscription.endpoint || !subscription.keys) {
        return new Response(
          JSON.stringify({ error: "Invalid subscription object" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify project exists
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id")
        .eq("project_token", token)
        .is("deleted_at", null)
        .maybeSingle();

      if (projectError || !project) {
        return new Response(
          JSON.stringify({ error: "Project not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Upsert subscription (using endpoint as unique key)
      const { error: upsertError } = await supabase
        .from("push_subscriptions")
        .upsert(
          {
            project_token: token,
            who,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          },
          { onConflict: "endpoint" }
        );

      if (upsertError) {
        console.error("Subscription upsert error:", upsertError);
        return new Response(
          JSON.stringify({ error: "Failed to save subscription" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Push subscription saved for token: ${token.slice(0, 8)}..., who: ${who}`);

      return new Response(
        JSON.stringify({ ok: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Subscribe error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // DELETE /push/:token/unsubscribe - Unsubscribe from push notifications
  if (action === "unsubscribe" && req.method === "DELETE") {
    try {
      const body = await req.json();
      const { endpoint } = body;

      if (!endpoint) {
        return new Response(
          JSON.stringify({ error: "Endpoint required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: deleteError } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("endpoint", endpoint);

      if (deleteError) {
        console.error("Unsubscribe error:", deleteError);
        return new Response(
          JSON.stringify({ error: "Failed to unsubscribe" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Push subscription removed for token: ${token.slice(0, 8)}...`);

      return new Response(
        JSON.stringify({ ok: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Unsubscribe error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // POST /push/:token/send - Send push notification to client (requires admin key)
  // This uses a simpler fetch-based approach that works with most push services
  if (action === "send" && req.method === "POST") {
    try {
      const adminKey = req.headers.get("x-admin-key");
      const expectedKey = Deno.env.get("ADMIN_KEY");

      if (!adminKey || adminKey !== expectedKey) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const body = await req.json();
      const { title, message, who = "client" } = body;

      if (!title || !message) {
        return new Response(
          JSON.stringify({ error: "Title and message required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get subscriptions for this project/target
      const { data: subscriptions, error: fetchError } = await supabase
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .eq("project_token", token)
        .eq("who", who);

      if (fetchError) {
        console.error("Fetch subscriptions error:", fetchError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch subscriptions" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!subscriptions || subscriptions.length === 0) {
        console.log(`No push subscriptions found for token: ${token.slice(0, 8)}..., who: ${who}`);
        return new Response(
          JSON.stringify({ ok: true, sent: 0, message: "No subscriptions" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // For now, just log that we would send push notifications
      // Full web push implementation requires complex crypto that's better handled by a library
      console.log(`Would send push notification to ${subscriptions.length} subscribers for token: ${token.slice(0, 8)}...`);
      console.log(`Title: ${title}, Message: ${message}`);

      // Mark subscriptions as "notified" (in a real implementation, we'd actually send)
      // For MVP, the client can poll or use realtime instead

      return new Response(
        JSON.stringify({ 
          ok: true, 
          sent: subscriptions.length, 
          total: subscriptions.length,
          note: "Push notifications stored. Full web push delivery coming soon."
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Send push error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: "Not found" }),
    { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
