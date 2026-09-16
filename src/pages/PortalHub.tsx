import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { portalSupabase } from "@/integrations/supabase/portalClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Lock, Mail, ArrowRight, Sparkles, User as UserIcon, RefreshCw, Plus, Archive, Trash2, ChevronDown, ChevronUp, Link2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ClientLayout } from "@/components/portal/ClientLayout";
import { BrandCard } from "@/components/portal/BrandCard";
import { FcGoogle } from "react-icons/fc";
import { TrustFooter } from "@/components/portal/TrustFooter";
import { SEOHead } from "@/components/SEOHead";
import { getAuthReturnPath } from "@/hooks/useSessionExpiry";
import { useAuthReady, hasOAuthTokensInUrl, hasOAuthError } from "@/hooks/useAuthReady";
import { AuthForm } from "@/components/auth/AuthForm";
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
  
  // Claim-by-token state
  const [claimToken, setClaimToken] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

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

  // Handle claiming a project by token or claim code
  const handleClaimByToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimToken.trim() || !session?.access_token) return;
    
    setClaimLoading(true);
    setClaimError(null);
    
    try {
      const inputValue = claimToken.trim().toUpperCase();
      
      // Detect if it's a claim code (PCD-XXXX-XXXX format) or project token
      const isClaimCode = /^PCD-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(inputValue);
      
      const endpoint = isClaimCode 
        ? `${SUPABASE_URL}/functions/v1/portal/claim-by-code`
        : `${SUPABASE_URL}/functions/v1/portal/claim-by-token`;
      
      const bodyKey = isClaimCode ? "claim_code" : "project_token";
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [bodyKey]: isClaimCode ? inputValue : claimToken.trim() }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setClaimError(data.error || "Failed to claim project");
        return;
      }
      
      if (data.already_owned) {
        toast({ title: "You already own this project" });
      } else if (data.claimed) {
        toast({ 
          title: "Project claimed!", 
          description: `"${data.project.business_name}" has been added to your projects.` 
        });
      }
      
      // Refresh the projects list
      setClaimToken("");
      fetchMyPortals(session.access_token);
      
    } catch (err) {
      console.error("Claim error:", err);
      setClaimError("Something went wrong. Please try again.");
    } finally {
      setClaimLoading(false);
    }
  };


  // Show loading while checking auth state - prevents flash of login form
  if (!hydrated) {
    return (
      <main className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  // Check for OAuth error in URL
  const oauthError = hasOAuthError();
  
  // Show OAuth loading state while processing callback
  // This prevents showing login form while OAuth tokens are being processed
  const isOAuthReturn = hasOAuthTokensInUrl();
  if (isOAuthReturn && !session) {
    return (
      <main className="h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Finishing sign-in...</p>
      </main>
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
          noindex
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


  // Password recovery - set new password UI
  if (isRecovery) {
    return (
      <>
        <SEOHead
          title="Reset Password | Client Portal"
          description="Set a new password for your client portal account."
          path="/portal"
          noindex
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
          noindex
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
            <div className="space-y-6">
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
              
              {/* Claim by token - empty state */}
              <BrandCard variant="muted" className="text-center">
                <h4 className="text-sm font-medium mb-2">Have a project code?</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  If you received a project code, enter it below to link the project to your account.
                </p>
                <form onSubmit={handleClaimByToken} className="flex gap-2 max-w-xs mx-auto">
                  <Input
                    placeholder="Enter project code"
                    value={claimToken}
                    onChange={(e) => { setClaimToken(e.target.value); setClaimError(null); }}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={claimLoading || !claimToken.trim()}>
                    {claimLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                  </Button>
                </form>
                {claimError && <p className="text-xs text-destructive mt-2">{claimError}</p>}
              </BrandCard>
            </div>
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
          
          {/* Claim by token - always visible when logged in with projects */}
          {portals.length > 0 && (
            <BrandCard variant="muted" className="mt-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex-1">
                  <h4 className="text-sm font-medium">Have a project code?</h4>
                  <p className="text-xs text-muted-foreground">Link an existing project to your account</p>
                </div>
                <form onSubmit={handleClaimByToken} className="flex gap-2 w-full sm:w-auto">
                  <Input
                    placeholder="Enter code"
                    value={claimToken}
                    onChange={(e) => { setClaimToken(e.target.value); setClaimError(null); }}
                    className="flex-1 sm:w-40"
                  />
                  <Button type="submit" size="sm" disabled={claimLoading || !claimToken.trim()}>
                    {claimLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Claim"}
                  </Button>
                </form>
              </div>
              {claimError && <p className="text-xs text-destructive mt-2">{claimError}</p>}
            </BrandCard>
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
          noindex
      />
      <ClientLayout
        title="Client Portal"
        subtitle={<span className="text-muted-foreground">For demos, onboarding, and active clients</span>}
        maxWidth="md"
        centered
      >
      <BrandCard className="w-full max-w-md mx-auto">
        <AuthForm
          defaultMode={mode}
          prefillEmail={email}
          prefillName={fullName}
          redirectTo={`${window.location.origin}/portal`}
          notice={
            showExistingAccountMessage ? (
              <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 text-sm text-accent-foreground">
                <p className="font-medium">
                  Welcome back{businessNameFromRedirect ? ` — ${businessNameFromRedirect}` : ""}!
                </p>
                <p className="text-muted-foreground mt-1">
                  Your email is filled in. Enter your password to continue.
                </p>
              </div>
            ) : null
          }
        />

        <p className="text-sm text-muted-foreground text-center mt-6">
          <Link to="/get-demo?service=demo" className="text-accent hover:underline">
            <Sparkles className="inline h-3 w-3 mr-1" />
            Get a free demo
          </Link>
        </p>
      </BrandCard>
      
      {/* Trust footer for logged-out users */}
      <TrustFooter className="mt-8" />
    </ClientLayout>
    </>
  );
}