import { useState, useEffect, createContext, useContext, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Activity, Rocket, LogOut, FolderOpen, Inbox, Send, ShieldCheck, KeyRound, Users, Home, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AcquisitionTab } from "./AcquisitionTab";
import { DeliveryTab } from "./DeliveryTab";
import { ProjectsTab } from "./ProjectsTab";
import { AccountsTab } from "./AccountsTab";
import { DataFreshnessPill } from "@/components/operator/DataFreshnessPill";
import { 
  AdminAuthError, 
  clearAdminKey, 
  setAdminKey as saveAdminKey, 
  getAdminKey,
  setAdminKeyStorageMode,
  getAdminKeyStorageMode,
  getKeySetAt,
  getLast401At
} from "@/lib/adminFetch";

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

function formatTimeAgo(ts?: number | null): string | null {
  if (!ts) return null;
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function OperatorLayout() {
  const [adminKeyInput, setAdminKeyInput] = useState("");
  const [isAuthed, setIsAuthed] = useState(() => !!getAdminKey());
  const [isValidating, setIsValidating] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(() => getAdminKeyStorageMode() === "local");
  const [currentProjectToken, setCurrentProjectToken] = useState<string | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState<string | null>(null);
  const closeProjectRef = useRef<() => void>(() => {});
  const queryClient = useQueryClient();

  const registerCloseProject = useCallback((fn: () => void) => {
    closeProjectRef.current = fn;
  }, []);

  const closeProject = useCallback(() => {
    closeProjectRef.current?.();
  }, []);

  // Listen for AdminAuthError events globally
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error instanceof AdminAuthError || event.message?.includes("Admin key invalid")) {
        clearAdminKey();
        setAdminKeyInput("");
        setIsAuthed(false);
        toast.error("Session expired. Please re-enter your admin key.");
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason instanceof AdminAuthError || event.reason?.message?.includes("Admin key invalid")) {
        clearAdminKey();
        setAdminKeyInput("");
        setIsAuthed(false);
        toast.error("Session expired. Please re-enter your admin key.");
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
      const isTyping =
        el?.tagName === "INPUT" ||
        el?.tagName === "TEXTAREA" ||
        el?.getAttribute("contenteditable") === "true";
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
      const isTyping =
        el?.tagName === "INPUT" ||
        el?.tagName === "TEXTAREA" ||
        el?.getAttribute("contenteditable") === "true";
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

  const handleSetAdminKey = async () => {
    const key = adminKeyInput.trim();
    if (!key) return;
    
    setIsValidating(true);
    setLoginError(null);
    
    // Test the key against the server before saving
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin/projects`, {
        headers: { "x-admin-key": key }
      });
      
      if (res.status === 401) {
        setLoginError("Invalid admin key. Please check and try again.");
        setIsValidating(false);
        return;
      }
      
      if (!res.ok) {
        setLoginError("Server error. Please try again.");
        setIsValidating(false);
        return;
      }
      
      // Key is valid - save it
      setAdminKeyStorageMode(rememberMe ? "local" : "session");
      saveAdminKey(key);
      setIsAuthed(true);
      toast.success("Authenticated successfully");
    } catch (err) {
      setLoginError("Network error. Please check your connection.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleLogout = () => {
    clearAdminKey();
    setAdminKeyInput("");
    setIsAuthed(false);
    toast.success("Logged out");
  };

  // Show auth prompt if no admin key
  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border bg-card p-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Link>
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
                type="password"
                placeholder="Enter admin key"
                value={adminKeyInput}
                onChange={(e) => {
                  setAdminKeyInput(e.target.value);
                  setLoginError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && !isValidating && handleSetAdminKey()}
                disabled={isValidating}
              />
              {loginError && (
                <p className="text-sm text-destructive mt-2">{loginError}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                disabled={isValidating}
              />
              <label 
                htmlFor="rememberMe" 
                className="text-sm text-muted-foreground cursor-pointer select-none"
              >
                Remember me on this device
              </label>
            </div>
            <Button className="w-full" onClick={handleSetAdminKey} disabled={isValidating}>
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4 mr-2" />
                  Access Console
                </>
              )}
            </Button>
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  const storageMode = getAdminKeyStorageMode() === "local" ? "Remembered" : "Session";
  const keySetAt = getKeySetAt();
  const last401At = getLast401At();

  return (
    <OperatorContext.Provider value={{ 
      currentProjectToken, 
      currentProjectName,
      setCurrentProjectToken, 
      setCurrentProjectName,
      registerCloseProject,
      closeProject 
    }}>
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          {/* Mobile: Stack vertically, Desktop: Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
              <h1 className="text-base sm:text-xl font-bold truncate">Operator Console</h1>
            </div>
            <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
              {/* Data freshness - compact on mobile */}
              <DataFreshnessPill
                staleAfterSeconds={60}
                queryKeys={[
                  ["admin-projects"],
                  ["admin-inbox"],
                ]}
              />
              {/* Session status - simplified on mobile */}
              <Badge 
                variant="outline" 
                className="gap-1 sm:gap-1.5 text-xs font-normal"
                title={[
                  `Storage: ${storageMode}`,
                  keySetAt ? `Key set: ${formatTimeAgo(keySetAt)}` : null,
                  last401At ? `Last 401: ${formatTimeAgo(last401At)}` : null
                ].filter(Boolean).join('\n')}
              >
                <ShieldCheck className="h-3 w-3 text-green-500" />
                <span className="hidden sm:inline">Authed</span>
                <span className="hidden sm:inline text-muted-foreground">•</span>
                <span className="text-muted-foreground">{storageMode}</span>
              </Badge>
              {/* Home - icon only on mobile */}
              <Button variant="ghost" size="sm" className="px-2 sm:px-3" asChild>
                <Link to="/">
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Home</span>
                </Link>
              </Button>
              {/* Rotate key - icon only on mobile */}
              <Button
                variant="outline"
                size="sm"
                className="px-2 sm:px-3"
                onClick={() => {
                  clearAdminKey();
                  setAdminKeyInput("");
                  setIsAuthed(false);
                  toast.success("Admin key cleared. Please re-authenticate.");
                }}
              >
                <KeyRound className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Rotate Key</span>
              </Button>
              {/* Logout - hidden on mobile, use rotate key instead */}
              <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden sm:flex">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-3 sm:py-6">
        <Tabs defaultValue="projects" className="space-y-4 sm:space-y-6">
          {/* Main tabs - horizontal scroll on mobile */}
          <div className="overflow-x-auto scrollbar-hide -mx-2 px-2">
            <TabsList className="inline-flex w-auto min-w-max sm:grid sm:w-full sm:max-w-3xl sm:grid-cols-5">
              <TabsTrigger value="projects" className="gap-1.5 sm:gap-2 px-3 sm:px-4">
                <FolderOpen className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Projects</span>
              </TabsTrigger>
              <TabsTrigger value="inbox" className="gap-1.5 sm:gap-2 px-3 sm:px-4">
                <Inbox className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Inbox</span>
              </TabsTrigger>
              <TabsTrigger value="accounts" className="gap-1.5 sm:gap-2 px-3 sm:px-4">
                <Users className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Accounts</span>
              </TabsTrigger>
              <TabsTrigger value="leads" className="gap-1.5 sm:gap-2 px-3 sm:px-4">
                <Rocket className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Leads</span>
              </TabsTrigger>
              <TabsTrigger value="outreach" className="gap-1.5 sm:gap-2 px-3 sm:px-4">
                <Send className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Outreach</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="projects">
            <ProjectsTab />
          </TabsContent>

          <TabsContent value="inbox">
            <DeliveryTab />
          </TabsContent>

          <TabsContent value="accounts">
            <AccountsTab />
          </TabsContent>

          <TabsContent value="leads">
            <AcquisitionTab />
          </TabsContent>

          <TabsContent value="outreach">
            <Card>
              <CardHeader>
                <CardTitle>Outreach</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Outreach tracking coming soon. View leads tab for current outreach controls.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
    </OperatorContext.Provider>
  );
}
