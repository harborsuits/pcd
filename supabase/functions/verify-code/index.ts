import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Max verification attempts before lockout
const MAX_ATTEMPTS = 10;

// Hash the code the same way as send-verification-code
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code + Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code, project_token } = await req.json();

    // Only email and code are required - project_token can be null for portal-level verification
    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: "email and code are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = String(email).toLowerCase();
    const token = project_token ?? null; // Explicitly allow null

    console.log(`🔐 Verifying OTP for ${normalizedEmail}, project_token: ${token ?? "null (portal-level)"}`);

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // First, find the most recent unverified verification record for this email + scope
    let findRecordQuery = supabase
      .from("email_verifications")
      .select("*")
      .eq("email", normalizedEmail)
      .is("verified_at", null)
      .order("created_at", { ascending: false })
      .limit(1);

    if (token) {
      findRecordQuery = findRecordQuery.eq("project_token", token);
    } else {
      findRecordQuery = findRecordQuery.is("project_token", null);
    }

    const { data: records, error: findRecordError } = await findRecordQuery;

    if (findRecordError || !records?.length) {
      console.log("No pending verification found:", findRecordError);
      return new Response(
        JSON.stringify({ error: "No pending verification found. Please request a new code." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const verification = records[0];

    // Check if expired
    if (new Date(verification.expires_at) < new Date()) {
      console.log(`⏰ Code expired for ${normalizedEmail}`);
      return new Response(
        JSON.stringify({ error: "Verification code has expired. Please request a new code." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check attempt count (brute-force protection)
    const currentAttempts = verification.attempt_count ?? 0;
    if (currentAttempts >= MAX_ATTEMPTS) {
      console.log(`🚫 Max attempts reached for ${normalizedEmail}: ${currentAttempts}/${MAX_ATTEMPTS}`);
      return new Response(
        JSON.stringify({ error: "Too many incorrect attempts. Please request a new code." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Hash the provided code
    const codeHash = await hashCode(code);

    // Check if the hash matches
    if (verification.code_hash !== codeHash) {
      // Increment attempt count
      const newAttempts = currentAttempts + 1;
      await supabase
        .from("email_verifications")
        .update({ attempt_count: newAttempts })
        .eq("id", verification.id);

      console.log(`❌ Wrong code for ${normalizedEmail} - attempt ${newAttempts}/${MAX_ATTEMPTS}`);
      
      const remaining = MAX_ATTEMPTS - newAttempts;
      return new Response(
        JSON.stringify({ 
          error: remaining > 0 
            ? `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
            : "Invalid code. Too many attempts. Please request a new code."
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ✅ Code matches! Mark as verified
    const { error: updateError } = await supabase
      .from("email_verifications")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", verification.id);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to verify code" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If there's a project_token, also set email_verified = true on the project
    if (token) {
      const { error: projectError } = await supabase
        .from("projects")
        .update({ email_verified: true })
        .eq("project_token", token);

      if (projectError) {
        console.error("Project update error:", projectError);
        // Don't fail the whole request, email is still verified
      }
    }

    // Clean up: delete all expired/used verification records for this email 
    // (keeps the table tidy, runs async in background)
    const cleanupOldRecords = async () => {
      try {
        // Delete expired records (older than 1 hour past expiry)
        const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        await supabase
          .from("email_verifications")
          .delete()
          .lt("expires_at", cutoff);
        
        console.log("🧹 Cleaned up old verification records");
      } catch (e) {
        console.error("Cleanup error (non-fatal):", e);
      }
    };
    
    // Fire and forget cleanup
    cleanupOldRecords();

    console.log(`✅ Email verified: ${normalizedEmail} (project: ${token ?? "portal-level"})`);

    return new Response(
      JSON.stringify({ ok: true, verified: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Verify code error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
