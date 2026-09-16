import { useState, useEffect, useRef, useCallback } from "react";
import { portalSupabase } from "@/integrations/supabase/portalClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, Lock, Mail, User as UserIcon, RefreshCw } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { toast } from "@/hooks/use-toast";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export interface AuthSuccessContext {
  accessToken: string;
  name: string;
  isNewAccount: boolean;
}

interface AuthFormProps {
  /** Which tab opens first */
  defaultMode?: "login" | "signup";
  /** Where Google / email links come back to. Defaults to the portal hub. */
  redirectTo?: string;
  /** Project this sign-in belongs to, if any (used for the verification email) */
  projectToken?: string | null;
  /** Business name shown in the verification email */
  businessName?: string;
  prefillEmail?: string;
  prefillName?: string;
  /** Optional message shown above the login form */
  notice?: React.ReactNode;
  loginLabel?: string;
  signupLabel?: string;
  /**
   * Runs after a successful login or account creation.
   * Throw an Error to reject the sign-in — the user is signed back out
   * and the thrown message is shown.
   */
  onAuthSuccess?: (ctx: AuthSuccessContext) => Promise<void> | void;
}

/**
 * The single sign-in / sign-up form used everywhere a client signs in:
 * the portal hub, a project portal, and the demo claim dialogs.
 */
