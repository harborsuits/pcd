import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    if (!email || !code || !project_token) {
      return new Response(
        JSON.stringify({ error: "email, code, and project_token are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Hash the provided code
    const codeHash = await hashCode(code);

    // Find matching verification record
    const { data: verification, error: findError } = await supabase
      .from("email_verifications")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("project_token", project_token)
      .eq("code_hash", codeHash)
      .is("verified_at", null)
      .single();

    if (findError || !verification) {
      console.log("Verification not found:", findError);
      return new Response(
        JSON.stringify({ error: "Invalid verification code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if expired
    if (new Date(verification.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Verification code has expired" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark as verified in email_verifications
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

    // CRITICAL: Also set email_verified = true on the project
    // This gates portal access independent of Supabase auth state
    const { error: projectError } = await supabase
      .from("projects")
      .update({ email_verified: true })
      .eq("project_token", project_token);

    if (projectError) {
      console.error("Project update error:", projectError);
      // Don't fail the whole request, email is still verified
    }

    console.log(`✅ Email verified: ${email} for project ${project_token}`);

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
