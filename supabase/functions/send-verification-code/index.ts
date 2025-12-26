import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate a 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Simple hash for the code (using Web Crypto API)
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
    const { email, project_token, business_name } = await req.json();

    if (!email || !project_token) {
      return new Response(
        JSON.stringify({ error: "email and project_token are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate code and hash
    const code = generateCode();
    const codeHash = await hashCode(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing unverified codes for this email/project
    await supabase
      .from("email_verifications")
      .delete()
      .eq("email", email.toLowerCase())
      .eq("project_token", project_token)
      .is("verified_at", null);

    // Insert new verification record
    const { error: insertError } = await supabase
      .from("email_verifications")
      .insert({
        email: email.toLowerCase(),
        code_hash: codeHash,
        expires_at: expiresAt.toISOString(),
        project_token,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create verification" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email via Resend
    const emailFrom = Deno.env.get("EMAIL_FROM") || "onboarding@resend.dev";
    const displayName = business_name || "Your Project";

    const { error: emailError } = await resend.emails.send({
      from: `${displayName} <${emailFrom}>`,
      to: [email],
      subject: `Your verification code: ${code}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #1a1a1a; font-size: 24px; margin: 0;">Verify your email</h1>
          </div>
          
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
            Enter this code to continue setting up your project portal:
          </p>
          
          <div style="background: #f5f5f5; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">${code}</span>
          </div>
          
          <p style="color: #888; font-size: 14px; line-height: 1.5;">
            This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.
          </p>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error("Email error:", emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send verification email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Verification code sent to ${email} for project ${project_token}`);

    return new Response(
      JSON.stringify({ ok: true, message: "Verification code sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Send verification code error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
