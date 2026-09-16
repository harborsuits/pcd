import { portalSupabase } from "@/integrations/supabase/portalClient";
import { toast } from "@/hooks/use-toast";
import { ClientLayout } from "@/components/portal/ClientLayout";
import { BrandCard } from "@/components/portal/BrandCard";
import { AuthForm, AuthSuccessContext } from "@/components/auth/AuthForm";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface PortalAuthPageProps {
  projectToken: string;
  businessName: string;
  onAuthSuccess: () => void;
}

export function PortalAuthPage({ projectToken, businessName, onAuthSuccess }: PortalAuthPageProps) {
  // Use the user's JWT - server extracts user from token
  const linkUserToProject = async (accessToken: string) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/portal/${projectToken}/link-owner`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) console.error("Failed to link user to project");
    } catch (err) {
      console.error("Link user error:", err);
    }
  };

  const verifyOrLinkProject = async (accessToken: string): Promise<boolean> => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/portal/${projectToken}/verify-owner`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (data.unclaimed === true) {
        await linkUserToProject(accessToken);
        return true;
      }

      return data.ok === true;
    } catch (err) {
      console.error("Verify owner error:", err);
      return false;
    }
  };

  const handleAuthSuccess = async ({ accessToken, isNewAccount }: AuthSuccessContext) => {
    if (isNewAccount) {
      await linkUserToProject(accessToken);
    } else {
      const verified = await verifyOrLinkProject(accessToken);
      if (!verified) {
        await portalSupabase.auth.signOut();
        throw new Error("That account doesn't have access to this portal.");
      }
    }

    toast({
      title: isNewAccount ? "Account created!" : "Welcome back!",
      description: `You're in the ${businessName} portal.`,
    });
    onAuthSuccess();
  };

  return (
    <ClientLayout
      title={businessName}
      subtitle={<span className="text-accent font-medium uppercase tracking-wide text-sm">Client Portal</span>}
      maxWidth="md"
      centered
    >
      <BrandCard className="w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <h2 className="font-serif text-xl font-bold text-foreground">Your project portal</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in, or create an account to follow along.
          </p>
        </div>

        <AuthForm
          defaultMode="signup"
          projectToken={projectToken}
          businessName={businessName}
          redirectTo={`${window.location.origin}/p/${projectToken}`}
          onAuthSuccess={handleAuthSuccess}
        />
      </BrandCard>
    </ClientLayout>
  );
}