export function AuthForm({
  defaultMode = "login",
  redirectTo,
  projectToken = null,
  businessName = "Pleasant Cove Design",
  prefillEmail = "",
  prefillName = "",
  notice,
  loginLabel = "Log in",
  signupLabel = "Create account",
  onAuthSuccess,
}: AuthFormProps) {
  const returnTo = redirectTo || `${window.location.origin}/portal`;

  const [mode, setMode] = useState<"login" | "signup">(defaultMode);
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(prefillName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Email verification (signup)
  const [pendingSignup, setPendingSignup] = useState<{ email: string; password: string; fullName: string } | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const hasSentOtp = useRef(false);

  useEffect(() => {
    if (prefillEmail) setEmail(prefillEmail);
  }, [prefillEmail]);

  const resetMessages = () => {
    setError(null);
    setInfo(null);
  };

  const finish = async (accessToken: string, name: string, isNewAccount: boolean) => {
    if (!onAuthSuccess) return;
    try {
      await onAuthSuccess({ accessToken, name, isNewAccount });
    } catch (err) {
      await portalSupabase.auth.signOut();
      setError(err instanceof Error ? err.message : "We couldn't finish signing you in.");
    }
  };

  const handleGoogleSignIn = async () => {
    resetMessages();
    setLoading(true);
    const { error: oauthError } = await portalSupabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: returnTo },
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      const { data, error: loginError } = await portalSupabase.auth.signInWithPassword({ email, password });
      if (loginError) {
        setError(
          loginError.message.toLowerCase().includes("invalid login")
            ? "That email and password don't match. Try again, or use \"Forgot password?\"."
            : loginError.message
        );
        return;
      }
      if (data.session) {
        await finish(data.session.access_token, fullName || email.split("@")[0], false);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const sendOtpCode = useCallback(
    async (targetEmail: string) => {
      if (!targetEmail) return;
      setOtpSending(true);
      setOtpError(null);
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/send-verification-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
          body: JSON.stringify({
            email: targetEmail,
            project_token: projectToken,
            business_name: businessName,
          }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Failed to send verification code");
        setResendCountdown(60);
        toast({ title: "Code sent", description: "Check your email for the 6-digit code." });
      } catch (err) {
        console.error("OTP send error:", err);
        setOtpError(err instanceof Error ? err.message : "Failed to send code");
      } finally {
        setOtpSending(false);
      }
    },
    [projectToken, businessName]
  );

  const verifyOtpCode = useCallback(async () => {
    if (otpCode.length !== 6 || !pendingSignup) return;
    const { email: pendingEmail, password: pendingPassword, fullName: pendingName } = pendingSignup;

    setOtpVerifying(true);
    setOtpError(null);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({ email: pendingEmail, code: otpCode, project_token: projectToken }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "That code didn't work. Please try again.");

      const { data, error: signUpError } = await portalSupabase.auth.signUp({
        email: pendingEmail,
        password: pendingPassword,
        options: { data: { full_name: pendingName }, emailRedirectTo: returnTo },
      });

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes("already registered")) {
          setPendingSignup(null);
          setOtpCode("");
          setMode("login");
          setError("This email already has an account. Log in instead.");
          return;
        }
        throw new Error(signUpError.message);
      }

      setPendingSignup(null);
      setOtpCode("");
      toast({ title: "Account created", description: "You're all set." });

      const session = data.session ?? (await portalSupabase.auth.getSession()).data.session;
      if (session) {
        await finish(session.access_token, pendingName, true);
      }
    } catch (err) {
      console.error("OTP verify error:", err);
      setOtpError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setOtpVerifying(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpCode, pendingSignup, projectToken, returnTo]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  useEffect(() => {
    if (pendingSignup?.email && !hasSentOtp.current) {
      hasSentOtp.current = true;
      sendOtpCode(pendingSignup.email);
    }
  }, [pendingSignup?.email, sendOtpCode]);

  useEffect(() => {
    if (otpCode.length === 6 && pendingSignup) verifyOtpCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpCode]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!email || !password || !fullName) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    hasSentOtp.current = false;
    setPendingSignup({ email, password, fullName });
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Enter your email address first.");
      return;
    }
    resetMessages();
    setLoading(true);
    try {
      const { error: resetError } = await portalSupabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/portal`,
      });
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setInfo("Check your email for a password reset link.");
      setShowForgotPassword(false);
    } catch (err) {
      console.error("Reset error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const GoogleBlock = (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full mb-4 h-11 border-border bg-background hover:bg-muted"
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FcGoogle className="mr-2 h-5 w-5" />}
        Continue with Google
      </Button>
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">or continue with email</span>
        </div>
      </div>
    </>
  );

  // Email verification step
  if (pendingSignup) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="font-serif text-lg font-bold">Check your email</h3>
          <p className="text-sm text-muted-foreground mt-1">
            We sent a 6-digit code to <strong>{pendingSignup.email}</strong>
          </p>
        </div>

        <div className="flex justify-center">
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} disabled={otpVerifying}>
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        {otpError && <p className="text-sm text-destructive text-center">{otpError}</p>}

        {otpVerifying && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying...
          </div>
        )}

        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              hasSentOtp.current = false;
              sendOtpCode(pendingSignup.email);
            }}
            disabled={otpSending || resendCountdown > 0}
          >
            {otpSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : resendCountdown > 0 ? (
              `Resend in ${resendCountdown}s`
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Resend code
              </>
            )}
          </Button>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setPendingSignup(null);
              setOtpCode("");
              setOtpError(null);
              hasSentOtp.current = false;
            }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <Tabs
      value={mode}
      onValueChange={(v) => {
        setMode(v as "login" | "signup");
        resetMessages();
        setShowForgotPassword(false);
      }}
    >
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="login">Log In</TabsTrigger>
        <TabsTrigger value="signup">Sign Up</TabsTrigger>
      </TabsList>

      <TabsContent value="login">
        {GoogleBlock}

        {showForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="auth-reset-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="auth-reset-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {info && <p className="text-sm text-accent">{info}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send reset link"
              )}
            </Button>

            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false);
                resetMessages();
              }}
              className="text-sm text-muted-foreground hover:text-foreground w-full text-center"
            >
              Back to login
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            {notice}

            <div className="space-y-2">
              <Label htmlFor="auth-login-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="auth-login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="auth-login-password">Password</Label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true);
                    resetMessages();
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="auth-login-password"
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {info && <p className="text-sm text-accent">{info}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                loginLabel
              )}
            </Button>
          </form>
        )}
      </TabsContent>

      <TabsContent value="signup">
        {GoogleBlock}

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="auth-signup-name">Your name</Label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="auth-signup-name"
                type="text"
                placeholder="John Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-10"
                autoComplete="name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="auth-signup-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="auth-signup-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="auth-signup-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="auth-signup-password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {info && <p className="text-sm text-accent">{info}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              signupLabel
            )}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}
