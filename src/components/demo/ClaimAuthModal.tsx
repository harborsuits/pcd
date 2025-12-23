import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import { Loader2, Lock, Mail, User, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Sign up with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
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

      if (data.session) {
        // Use the session's access token to claim the project
        await claimProjectWithSession(data.session.access_token, name);
        setSuccess(true);

        toast({
          title: "Design claimed!",
          description: "Your portal is ready.",
        });

        setTimeout(() => {
          navigate(`/p/${projectToken}`);
        }, 1500);
      }
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
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError(loginError.message);
        return;
      }

      if (data.session) {
        // Use the session's access token to claim the project
        await claimProjectWithSession(data.session.access_token, name || email.split("@")[0]);
        setSuccess(true);

        toast({
          title: "Design claimed!",
          description: "Your portal is ready.",
        });

        setTimeout(() => {
          navigate(`/p/${projectToken}`);
        }, 1500);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Use the user's JWT to claim - server verifies identity from the token
  const claimProjectWithSession = async (accessToken: string, userName: string) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/demo/claim-with-auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${accessToken}`, // User's JWT, not anon key
        },
        body: JSON.stringify({
          project_token: projectToken,
          name: userName,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("Claim error:", data.error || res.status);
        throw new Error(data.error || "Failed to claim");
      }
    } catch (err) {
      console.error("Claim project error:", err);
      throw err;
    }
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">You're In!</h3>
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
          <DialogTitle className="text-xl">Claim This Design</DialogTitle>
          <DialogDescription>
            Create an account to access your private portal where we'll collaborate on
            your site for {businessName}.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signup">New Account</TabsTrigger>
            <TabsTrigger value="login">I Have an Account</TabsTrigger>
          </TabsList>

          <TabsContent value="signup" className="mt-4">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="claim-name">Your Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="claim-name"
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
                <Label htmlFor="claim-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="claim-email"
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
                <Label htmlFor="claim-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="claim-password"
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
                  "Claim & Create Account"
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                This creates your private workspace where we'll build your site together.
              </p>
            </form>
          </TabsContent>

          <TabsContent value="login" className="mt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="claim-login-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="claim-login-email"
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
                <Label htmlFor="claim-login-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="claim-login-password"
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
