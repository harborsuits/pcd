import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock, Mail, ArrowRight, Home, ExternalLink, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { User, Session } from "@supabase/supabase-js";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  
  const [portals, setPortals] = useState<Portal[]>([]);
  const [loadingPortals, setLoadingPortals] = useState(false);
  
  const [linkInput, setLinkInput] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setPortals([]);
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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

            {loadingPortals ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : portals.length === 0 ? (
              <div className="space-y-6">
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground mb-2">
                      You don't have any portals yet.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      When you claim a demo, it will appear here.
                    </p>
                  </CardContent>
                </Card>
                
                {/* Open from link */}
                <Card>
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
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const token = extractToken(linkInput);
                        if (token) {
                          setLinkError(null);
                          navigate(`/p/${token}`);
                        } else {
                          setLinkError("Please paste a valid portal link");
                        }
                      }}
                      className="flex gap-2"
                    >
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

                {/* See demos */}
                <Card className="border-dashed">
                  <CardContent className="py-6 text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      Want to see what we can build for you?
                    </p>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/get-demo">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Get a free demo
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-4">
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
            <CardTitle className="font-serif text-2xl">Client Login</CardTitle>
            <CardDescription>
              Log in to access your project portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
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
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
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

            <p className="text-sm text-muted-foreground text-center mt-6">
              Don't have an account?{" "}
              <Link to="/get-demo" className="text-accent hover:underline">
                Get a free demo
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}