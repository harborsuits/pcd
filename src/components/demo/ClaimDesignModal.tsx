import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Check, ArrowRight, LayoutGrid } from "lucide-react";
import { portalSupabase } from "@/integrations/supabase/portalClient";
import type { User, Session } from "@supabase/supabase-js";

interface ClaimDesignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessName: string;
  projectToken: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export function ClaimDesignModal({ open, onOpenChange, businessName, projectToken }: ClaimDesignModalProps) {
  const navigate = useNavigate();
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  
  // Form state
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  
  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  
  // Flow state
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [portalToken, setPortalToken] = useState<string | null>(null);

  // Check auth on mount
  useEffect(() => {
    const { data: { subscription } } = portalSupabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthChecking(false);
    });

    portalSupabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // If user is logged in, try to claim automatically when modal opens
  useEffect(() => {
    if (open && user && session && !claimSuccess && !claiming) {
      claimWithAuth(session.access_token);
    }
  }, [open, user, session]);

  const claimWithAuth = async (accessToken: string) => {
    setClaiming(true);
    setError(null);
    
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/demo/claim-with-auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          project_token: projectToken,
          name: fullName || user?.user_metadata?.full_name || "",
        }),
      });

      const data = await res.json().catch(() => ({}));
      
      if (res.ok) {
        // Use the prospect's portal token (not the demo's token)
        setPortalToken(data.portal_token || projectToken);
        setClaimSuccess(true);
      } else {
        if (data.error === "Project already claimed") {
          setError("This design has already been claimed by another account.");
        } else {
          setError(data.error || "Something went wrong. Please try again.");
        }
      }
    } catch (err) {
      console.error("Claim error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setClaiming(false);
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
        // Auth state listener will update, then claim will auto-trigger
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      const { data, error: signUpError } = await portalSupabase.auth.signUp({
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

      if (!data.session) {
        setInfo("Check your email to confirm your account, then come back and log in to claim your design.");
        return;
      }

      // Session exists, claim will auto-trigger via useEffect
    } catch (err) {
      console.error("Signup error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPortal = () => {
    onOpenChange(false);
    // Navigate to the prospect's portal (not the demo's project)
    navigate(`/p/${portalToken || projectToken}`);
  };

  const handleGoToHub = () => {
    onOpenChange(false);
    navigate("/portal");
  };

  // Loading auth check
  if (authChecking) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Claim successful
  if (claimSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-xl font-serif font-bold text-foreground mb-2">It's Yours!</h3>
            <p className="text-muted-foreground mb-6">
              Your design for {businessName} is now linked to your account.
            </p>
            
            <div className="space-y-3">
              <Button onClick={handleOpenPortal} className="w-full group">
                Open Your Portal
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button onClick={handleGoToHub} variant="outline" className="w-full">
                <LayoutGrid className="mr-2 h-4 w-4" />
                Go to My Portals
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // If claiming in progress
  if (claiming) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
            <p className="text-muted-foreground">Claiming your design...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // User logged in but claim hasn't triggered (edge case) - show manual trigger
  if (user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif">Claim This Design</DialogTitle>
            <DialogDescription>
              You're signed in as {user.email}
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          
          <div className="pt-4 flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => session && claimWithAuth(session.access_token)} 
              className="flex-1"
              disabled={claiming}
            >
              {claiming ? "Claiming..." : "Claim for My Account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Not logged in - show login/signup form
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif">Claim This Design</DialogTitle>
          <DialogDescription>
            Create an account or log in to claim your design for {businessName}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={mode} onValueChange={(v) => { setMode(v as "login" | "signup"); setError(null); setInfo(null); }}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
            <TabsTrigger value="login">Log In</TabsTrigger>
          </TabsList>

          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="claim-name">Your Name</Label>
                <Input
                  id="claim-name"
                  placeholder="John Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="claim-email">Email</Label>
                <Input
                  id="claim-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="claim-password">Password</Label>
                <Input
                  id="claim-password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
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
                  "Create Account & Claim"
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
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
                  "Log In & Claim"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
