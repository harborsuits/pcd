import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Lock, Mail, ArrowRight, Home, ExternalLink, Sparkles, User as UserIcon, RefreshCw, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import type { User, Session } from "@supabase/supabase-js";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface Portal {
  project_token: string;
  business_name: string;
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
  const [loadingPortals, setLoadingPortals] = useState(false);
  
  const [linkInput, setLinkInput] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  
  // OTP verification state
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const hasSentOtp = useRef(false);

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
    if (user && session) {
      fetchMyPortals();
    }
  }, [user, session]);

  const fetchMyPortals = async () => {
    if (!session?.access_token) return;
    
    setLoadingPortals(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/portal/my-projects`, {
        method: "GET",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setPortals(data.projects || []);
      }
    } catch (err) {
      console.error("Failed to fetch portals:", err);
    } finally {
      setLoadingPortals(false);
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

  // Send OTP code
  const sendOtpCode = async () => {
    if (!email) return;
    
    console.log("🔥 SENDING OTP", { email });
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
          email,
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
  
  // Verify OTP code
  const verifyOtpCode = async () => {
    if (otpCode.length !== 6) return;
    
    console.log("🔐 VERIFYING OTP", { email, code: otpCode });
    setOtpVerifying(true);
    setOtpError(null);
    
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email,
          code: otpCode,
          project_token: null, // No project token for portal-level verification
        }),
      });
      
      const result = await res.json();
      console.log("✅ OTP verify result:", result);
      
      if (!res.ok) {
        throw new Error(result.error || "Invalid code");
      }
      
      // Success! Hide OTP screen
      setShowOtpVerification(false);
      toast({ title: "Email verified!", description: "Welcome to your portal." });
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
  
  // Send OTP when verification screen mounts
  useEffect(() => {
    if (showOtpVerification && email && !hasSentOtp.current) {
      hasSentOtp.current = true;
      sendOtpCode();
    }
  }, [showOtpVerification, email]);
  
  // Auto-verify when 6 digits entered
  useEffect(() => {
    if (otpCode.length === 6 && showOtpVerification) {
      verifyOtpCode();
    }
  }, [otpCode, showOtpVerification]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/portal`,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setError("This email is already registered. Try logging in instead.");
          setMode("login");
        } else {
          setError(signUpError.message);
        }
        return;
      }

      console.log("✅ Signup succeeded, forcing OTP step");
      
      // ALWAYS go to OTP verification - NO CONDITIONS
      hasSentOtp.current = false; // Reset so sendOtpCode fires
      setShowOtpVerification(true);
      // DO NOT check data.session, DO NOT toast success yet
      
    } catch (err) {
      console.error("Signup error:", err);
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

  if (authChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // OTP verification screen - HARD GATE
  if (showOtpVerification) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <Link to="/" className="font-serif text-xl font-bold tracking-tight text-foreground">
              Pleasant Cove
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="font-serif text-2xl">Verify Your Email</CardTitle>
              <CardDescription>
                We sent a 6-digit code to <strong>{email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                    sendOtpCode();
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
                    hasSentOtp.current = false;
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  ← Back to signup
                </button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Logged in - show portals
  if (user) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <Link to="/" className="font-serif text-xl font-bold tracking-tight text-foreground">
              Pleasant Cove
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-6 py-12">
          <div className="max-w-2xl mx-auto">
            <h1 className="font-serif text-3xl font-bold mb-2">Your Portals</h1>
            <p className="text-muted-foreground mb-8">
              Logged in as {user.email}
            </p>

            {/* Always show "Open from link" at top */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Open from a link
                </CardTitle>
                <CardDescription>
                  Paste the link from your text message or email
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {loadingPortals ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-5 w-32" />
                </div>
                {[0, 1, 2].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6 flex items-center justify-between">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-9 w-28" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : portals.length === 0 ? (
              <div className="space-y-6">
                {/* Primary CTA - Start a new project */}
                <Card className="border-2 border-primary/20 bg-primary/5">
                  <CardContent className="py-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Plus className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-serif text-lg font-bold mb-2">Start a new project</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                      Set up your website in about 5 minutes. We'll guide you through the process.
                    </p>
                    <Button asChild size="lg">
                      <Link to="/portal/new">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Get started
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <div className="text-center text-sm text-muted-foreground">
                  Already have a demo link? Paste it above.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Start new project button at top when user has portals */}
                <Card className="border-dashed">
                  <CardContent className="py-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Ready for another project?
                    </p>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/portal/new">
                        <Plus className="mr-2 h-4 w-4" />
                        New project
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                {portals.map((portal) => (
                  <Card key={portal.project_token} className="hover:border-accent/50 transition-colors">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div>
                        <h3 className="font-serif text-lg font-bold">{portal.business_name}</h3>
                      </div>
                      <Button asChild variant="outline" size="sm" className="group">
                        <Link to={`/p/${portal.project_token}`}>
                          Open Portal
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Not logged in - show login form
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl font-bold tracking-tight text-foreground">
            Pleasant Cove
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="font-serif text-2xl">Client Portal</CardTitle>
            <CardDescription>
              {mode === "login" ? "Log in to access your project portal" : "Create an account to get started"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={mode} onValueChange={(v) => { setMode(v as "login" | "signup"); setError(null); setInfo(null); }}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Log In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
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
          </CardContent>
        </Card>
      </main>
    </div>
  );
}