import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AuthForm, AuthSuccessContext } from "@/components/auth/AuthForm";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface ClaimAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessName: string;
  projectToken: string;
}

export function ClaimAuthModal({
  open,
  onOpenChange,
  businessName,
  projectToken,
}: ClaimAuthModalProps) {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);

  // Use the user's JWT to claim - server verifies identity from the token
  const claimProjectWithSession = async (accessToken: string, userName: string) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/demo/claim-with-auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ project_token: projectToken, name: userName }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "We couldn't claim this design. Please try again.");
    }
  };

  const handleAuthSuccess = async ({ accessToken, name }: AuthSuccessContext) => {
    await claimProjectWithSession(accessToken, name);
    setSuccess(true);
    toast({ title: "Design claimed!", description: "Your portal is ready." });
    setTimeout(() => navigate(`/p/${projectToken}`), 1500);
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="sr-only">
            <DialogTitle>Design claimed</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">You're in!</h3>
            <p className="text-muted-foreground mb-4">
              Taking you to your portal for {businessName}...
            </p>
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Claim this design</DialogTitle>
          <DialogDescription>
            Create an account to access your private space where we'll work on the site for {businessName}.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          <AuthForm
            defaultMode="signup"
            projectToken={projectToken}
            businessName={businessName}
            redirectTo={`${window.location.origin}/p/${projectToken}`}
            signupLabel="Claim & create account"
            loginLabel="Log in & claim"
            onAuthSuccess={handleAuthSuccess}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
