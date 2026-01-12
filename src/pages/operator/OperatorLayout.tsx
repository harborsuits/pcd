import { useState, useEffect, createContext, useContext, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Activity, Rocket, LogOut, FolderOpen, Inbox, Send, ShieldCheck, Users, Home, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AcquisitionTab } from "./AcquisitionTab";
import { DeliveryTab } from "./DeliveryTab";
import { ProjectsTab } from "./ProjectsTab";
import { AccountsTab } from "./AccountsTab";
import { DataFreshnessPill } from "@/components/operator/DataFreshnessPill";
import { 
  AdminAuthError, 
  signInAdmin,
  signOutAdmin,
  checkAdminRole,
} from "@/lib/adminFetch";
import { useOperatorAuthReady } from "@/hooks/useOperatorAuthReady";

// Context to track currently open project for global shortcuts
interface OperatorContextValue {
  currentProjectToken: string | null;
  currentProjectName: string | null;
  setCurrentProjectToken: (token: string | null) => void;
  setCurrentProjectName: (name: string | null) => void;
  registerCloseProject: (fn: () => void) => void;
  closeProject: () => void;
}

const OperatorContext = createContext<OperatorContextValue>({
  currentProjectToken: null,
  currentProjectName: null,
  setCurrentProjectToken: () => {},
  setCurrentProjectName: () => {},
  registerCloseProject: () => {},
  closeProject: () => {},
});

export const useOperatorContext = () => useContext(OperatorContext);

const VALID_OP_TABS = ["projects", "inbox", "accounts", "leads", "outreach"] as const;
type OpTab = typeof VALID_OP_TABS[number];

