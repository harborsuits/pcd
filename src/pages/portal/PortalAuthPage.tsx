import { useState } from "react";
import { portalSupabase } from "@/integrations/supabase/portalClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Lock, Mail, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { EmailVerification } from "@/components/portal/EmailVerification";
import { ClientLayout } from "@/components/portal/ClientLayout";
import { BrandCard } from "@/components/portal/BrandCard";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface PortalAuthPageProps {
  projectToken: string;
  businessName: string;
  onAuthSuccess: () => void;
}

type AuthStep = "credentials" | "verification";

export function PortalAuthPage({ projectToken, businessName, onAuthSuccess }: PortalAuthPageProps) {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [step, setStep] = useState<AuthStep>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For verification step
  const [pendingSession, setPendingSession] = useState<{ accessToken: string; userName: string } | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Sign up with Supabase Auth
      const { data, error: signUpError } = await portalSupabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/p/${projectToken}`,
          data: {
            full_name: name,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setError("This email is already registered. Please log in instead.");
          setMode("login");
        } else {
          setError(signUpError.message);
        }
        return;
      }

      console.log("✅ Signup succeeded, data:", { user: !!data.user, session: !!data.session });

      // ALWAYS go to OTP verification after signup - NO CONDITIONS
      // Store session info for after verification
      setPendingSession({
        accessToken: data.session?.access_token ?? "",
        userName: name,
      });
      
      console.log("🚀 Forcing OTP step now");
      setStep("verification");
      // DO NOT call onAuthSuccess() here - wait for OTP verification
      
    } catch (err) {
      console.error("Signup error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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
        // Verify user owns this project or link if first time
        const verified = await verifyOrLinkProject(data.session.access_token);
        if (!verified) {
        setError("You don't have access to this portal.");
        await portalSupabase.auth.signOut();
          return;
        }

        toast({
          title: "Welcome back!",
          description: `Logged in to ${businessName} portal.`,
        });
        onAuthSuccess();
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationComplete = async () => {
    if (!pendingSession) return;

    // Link user to project after verification
    await linkUserToProject(pendingSession.accessToken);
    toast({
      title: "Account created!",
      description: "Welcome to your project portal.",
    });
    onAuthSuccess();
  };

  const handleBackToCredentials = async () => {
    // Sign out the pending session
    await portalSupabase.auth.signOut();
    setPendingSession(null);
    setStep("credentials");
    setEmail("");
    setPassword("");
    setName("");
  };

  // Use the user's JWT - server extracts user from token
  const linkUserToProject = async (accessToken: string) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/portal/${projectToken}/link-owner`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${accessToken}`, // User's JWT
        },
        body: JSON.stringify({}), // No user_id - server extracts from JWT
      });

      if (!res.ok) {
        console.error("Failed to link user to project");
      }
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
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${accessToken}`, // User's JWT
        },
        body: JSON.stringify({}), // No user_id - server extracts from JWT
      });

      const data = await res.json();
      
      // If project is unclaimed, try to link the user to it
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

  // Show verification screen if we're in that step
  if (step === "verification") {
    return (
      <EmailVerification
        email={email}
        projectToken={projectToken}
        businessName={businessName}
        onVerified={handleVerificationComplete}
        onBack={handleBackToCredentials}
      />
    );
  }

  return (
    <ClientLayout
      title={businessName}
      subtitle={
        <>
          <span className="text-accent font-medium uppercase tracking-wide text-sm">Client Portal</span>
        </>
      }
      maxWidth="md"
      centered
    >
      <BrandCard className="w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <h2 className="font-serif text-xl font-bold text-foreground">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signup"
              ? "Sign up to access your project portal"
              : "Log in to continue"}
          </p>
        </div>
        
        <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
            <TabsTrigger value="login">Log In</TabsTrigger>
          </TabsList>

          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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

          <TabsContent value="login">
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
                <Label htmlFor="login-password">Password</Label>
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
            </form>
          </TabsContent>
        </Tabs>
      </BrandCard>
    </ClientLayout>
  );
}
