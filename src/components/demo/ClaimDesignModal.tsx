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
import { Loader2, Check, ArrowRight, LayoutGrid } from "lucide-react";
import { portalSupabase } from "@/integrations/supabase/portalClient";
import type { User, Session } from "@supabase/supabase-js";
import { AuthForm, AuthSuccessContext } from "@/components/auth/AuthForm";

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

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [portalToken, setPortalToken] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = portalSupabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setAuthChecking(false);
    });

    portalSupabase.auth.getSession().then(({ data: { session: current } }) => {
      setSession(current);
      setUser(current?.user ?? null);
      setAuthChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Already signed in — claim as soon as the dialog opens
  useEffect(() => {
    if (open && user && session && !claimSuccess && !claiming) {
      claimWithAuth(session.access_token, (user.user_metadata?.full_name as string) || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user, session]);

  const claimWithAuth = async (accessToken: string, name: string) => {
    setClaiming(true);
    setError(null);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/demo/claim-with-auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ project_token: projectToken, name }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setPortalToken(data.portal_token || projectToken);
        setClaimSuccess(true);
        return;
      }

      const message =
        data.error === "Project already claimed"
          ? "This design has already been claimed by another account."
          : data.error || "Something went wrong. Please try again.";
      setError(message);
      throw new Error(message);
    } finally {
      setClaiming(false);
    }
  };

  const handleAuthSuccess = async ({ accessToken, name }: AuthSuccessContext) => {
    await claimWithAuth(accessToken, name);
  };

  const handleOpenPortal = () => {
    onOpenChange(false);
    navigate(`/p/${portalToken || projectToken}`);
  };

  const handleGoToHub = () => {
    onOpenChange(false);
    navigate("/portal");
  };

  if (authChecking) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="sr-only">
            <DialogTitle>Claim this design</DialogTitle>
          </DialogHeader>
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (claimSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="sr-only">
            <DialogTitle>Design claimed</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-xl font-serif font-bold text-foreground mb-2">It's yours!</h3>
            <p className="text-muted-foreground mb-6">
              Your design for {businessName} is now linked to your account.
            </p>

            <div className="space-y-3">
              <Button onClick={handleOpenPortal} className="w-full group">
                Open your portal
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button onClick={handleGoToHub} variant="outline" className="w-full">
                <LayoutGrid className="mr-2 h-4 w-4" />
                Go to my projects
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (claiming) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="sr-only">
            <DialogTitle>Claiming your design</DialogTitle>
          </DialogHeader>
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
            <p className="text-muted-foreground">Claiming your design...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Signed in but the claim didn't fire (or failed) — offer a manual retry
  if (user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif">Claim this design</DialogTitle>
            <DialogDescription>You're signed in as {user.email}</DialogDescription>
          </DialogHeader>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="pt-4 flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() =>
                session &&
                claimWithAuth(session.access_token, (user.user_metadata?.full_name as string) || "").catch(() => {})
              }
              className="flex-1"
              disabled={claiming}
            >
              {claiming ? "Claiming..." : "Claim for my account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif">Claim this design</DialogTitle>
          <DialogDescription>
            Create an account or log in to claim your design for {businessName}
          </DialogDescription>
        </DialogHeader>

        <AuthForm
          defaultMode="signup"
          projectToken={projectToken}
          businessName={businessName}
          redirectTo={`${window.location.origin}/p/${projectToken}`}
          signupLabel="Claim & create account"
          loginLabel="Log in & claim"
          onAuthSuccess={handleAuthSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