export default function OperatorLayout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const initialTab: OpTab = VALID_OP_TABS.includes(tabFromUrl as OpTab) 
    ? (tabFromUrl as OpTab) 
    : "projects";
  
  const [activeTab, setActiveTab] = useState<OpTab>(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentProjectToken, setCurrentProjectToken] = useState<string | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState<string | null>(null);
  const closeProjectRef = useRef<() => void>(() => {});
  const queryClient = useQueryClient();
  
  // Single source of truth for OPERATOR auth - uses isolated storage
  const { hydrated, session } = useOperatorAuthReady();

  const registerCloseProject = useCallback((fn: () => void) => {
    closeProjectRef.current = fn;
  }, []);

  const closeProject = useCallback(() => {
    closeProjectRef.current?.();
  }, []);

  // Clear stale admin cache on mount
  useEffect(() => {
    sessionStorage.removeItem("admin_verified");
  }, []);
  
  // Sync URL → state when URL changes (browser back/forward)
  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab && VALID_OP_TABS.includes(urlTab as OpTab) && urlTab !== activeTab) {
      setActiveTab(urlTab as OpTab);
    }
  }, [searchParams]);
  
  // Sync state → URL when tab changes
  useEffect(() => {
    const currentTab = searchParams.get("tab");
    if (currentTab !== activeTab) {
      const newParams = new URLSearchParams(searchParams);
      if (activeTab === "projects") {
        newParams.delete("tab");
      } else {
        newParams.set("tab", activeTab);
      }
      setSearchParams(newParams, { replace: true });
    }
  }, [activeTab]);

  // React to session changes from useAuthReady - NO duplicate onAuthStateChange listener
  useEffect(() => {
    if (!hydrated) return;
    
    let cancelled = false;
    
    const checkAdmin = async () => {
      console.log("[OperatorLayout] Session changed, checking admin...", !!session);
      
      if (!session?.user?.id) {
        setIsAuthed(false);
        setUserEmail(null);
        setIsLoading(false);
        return;
      }
      
      // Check admin role using user ID from session
      const isAdmin = await checkAdminRole(session.user.id);
      if (cancelled) return;
      
      console.log("[OperatorLayout] isAdmin:", isAdmin);
      setIsAuthed(isAdmin);
      setUserEmail(isAdmin ? session.user.email || null : null);
      setIsLoading(false);
    };
    
    checkAdmin();
    
    return () => { cancelled = true; };
  }, [hydrated, session]); // React to session changes from useAuthReady

  // Listen for AdminAuthError events globally
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error instanceof AdminAuthError || event.message?.includes("Admin authentication")) {
        signOutAdmin();
        setIsAuthed(false);
        setUserEmail(null);
        toast.error("Session expired. Please log in again.");
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason instanceof AdminAuthError || event.reason?.message?.includes("Admin authentication")) {
        signOutAdmin();
        setIsAuthed(false);
        setUserEmail(null);
        toast.error("Session expired. Please log in again.");
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  // Escape key to close current project
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const el = document.activeElement as HTMLElement | null;
      const isTyping = el?.tagName === "INPUT" || el?.tagName === "TEXTAREA" || el?.getAttribute("contenteditable") === "true";
      if (isTyping) return;
      if (currentProjectToken) {
        e.preventDefault();
        closeProject();
        toast.success("Closed project");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentProjectToken, closeProject]);

  // Global Alt+R keyboard shortcut for refresh
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.altKey && e.key.toLowerCase() === "r")) return;
      const el = document.activeElement as HTMLElement | null;
      const isTyping = el?.tagName === "INPUT" || el?.tagName === "TEXTAREA" || el?.getAttribute("contenteditable") === "true";
      if (isTyping) return;
      e.preventDefault();
      if (currentProjectToken) {
        queryClient.invalidateQueries({ queryKey: ["project-messages", currentProjectToken] });
        queryClient.invalidateQueries({ queryKey: ["project-comments", currentProjectToken] });
        queryClient.invalidateQueries({ queryKey: ["project-media", currentProjectToken] });
        queryClient.invalidateQueries({ queryKey: ["project-prototypes", currentProjectToken] });
        toast.success("Project data refreshed");
      } else {
        queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
        queryClient.invalidateQueries({ queryKey: ["admin-inbox"] });
        toast.success("Operator data refreshed");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [queryClient, currentProjectToken]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    
    setIsValidating(true);
    setLoginError(null);
    
    // 10-second timeout failsafe to prevent indefinite hangs
    const timeout = new Promise<{ success: boolean; error?: string }>((resolve) =>
      setTimeout(() => resolve({ 
        success: false, 
        error: "Sign-in timed out. Please try again." 
      }), 10000)
    );
    
    const result = await Promise.race([signInAdmin(email, password), timeout]);
    
    if (result.success) {
      setIsLoading(false);
      setIsAuthed(true);
      setUserEmail(email);
      toast.success("Authenticated successfully");
    } else {
      setLoginError(result.error || "Login failed");
    }
    
    setIsValidating(false);
  };

  const handleLogout = async () => {
    console.log("[OperatorLayout] Logout clicked");
    // Clear state immediately before async operation
    setIsAuthed(false);
    setUserEmail(null);
    setEmail("");
    setPassword("");
    
    try {
      await signOutAdmin();
      console.log("[OperatorLayout] signOutAdmin completed");
      toast.success("Logged out");
    } catch (err) {
      console.error("[OperatorLayout] Logout error:", err);
      // State already cleared, show message anyway
      toast.success("Logged out");
    }
  };

  // Show loading state while hydrating or checking auth
  if (!hydrated || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Session expired - authed state but no session after hydration
  if (isAuthed && hydrated && !session) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border bg-card p-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/"><Home className="h-4 w-4 mr-2" />Home</Link>
          </Button>
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Session Expired</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Please sign in again to access the operator console.
              </p>
              <Button onClick={() => setIsAuthed(false)} className="w-full">
                Go to login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border bg-card p-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/"><Home className="h-4 w-4 mr-2" />Home</Link>
          </Button>
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Operator Console
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setLoginError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && !isValidating && handleLogin()}
                  disabled={isValidating}
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setLoginError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && !isValidating && handleLogin()}
                  disabled={isValidating}
                />
              </div>
              {loginError && <p className="text-sm text-destructive">{loginError}</p>}
              <Button 
                className="w-full" 
                onClick={handleLogin} 
                disabled={isValidating}
              >
                {isValidating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Signing in...</>
                ) : (
                  <><Rocket className="h-4 w-4 mr-2" />Sign In</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <OperatorContext.Provider value={{ currentProjectToken, currentProjectName, setCurrentProjectToken, setCurrentProjectName, registerCloseProject, closeProject }}>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card sticky top-0 z-10">
          <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                <h1 className="text-base sm:text-xl font-bold truncate">Operator Console</h1>
              </div>
              <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
                <DataFreshnessPill staleAfterSeconds={60} queryKeys={[["admin-projects"], ["admin-inbox"]]} />
                <Badge variant="outline" className="gap-1 sm:gap-1.5 text-xs font-normal" title={userEmail || "Authenticated"}>
                  <ShieldCheck className="h-3 w-3 text-green-500" />
                  <span className="hidden sm:inline">{userEmail || "Authed"}</span>
                </Badge>
                <Button variant="ghost" size="sm" className="px-2 sm:px-3" asChild>
                  <Link to="/"><Home className="h-4 w-4" /><span className="hidden sm:inline ml-2">Home</span></Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-0 sm:mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-2 sm:px-4 py-3 sm:py-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as OpTab)} className="space-y-4 sm:space-y-6">
            <div className="overflow-x-auto scrollbar-hide -mx-2 px-2">
              <TabsList className="inline-flex w-auto min-w-max sm:grid sm:w-full sm:max-w-3xl sm:grid-cols-5">
                <TabsTrigger value="projects" className="gap-1.5 sm:gap-2 px-3 sm:px-4"><FolderOpen className="h-4 w-4" /><span className="text-xs sm:text-sm">Projects</span></TabsTrigger>
                <TabsTrigger value="inbox" className="gap-1.5 sm:gap-2 px-3 sm:px-4"><Inbox className="h-4 w-4" /><span className="text-xs sm:text-sm">Inbox</span></TabsTrigger>
                <TabsTrigger value="accounts" className="gap-1.5 sm:gap-2 px-3 sm:px-4"><Users className="h-4 w-4" /><span className="text-xs sm:text-sm">Accounts</span></TabsTrigger>
                <TabsTrigger value="leads" className="gap-1.5 sm:gap-2 px-3 sm:px-4"><Rocket className="h-4 w-4" /><span className="text-xs sm:text-sm">Leads</span></TabsTrigger>
                <TabsTrigger value="outreach" className="gap-1.5 sm:gap-2 px-3 sm:px-4"><Send className="h-4 w-4" /><span className="text-xs sm:text-sm">Outreach</span></TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="projects"><ProjectsTab /></TabsContent>
            <TabsContent value="inbox"><DeliveryTab /></TabsContent>
            <TabsContent value="accounts"><AccountsTab /></TabsContent>
            <TabsContent value="leads"><AcquisitionTab /></TabsContent>
            <TabsContent value="outreach">
              <Card><CardHeader><CardTitle>Outreach</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Outreach tracking coming soon.</p></CardContent></Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </OperatorContext.Provider>
  );
}
