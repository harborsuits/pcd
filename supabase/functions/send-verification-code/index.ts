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

// Proper HMAC-SHA256 for verification code hashing
async function hashCode(code: string): Promise<string> {
  const secret = Deno.env.get("EMAIL_VERIFICATION_SECRET");
  if (!secret) {
    throw new Error("EMAIL_VERIFICATION_SECRET not configured");
  }
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  
  // Import the secret as an HMAC key
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  // Sign the code with HMAC-SHA256
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(code)
  );
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Rate limit constants
const COOLDOWN_MS = 60_000; // 60 seconds between sends
const MAX_PER_EMAIL_PER_HOUR = 5;
const MAX_PER_IP_PER_HOUR = 20;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, project_token, business_name } = await req.json();

    // Only email is required - project_token can be null for portal-level verification
    if (!email) {
      return new Response(
        JSON.stringify({ error: "email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = String(email).toLowerCase();
    const token = project_token ?? null; // Explicitly allow null
    
    // Get client IP for rate limiting (check common headers)
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
      || req.headers.get("x-real-ip") 
      || req.headers.get("cf-connecting-ip")
      || "unknown";

    console.log(`📧 OTP request from IP ${clientIp} for ${normalizedEmail}, project: ${token ?? "portal-level"}`);

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ============ RATE LIMITING ============
    
    // Build query for rate limit checks - handle null vs non-null project_token
    const baseRateLimitQuery = () => {
      let q = supabase
        .from("email_verifications")
        .select("created_at")
        .eq("email", normalizedEmail);
      
      if (token) {
        q = q.eq("project_token", token);
      } else {
        q = q.is("project_token", null);
      }
      return q;
    };

    // Check 60-second cooldown (per email)
    const { data: recent } = await baseRateLimitQuery()
      .is("verified_at", null)
      .order("created_at", { ascending: false })
      .limit(1);

    if (recent?.length) {
      const ageMs = Date.now() - new Date(recent[0].created_at).getTime();
      if (ageMs < COOLDOWN_MS) {
        const waitSeconds = Math.ceil((COOLDOWN_MS - ageMs) / 1000);
        console.log(`⏱️ Cooldown: ${normalizedEmail} must wait ${waitSeconds}s`);
        return new Response(
          // Generic message - don't confirm email exists
          JSON.stringify({ error: `Please wait ${waitSeconds} seconds before requesting another code.` }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // Check per-email hourly limit
    let emailCountQuery = supabase
      .from("email_verifications")
      .select("id", { count: "exact", head: true })
      .eq("email", normalizedEmail)
      .gte("created_at", oneHourAgo);
    
    if (token) {
      emailCountQuery = emailCountQuery.eq("project_token", token);
    } else {
      emailCountQuery = emailCountQuery.is("project_token", null);
    }
    
    const { count: emailHourlyCount } = await emailCountQuery;

    if ((emailHourlyCount ?? 0) >= MAX_PER_EMAIL_PER_HOUR) {
      console.log(`⏱️ Email hourly limit: ${normalizedEmail} has ${emailHourlyCount} attempts`);
      return new Response(
        // Generic message
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check per-IP hourly limit (prevents bot farms)
    if (clientIp !== "unknown") {
      const { count: ipHourlyCount } = await supabase
        .from("email_verifications")
        .select("id", { count: "exact", head: true })
        .eq("requester_ip", clientIp)
        .gte("created_at", oneHourAgo);

      if ((ipHourlyCount ?? 0) >= MAX_PER_IP_PER_HOUR) {
        console.log(`⏱️ IP hourly limit: ${clientIp} has ${ipHourlyCount} attempts`);
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ============ END RATE LIMITING ============

    // Generate code and hash
    const code = generateCode();
    const codeHash = await hashCode(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing unverified codes for this email + scope (portal-level OR project-level)
    let deleteQuery = supabase
      .from("email_verifications")
      .delete()
      .eq("email", normalizedEmail)
      .is("verified_at", null);

    // Handle null vs non-null project_token correctly
    if (token) {
      deleteQuery = deleteQuery.eq("project_token", token);
    } else {
      deleteQuery = deleteQuery.is("project_token", null);
    }

    const { error: deleteError } = await deleteQuery;
    if (deleteError) {
      console.log("Delete prior codes warning:", deleteError);
      // Continue anyway
    }

    // Insert new verification record
    const { error: insertError } = await supabase
      .from("email_verifications")
      .insert({
        email: normalizedEmail,
        code_hash: codeHash,
        expires_at: expiresAt.toISOString(),
        project_token: token, // null is allowed
        requester_ip: clientIp, // for IP rate limiting
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create verification" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email via Resend using verified domain
    const emailFrom = Deno.env.get("EMAIL_FROM") || "Pleasant Cove <no-reply@pleasantcovedesign.com>";
    const displayName = business_name || "Pleasant Cove";

    // Debug logging
    console.log("🔑 HAS RESEND KEY:", Boolean(Deno.env.get("RESEND_API_KEY")));
    console.log(`📨 Attempting to send email via Resend`, { from: emailFrom, to: normalizedEmail });

    const emailResult = await resend.emails.send({
      from: emailFrom, // EMAIL_FROM already includes display name
      to: [normalizedEmail],
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
            Enter this code to continue:
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

    console.log("📨 Resend result:", JSON.stringify(emailResult));

    if (emailResult.error) {
      console.error("Email error:", emailResult.error);
      return new Response(
        JSON.stringify({ error: "Failed to send verification email", details: emailResult.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Verification code sent to ${normalizedEmail} (project: ${token ?? "portal-level"})`);

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
