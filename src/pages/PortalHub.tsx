import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { portalSupabase } from "@/integrations/supabase/portalClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Lock, Mail, ArrowRight, Sparkles, User as UserIcon, RefreshCw, Plus, Archive, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ClientLayout } from "@/components/portal/ClientLayout";
import { BrandCard } from "@/components/portal/BrandCard";
import { FcGoogle } from "react-icons/fc";
import { SEOHead } from "@/components/SEOHead";
import { getAuthReturnPath } from "@/hooks/useSessionExpiry";
import { useAuthReady, hasOAuthTokensInUrl, hasOAuthError } from "@/hooks/useAuthReady";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface Portal {
  project_token: string;
  business_name: string;
  deleted_at?: string | null;
}


export default function PortalHub() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Use shared auth hook for consistent session handling
  const { hydrated, session } = useAuthReady();
  const user = session?.user ?? null;
  
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const [portals, setPortals] = useState<Portal[]>([]);
  const [archivedPortals, setArchivedPortals] = useState<Portal[]>([]);
  const [loadingPortals, setLoadingPortals] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Track if user was redirected from create-password (existing account)
  const [showExistingAccountMessage, setShowExistingAccountMessage] = useState(false);
  const [businessNameFromRedirect, setBusinessNameFromRedirect] = useState("");
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  
  // Password recovery (reset) flow state
  const [isRecovery, setIsRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  // Handle prefilled params from /start page or /create-password redirect
  useEffect(() => {
    const prefillEmail = searchParams.get("email");
    const prefillName = searchParams.get("name");
    const tab = searchParams.get("tab");
    const fromCreatePassword = searchParams.get("existing") === "true";
    const businessParam = searchParams.get("business");
    
    if (prefillEmail) setEmail(prefillEmail);
    if (prefillName) setFullName(prefillName);
    if (tab === "signup") setMode("signup");
    if (businessParam) setBusinessNameFromRedirect(decodeURIComponent(businessParam));
    
    // If redirected from create-password because account exists, show message and auto-focus password
    if (fromCreatePassword && prefillEmail) {
      setShowExistingAccountMessage(true);
      setMode("login");
      // Auto-focus password input after render (email is already pre-filled)
      setTimeout(() => passwordInputRef.current?.focus(), 100);
    }
  }, [searchParams]);
  
  
  // OTP verification state (email verified BEFORE account creation)
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const hasSentOtp = useRef(false);
  
  // Pending signup data (stored until email is verified)
  const [pendingSignup, setPendingSignup] = useState<{
    email: string;
    password: string;
    fullName: string;
  } | null>(null);

  // Handle PASSWORD_RECOVERY event + redirect logic
  useEffect(() => {
    const { data: { subscription } } = portalSupabase.auth.onAuthStateChange((event, currentSession) => {
      // Handle password recovery event
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
        setMode("login");
      }
      
      // On successful sign in, check if we need to redirect back to a stored path
      if (event === "SIGNED_IN" && currentSession && !isRecovery) {
        const returnPath = getAuthReturnPath();
        if (returnPath && returnPath !== "/portal") {
          navigate(returnPath, { replace: true });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, isRecovery]);
  
  // Handle setting new password after recovery
  const handleSetNewPassword = async () => {
    setRecoveryError(null);

    if (newPassword.length < 8) {
      setRecoveryError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== newPassword2) {
      setRecoveryError("Passwords do not match.");
      return;
    }

    setRecoveryLoading(true);
    try {
      const { error } = await portalSupabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setIsRecovery(false);
      setNewPassword("");
      setNewPassword2("");
      toast({
        title: "Password updated!",
        description: "You're now logged in.",
      });
      // User is now authenticated, portal list will load
    } catch (e: any) {
      setRecoveryError(e?.message ?? "Could not update password.");
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Claim orphaned projects and fetch user's portals when logged in
  useEffect(() => {
    if (user && session?.access_token) {
      // First, try to claim any orphaned projects for this email
      claimOrphanedProjects(session.access_token).then(() => {
        // Then fetch all projects (including newly claimed ones)
        // Always show the projects list - no auto-redirect to single project
        fetchMyPortals(session.access_token);
      });
    }
  }, [user, session?.access_token]);

  // Claim orphaned projects that match user's email
  const claimOrphanedProjects = async (accessToken: string): Promise<void> => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/portal/claim-projects`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.claimed > 0) {
          console.log(`Auto-claimed ${data.claimed} project(s)`);
          toast({
            title: "Projects found!",
            description: `We found ${data.claimed} project${data.claimed > 1 ? 's' : ''} linked to your email.`,
          });
        }
      }
    } catch (err) {
      console.error("Failed to claim projects:", err);
      // Non-fatal, continue with fetch
    }
  };

  const fetchMyPortals = async (accessToken: string): Promise<Portal[]> => {
    if (!accessToken) return [];
    
    // Verify session is still valid before fetching
    const { data: { session: currentSession } } = await portalSupabase.auth.getSession();
    if (!currentSession) {
      console.log("No active session, skipping fetch");
      return [];
    }
    
    setLoadingPortals(true);
    try {
      // Fetch active and archived projects in parallel
      const [res, archivedRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/functions/v1/portal/my-projects`, {
          method: "GET",
          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${accessToken}`,
          },
        }),
        fetch(`${SUPABASE_URL}/functions/v1/portal/my-projects?archived=true`, {
          method: "GET",
          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${accessToken}`,
          },
        }),
      ]);

      if (res.status === 401 || archivedRes.status === 401) {
        // Token expired or invalid - clear state silently
        console.log("Session expired, clearing state");
        setPortals([]);
        setArchivedPortals([]);
        return [];
      }

      let activeProjects: Portal[] = [];
      if (res.ok) {
        const data = await res.json();
        activeProjects = data.projects || [];
        setPortals(activeProjects);
      }

      if (archivedRes.ok) {
        const archivedData = await archivedRes.json();
        setArchivedPortals(archivedData.projects || []);
      }
      
      return activeProjects;
    } catch (err) {
      console.error("Failed to fetch portals:", err);
      return [];
    } finally {
      setLoadingPortals(false);
    }
  };

  const handleDeleteProject = async (token: string, name: string) => {
    if (!confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
    
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/portal/${token}/delete`, {
        method: "DELETE",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${session?.access_token}`,
        },
      });
      
      if (res.ok) {
        setArchivedPortals(prev => prev.filter(p => p.project_token !== token));
        toast({ title: "Project deleted permanently" });
      } else {
        toast({ title: "Failed to delete", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const handleRestoreProject = async (token: string) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/portal/${token}/restore`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${session?.access_token}`,
        },
      });
      
      if (res.ok) {
        // Move from archived to active
        const restored = archivedPortals.find(p => p.project_token === token);
        if (restored) {
          setArchivedPortals(prev => prev.filter(p => p.project_token !== token));
          setPortals(prev => [...prev, { ...restored, deleted_at: null }]);
          toast({ title: "Project restored" });
        }
      } else {
        toast({ title: "Failed to restore", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to restore", variant: "destructive" });
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setInfo(null);
    setLoading(true);

    const { error } = await portalSupabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/portal`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      const { data, error: loginError } = await portalSupabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError(loginError.message);
        return;
      }

      if (data.session) {
        toast({
          title: "Welcome back!",
          description: "Loading your portals...",
        });
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Send OTP code (uses pendingSignup email if available, otherwise current email)
  const sendOtpCode = async (targetEmail?: string) => {
    const emailToVerify = targetEmail || pendingSignup?.email || email;
    if (!emailToVerify) return;
    
    console.log("🔥 SENDING OTP", { email: emailToVerify });
    setOtpSending(true);
    setOtpError(null);
    
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-verification-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: emailToVerify,
          project_token: null, // No project token for portal-level verification
          business_name: "Pleasant Cove Portal",
        }),
      });
      
      const result = await res.json();
      console.log("📧 OTP send result:", result);
      
      if (!res.ok) {
        throw new Error(result.error || "Failed to send verification code");
      }
      
      setResendCountdown(60);
      toast({ title: "Code sent!", description: "Check your email for the verification code." });
    } catch (err) {
      console.error("OTP send error:", err);
      setOtpError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setOtpSending(false);
    }
  };
  
  // Verify OTP code and then create account
  const verifyOtpCode = async () => {
    if (otpCode.length !== 6 || !pendingSignup) return;
    
    const { email: pendingEmail, password, fullName } = pendingSignup;
    console.log("🔐 VERIFYING OTP", { email: pendingEmail, code: otpCode });
    setOtpVerifying(true);
    setOtpError(null);
    
    try {
      // Step 1: Verify the OTP code
      const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: pendingEmail,
          code: otpCode,
          project_token: null, // No project token for portal-level verification
        }),
      });
      
      const result = await res.json();
      console.log("✅ OTP verify result:", result);
      
      if (!res.ok) {
        throw new Error(result.error || "Invalid code");
      }
      
      // Step 2: OTP verified - NOW create the account
      console.log("📝 Creating account after email verification...");
      const { data, error: signUpError } = await portalSupabase.auth.signUp({
        email: pendingEmail,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/portal`,
        },
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      // Success! Clear pending and hide OTP screen
      setPendingSignup(null);
      setShowOtpVerification(false);
      setOtpCode("");
      toast({ title: "Account created!", description: "Welcome to your portal." });
      
    } catch (err) {
      console.error("OTP verify error:", err);
      setOtpError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setOtpVerifying(false);
    }
  };
  
  // Resend countdown
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);
  
  // Send OTP when verification screen mounts (uses pendingSignup email)
  useEffect(() => {
    if (showOtpVerification && pendingSignup?.email && !hasSentOtp.current) {
      hasSentOtp.current = true;
      sendOtpCode(pendingSignup.email);
    }
  }, [showOtpVerification, pendingSignup?.email]);
  
  // Auto-verify when 6 digits entered
  useEffect(() => {
    if (otpCode.length === 6 && showOtpVerification) {
      verifyOtpCode();
    }
  }, [otpCode, showOtpVerification]);

  // Signup: DON'T create account yet, just store data and send OTP
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      // Validate inputs before proceeding
      if (!email || !password || !fullName) {
        setError("Please fill in all fields");
        return;
      }
      
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }

      // Check if email is already registered (try to sign in - will fail if not registered)
      const { error: checkError } = await portalSupabase.auth.signInWithPassword({
        email,
        password: "dummy-check-password-that-wont-work",
      });
      
      // If the error is NOT "Invalid login credentials", the email might already exist
      // But this check isn't perfect, so we'll let the final signup handle duplicates
      
      console.log("📧 Storing pending signup, will verify email first...");
      
      // Store the signup data - we'll create the account AFTER email verification
      setPendingSignup({ email, password, fullName });
      hasSentOtp.current = false; // Reset so sendOtpCode fires
      setShowOtpVerification(true);
      
    } catch (err) {
      console.error("Signup prep error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    
    setError(null);
    setInfo(null);
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

  const handleResendConfirmation = async () => {
    if (!email) {
      setError("Enter your email first, then click resend.");
      return;
    }

    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      const { error: resendError } = await portalSupabase.auth.resend({
        type: "signup",
        email,
      });

      if (resendError) {
        setError(resendError.message);
        return;
      }

      setInfo("Confirmation email sent. Check your inbox (and spam).");
      toast({
        title: "Email sent",
        description: "Check your inbox (and spam) for the confirmation link.",
      });
    } catch (err) {
      console.error("Resend confirmation error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await portalSupabase.auth.signOut();
      // Clear local state (session will be cleared by useAuthReady)
      setPortals([]);
      setArchivedPortals([]);
    } catch (err) {
      console.error("[PortalHub] Logout error:", err);
    }
  };


  // Show loading while checking auth state - prevents flash of login form
  if (!hydrated) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Check for OAuth error in URL
  const oauthError = hasOAuthError();
  
  // Show OAuth loading state while processing callback
  // This prevents showing login form while OAuth tokens are being processed
  const isOAuthReturn = hasOAuthTokensInUrl();
  if (isOAuthReturn && !session) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Finishing sign-in...</p>
      </div>
    );
  }

  // Show OAuth error message if present
  if (oauthError && !session) {
    return (
      <>
        <SEOHead
          title="Client Portal | Pleasant Cove Design"
          description="Start a demo, set up your project, or access your active work — all in one place."
          path="/portal"
        />
        <ClientLayout
          title="Sign In Failed"
          subtitle="There was a problem signing you in"
          maxWidth="md"
          centered
        >
          <BrandCard className="w-full max-w-md mx-auto">
            <div className="text-center space-y-4">
              <p className="text-destructive">{oauthError.description}</p>
              <Button onClick={() => window.location.href = '/portal'}>
                Try Again
              </Button>
            </div>
          </BrandCard>
        </ClientLayout>
      </>
    );
  }

  // OTP verification screen - HIGHEST PRIORITY (before auth check)
  // This must come first so it doesn't get bypassed by auto-confirm sessions
  if (showOtpVerification) {
    return (
      <>
        <SEOHead
          title="Client Portal | Pleasant Cove Design"
          description="Start a demo, set up your project, or access your active work — all in one place."
          path="/portal"
        />
        <ClientLayout
          title="Verify Your Email"
          subtitle={<>We sent a 6-digit code to <strong>{pendingSignup?.email || email}</strong></>}
          maxWidth="md"
          centered
        >
        <BrandCard className="w-full max-w-md mx-auto">
          <div className="space-y-6">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={setOtpCode}
                disabled={otpVerifying}
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

            {otpError && (
              <p className="text-sm text-destructive text-center">{otpError}</p>
            )}

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
                  sendOtpCode(pendingSignup?.email);
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
                  setShowOtpVerification(false);
                  setOtpCode("");
                  setOtpError(null);
                  setPendingSignup(null);
                  hasSentOtp.current = false;
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back to signup
              </button>
            </div>
          </div>
        </BrandCard>
      </ClientLayout>
      </>
    );
  }

  // Password recovery - set new password UI
  if (isRecovery) {
    return (
      <>
        <SEOHead
          title="Reset Password | Client Portal"
          description="Set a new password for your client portal account."
          path="/portal"
        />
        <ClientLayout
          title="Set New Password"
          subtitle="Enter your new password below"
          maxWidth="md"
          centered
        >
          <BrandCard className="w-full max-w-md mx-auto">
            <form onSubmit={(e) => { e.preventDefault(); handleSetNewPassword(); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-new-password"
                    type="password"
                    placeholder="Re-enter your password"
                    value={newPassword2}
                    onChange={(e) => setNewPassword2(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {recoveryError && (
                <p className="text-sm text-destructive">{recoveryError}</p>
              )}

              <Button type="submit" className="w-full" disabled={recoveryLoading}>
                {recoveryLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </BrandCard>
        </ClientLayout>
      </>
    );
  }


  // Logged in - show portals
  if (user) {
    return (
      <>
        <SEOHead
          title="Client Portal"
          description="Log in to your client portal to track projects, send messages, and share files with Pleasant Cove Design."
          path="/portal"
        />
        <ClientLayout
          title="Your Projects"
          subtitle={<span className="text-muted-foreground">Logged in as {user.email}</span>}
          maxWidth="2xl"
          rightSlot={
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Log out
            </Button>
          }
        >
        <div className="space-y-6">
          {loadingPortals ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <BrandCard key={i}>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-9 w-28" />
                  </div>
                </BrandCard>
              ))}
            </div>
          ) : portals.length === 0 ? (
            <BrandCard variant="highlight" className="text-center py-10">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-7 w-7 text-accent" />
              </div>
              <h3 className="font-serif text-xl font-bold mb-2">No projects yet</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                Fill out our quick intake form to get started with your project.
              </p>
              <Button asChild size="lg">
                <Link to="/get-demo">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Start your project
                </Link>
              </Button>
            </BrandCard>
          ) : (
            <div className="space-y-4">
              {/* Start new project button at top when user has portals */}
              <BrandCard variant="muted" className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Ready for another project?
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link to="/get-demo">
                    <Plus className="mr-2 h-4 w-4" />
                    New project
                  </Link>
                </Button>
              </BrandCard>

              {portals.map((portal) => (
                <BrandCard key={portal.project_token} className="flex items-center justify-between hover:border-accent/50 transition-colors">
                  <h3 className="font-serif text-lg font-bold">{portal.business_name}</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (!confirm(`Archive "${portal.business_name}"? You can restore it later.`)) return;
                        try {
                          const res = await fetch(`${SUPABASE_URL}/functions/v1/portal/${portal.project_token}/archive`, {
                            method: "POST",
                            headers: {
                              "apikey": SUPABASE_ANON_KEY,
                              "Authorization": `Bearer ${session?.access_token}`,
                            },
                          });
                          if (res.ok) {
                            // Move to archived list
                            setPortals(prev => prev.filter(p => p.project_token !== portal.project_token));
                            setArchivedPortals(prev => [...prev, { ...portal, deleted_at: new Date().toISOString() }]);
                            toast({ title: "Project archived" });
                          } else {
                            toast({ title: "Failed to archive", variant: "destructive" });
                          }
                        } catch {
                          toast({ title: "Failed to archive", variant: "destructive" });
                        }
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button asChild variant="outline" size="sm" className="group">
                      <Link to={`/p/${portal.project_token}`}>
                        Open Portal
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                </BrandCard>
              ))}

              {/* Archived section */}
              {archivedPortals.length > 0 && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowArchived(!showArchived)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3"
                  >
                    {showArchived ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    Archived ({archivedPortals.length})
                  </button>

                  {showArchived && (
                    <div className="space-y-3">
                      {archivedPortals.map((portal) => (
                        <BrandCard key={portal.project_token} variant="muted" className="flex items-center justify-between opacity-75">
                          <h3 className="font-serif text-base text-muted-foreground">{portal.business_name}</h3>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRestoreProject(portal.project_token)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProject(portal.project_token, portal.business_name)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </BrandCard>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </ClientLayout>
      </>
    );
  }

  // Not logged in - show login form
  return (
    <>
      <SEOHead
        title="Client Portal | Pleasant Cove Design"
        description="Start a demo, set up your project, or access your active work — all in one place."
        path="/portal"
      />
      <ClientLayout
        title="Client Portal"
        subtitle={<span className="text-muted-foreground">For demos, onboarding, and active clients</span>}
        maxWidth="md"
        centered
      >
      <BrandCard className="w-full max-w-md mx-auto">
        <Tabs value={mode} onValueChange={(v) => { setMode(v as "login" | "signup"); setError(null); setInfo(null); }}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Log In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            {/* Google Sign-In */}
            <Button
              type="button"
              variant="outline"
              className="w-full mb-4 h-11 border-border bg-background hover:bg-muted"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FcGoogle className="mr-2 h-5 w-5" />
              )}
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or continue with email</span>
              </div>
            </div>

            {showForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
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
                    "Send Reset Link"
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(false); setError(null); setInfo(null); }}
                  className="text-sm text-muted-foreground hover:text-foreground w-full text-center"
                >
                  Back to login
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Message when redirected from create-password */}
                {showExistingAccountMessage && (
                  <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 text-sm text-accent-foreground mb-4">
                    <p className="font-medium">
                      Welcome back{businessNameFromRedirect ? ` — ${businessNameFromRedirect}` : ""}!
                    </p>
                    <p className="text-muted-foreground mt-1">
                      Your email is pre-filled. Enter your password to continue.
                    </p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      ref={emailInputRef}
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setShowExistingAccountMessage(false); }}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <button
                      type="button"
                      onClick={() => { setShowForgotPassword(true); setError(null); setInfo(null); }}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      ref={passwordInputRef}
                      type="password"
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                      Logging in...
                    </>
                  ) : (
                    "Log In"
                  )}
                </Button>

                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  className="text-sm text-muted-foreground hover:text-foreground text-center w-full"
                  disabled={loading}
                >
                  Resend confirmation email
                </button>
              </form>
            )}
          </TabsContent>

          <TabsContent value="signup">
            {/* Google Sign-In */}
            <Button
              type="button"
              variant="outline"
              className="w-full mb-4 h-11 border-border bg-background hover:bg-muted"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FcGoogle className="mr-2 h-5 w-5" />
              )}
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
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
                  "Create Account"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="text-sm text-muted-foreground text-center mt-6">
          <Link to="/get-demo" className="text-accent hover:underline">
            <Sparkles className="inline h-3 w-3 mr-1" />
            Get a free demo
          </Link>
        </p>
      </BrandCard>
    </ClientLayout>
    </>
  );
}