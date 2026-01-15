import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Lock, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { portalSupabase } from "@/integrations/supabase/portalClient";
import pcdLogo from "@/assets/pcd-logo.jpeg";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * CreatePasswordPage - After intake submission, user creates their portal password
 * URL: /create-password?token=xxx&email=xxx&name=xxx
 */
export default function CreatePasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const projectToken = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";
  const name = searchParams.get("name") || "";
  const businessName = searchParams.get("business") || "";
  const depositStatus = searchParams.get("deposit") || ""; // "paid", "cancelled", "skipped", or ""

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [created, setCreated] = useState(false);
  const [existingAccount, setExistingAccount] = useState(false);

  // Check if user already has an account - if so, redirect to login
  useEffect(() => {
    if (!projectToken || !email) {
      toast({
        title: "Missing information",
        description: "Please complete the intake form to set up your account.",
        variant: "destructive",
      });
      navigate("/get-demo");
      return;
    }

    // Check if already logged in OR if account already exists
    const checkAuth = async () => {
      const { data: { session } } = await portalSupabase.auth.getSession();
      if (session) {
        // Already logged in - go straight to workspace
        navigate(`/w/${projectToken}`, { replace: true });
        return;
      }

      // Check if email already has an account by attempting a password reset
      // If account exists, signInWithOtp will succeed (send email)
      // We use a different approach: just try to check via the backend
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/portal/${projectToken}/create-account`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
              email,
              password: "check_only_placeholder_12345678", // Dummy password for check
              name: name || undefined,
              check_only: true, // Backend should recognize this flag
            }),
          }
        );

        const data = await res.json();
        
        // If account exists, redirect to workspace with login prompt
        if (data.existing) {
          setExistingAccount(true);
          toast({
            title: "Account already exists",
            description: "Please log in to access your project.",
          });
          // Short delay then redirect to workspace (they'll be prompted to login)
          setTimeout(() => {
            navigate(`/w/${projectToken}`, { replace: true });
          }, 1500);
          return;
        }
      } catch (err) {
        console.error("Check existing account error:", err);
        // Non-fatal, continue with form
      }

      setCheckingExisting(false);
    };

    checkAuth();
  }, [projectToken, email, name, navigate, toast]);

  const passwordsMatch = password === confirmPassword;
  const passwordValid = password.length >= 8;
  const canSubmit = passwordValid && passwordsMatch && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);

    try {
      // Call backend to create user account
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/portal/${projectToken}/create-account`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            email,
            password,
            name: name || undefined,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      // If user already exists, redirect to workspace (they'll be prompted to login)
      if (data.existing) {
        toast({
          title: "Account already exists",
          description: "Please log in to access your project.",
        });
        navigate(`/w/${projectToken}`, { replace: true });
        return;
      }

      // Sign in with the new credentials
      const { error: signInError } = await portalSupabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error("Sign in error after account creation:", signInError);
        // Account was created but auto-signin failed - redirect to login
        toast({
          title: "Account created!",
          description: "Please log in with your new password.",
        });
        navigate(`/portal?email=${encodeURIComponent(email)}`);
        return;
      }

      setCreated(true);
      toast({
        title: "Welcome to your portal!",
        description: "Your account is ready.",
      });

      // Short delay then redirect to workspace
      setTimeout(() => {
        navigate(`/w/${projectToken}`);
      }, 1500);

    } catch (err) {
      console.error("Create account error:", err);
      toast({
        title: "Something went wrong",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking if user is already logged in or account exists
  if (checkingExisting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show message when existing account detected
  if (existingAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Account already exists</h1>
          <p className="text-muted-foreground">
            Redirecting you to your project workspace...
          </p>
          <Loader2 className="h-6 w-6 mx-auto animate-spin text-primary" />
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate(`/w/${projectToken}`, { replace: true })}
              className="text-sm text-primary hover:underline"
            >
              Go to workspace now →
            </button>
            <span className="mx-2 text-muted-foreground">·</span>
            <button
              type="button"
              onClick={async () => {
                const { error } = await portalSupabase.auth.resetPasswordForEmail(email, {
                  redirectTo: `${window.location.origin}/w/${projectToken}`,
                });
                if (!error) {
                  toast({
                    title: "Reset link sent",
                    description: "Check your email for a password reset link.",
                  });
                }
              }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Forgot your password?
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (created) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold">You're all set!</h1>
          <p className="text-muted-foreground">
            Redirecting you to your project portal...
          </p>
          <Loader2 className="h-6 w-6 mx-auto animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <img
            src={pcdLogo}
            alt="Pleasant Cove Design"
            className="h-10 w-10 rounded-lg object-cover"
          />
          <span className="font-medium text-lg">Pleasant Cove Design</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Deposit success message */}
          {depositStatus === "paid" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-green-800 font-medium">Deposit received!</p>
              <p className="text-green-700 text-sm">Thank you for securing your project.</p>
            </div>
          )}
          
          {/* Welcome message */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">
              {businessName ? `Welcome, ${businessName}!` : "Create Your Password"}
            </h1>
            <p className="text-muted-foreground">
              Set a password to access your client portal anytime.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email display (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                This is the email you'll use to log in.
              </p>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password.length > 0 && !passwordValid && (
                <p className="text-xs text-destructive">
                  Password must be at least 8 characters
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-xs text-destructive">
                  Passwords don't match
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              disabled={!canSubmit}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account & Enter Portal"
              )}
            </Button>
          </form>

          {/* Footer note */}
          <p className="text-center text-xs text-muted-foreground">
            You'll use this password to log back in anytime at{" "}
            <span className="font-medium">pleasantcovedesign.com/portal</span>
          </p>
        </div>
      </main>
    </div>
  );
}
