import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, Mail, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface EmailVerificationProps {
  email: string;
  projectToken: string;
  businessName: string;
  onVerified: () => void;
  onBack: () => void;
}

export function EmailVerification({ 
  email, 
  projectToken, 
  businessName, 
  onVerified,
  onBack 
}: EmailVerificationProps) {
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const hasSentInitial = useRef(false);

  // Send verification code on mount - guard until all values exist
  useEffect(() => {
    if (!email || !projectToken) return;
    if (hasSentInitial.current) return;
    
    hasSentInitial.current = true;
    sendCode();
  }, [email, projectToken]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Auto-verify when 6 digits entered
  useEffect(() => {
    if (code.length === 6) {
      verifyCode();
    }
  }, [code]);

  const sendCode = async () => {
    console.log("🔥 SENDING OTP", { email, projectToken, businessName });
    setSending(true);
    setError(null);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-verification-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email,
          project_token: projectToken,
          business_name: businessName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send code");
      }

      setSent(true);
      setResendCountdown(60); // 60 second cooldown
      toast({
        title: "Code sent!",
        description: `Check ${email} for your verification code.`,
      });
    } catch (err: any) {
      console.error("Send code error:", err);
      setError(err.message || "Failed to send verification code");
    } finally {
      setSending(false);
    }
  };

  const verifyCode = async () => {
    if (code.length !== 6) return;

    setVerifying(true);
    setError(null);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email,
          code,
          project_token: projectToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid code");
      }

      toast({
        title: "Email verified!",
        description: "You can now continue to the portal.",
      });
      onVerified();
    } catch (err: any) {
      console.error("Verify code error:", err);
      setError(err.message || "Verification failed");
      setCode(""); // Clear for retry
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header - matches homepage */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl font-bold tracking-tight text-foreground">
            Pleasant Cove
          </Link>
        </div>
      </header>

      {/* Hero section with branding */}
      <div className="bg-gradient-to-b from-accent/5 to-background border-b border-border">
        <div className="container mx-auto px-6 py-8 text-center">
          <p className="text-sm text-accent font-medium uppercase tracking-wide mb-2">Email Verification</p>
          <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            {businessName}
          </h1>
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-card rounded-xl border border-border shadow-sm">
          <div className="p-6 border-b border-border text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
              <Mail className="h-6 w-6 text-accent" />
            </div>
            <h2 className="font-serif text-xl font-bold text-foreground">Verify your email</h2>
            <p className="text-sm text-muted-foreground mt-1">
              We sent a 6-digit code to <strong>{email}</strong>
            </p>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={(value) => setCode(value)}
                disabled={verifying}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            {verifying && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Verifying...</span>
              </div>
            )}

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={sendCode}
                disabled={sending || resendCountdown > 0}
              >
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : resendCountdown > 0 ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend in {resendCountdown}s
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend code
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                className="w-full"
                onClick={onBack}
              >
                Use a different email
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Didn't receive the email? Check your spam folder or try resending.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
