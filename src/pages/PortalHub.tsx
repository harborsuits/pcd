import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Lock, Mail, ArrowRight, ExternalLink, Sparkles, User as UserIcon, RefreshCw, Plus, Archive, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import type { User, Session } from "@supabase/supabase-js";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ClientLayout } from "@/components/portal/ClientLayout";
import { BrandCard, BrandCardHeader, BrandCardContent } from "@/components/portal/BrandCard";
import { FcGoogle } from "react-icons/fc";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface Portal {
  project_token: string;
  business_name: string;
  deleted_at?: string | null;
}

// Extract token from URL or raw token string
function extractToken(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  
  // Try to parse as URL
  try {
    const url = new URL(trimmed);
    // Match /p/:token or /d/:token/:slug
    const match = url.pathname.match(/\/(?:p|d)\/([a-zA-Z0-9\-_]+)/);
    if (match) return match[1];
  } catch {
    // Not a URL, check if it's a raw token
  }
  
  // Check if it's a valid token format (alphanumeric + hyphens, 12+ chars)
  if (/^[a-zA-Z0-9\-_]{12,128}$/.test(trimmed)) {
    return trimmed;
  }
  
  return null;
}

export default function PortalHub() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  
  const [portals, setPortals] = useState<Portal[]>([]);
  const [archivedPortals, setArchivedPortals] = useState<Portal[]>([]);
  const [loadingPortals, setLoadingPortals] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  
  const [linkInput, setLinkInput] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  
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

  // Check auth state on mount
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthChecking(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user's portals when logged in
  useEffect(() => {
    if (user && session?.access_token) {
      fetchMyPortals(session.access_token);
    }
  }, [user, session?.access_token]);

  const fetchMyPortals = async (accessToken: string) => {
    if (!accessToken) return;
    
    setLoadingPortals(true);
    try {
      // Fetch active projects
      const res = await fetch(`${SUPABASE_URL}/functions/v1/portal/my-projects`, {
        method: "GET",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${accessToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setPortals(data.projects || []);
      } else if (res.status === 401) {
        // Token expired or invalid - user needs to re-login
        console.log("Session expired, clearing state");
        setPortals([]);
        setArchivedPortals([]);
        return;
      }

      // Fetch archived projects
      const archivedRes = await fetch(`${SUPABASE_URL}/functions/v1/portal/my-projects?archived=true`, {
        method: "GET",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${accessToken}`,
        },
      });

      if (archivedRes.ok) {
        const archivedData = await archivedRes.json();
        setArchivedPortals(archivedData.projects || []);
      }
    } catch (err) {
      console.error("Failed to fetch portals:", err);
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

    const { error } = await supabase.auth.signInWithOAuth({
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
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
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
      const { data, error: signUpError } = await supabase.auth.signUp({
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
      const { error: checkError } = await supabase.auth.signInWithPassword({
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
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
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
      const { error: resendError } = await supabase.auth.resend({
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
    await supabase.auth.signOut();
    setPortals([]);
  };

  const handleOpenLink = (e: React.FormEvent) => {
    e.preventDefault();
    const token = extractToken(linkInput);
    if (token) {
      setLinkError(null);
      navigate(`/p/${token}`);
    } else {
      setLinkError("Please paste a valid portal link");
    }
  };

  // OTP verification screen - HIGHEST PRIORITY (before auth check)
  // This must come first so it doesn't get bypassed by auto-confirm sessions
  if (showOtpVerification) {
    return (
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
    );
  }


  // Logged in - show portals
  if (user) {
    return (
      <ClientLayout
        title="Your Portals"
        subtitle={`Logged in as ${user.email}`}
        maxWidth="2xl"
        rightSlot={
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Log out
          </Button>
        }
      >
        <div className="space-y-6">
          {/* Always show "Open from link" at top */}
          <BrandCard>
            <BrandCardHeader
              title="Open from a link"
              subtitle="Paste the link from your text message or email"
              icon={<ExternalLink className="h-5 w-5 text-accent" />}
            />
            <BrandCardContent>
              <form onSubmit={handleOpenLink} className="flex gap-2">
                <Input
                  placeholder="https://... or portal code"
                  value={linkInput}
                  onChange={(e) => {
                    setLinkInput(e.target.value);
                    setLinkError(null);
                  }}
                  className="flex-1"
                />
                <Button type="submit">Open</Button>
              </form>
              {linkError && (
                <p className="text-sm text-destructive mt-2">{linkError}</p>
              )}
            </BrandCardContent>
          </BrandCard>

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
            <div className="space-y-6">
              {/* Primary CTA - Start a new project */}
              <BrandCard variant="highlight" className="text-center py-10">
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-7 w-7 text-accent" />
                </div>
                <h3 className="font-serif text-xl font-bold mb-2">Start a new project</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                  Set up your website in about 5 minutes. We'll guide you through the process.
                </p>
                <Button asChild size="lg">
                  <Link to="/portal/new">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Get started
                  </Link>
                </Button>
              </BrandCard>

              <p className="text-center text-sm text-muted-foreground">
                Already have a demo link? Paste it above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Start new project button at top when user has portals */}
              <BrandCard variant="muted" className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Ready for another project?
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link to="/portal/new">
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
    );
  }

  // Not logged in - show login form
  return (
    <ClientLayout
      title="Client Portal"
      subtitle={mode === "login" ? "Log in to access your project portal" : "Create an account to get started"}
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
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
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
  );
}