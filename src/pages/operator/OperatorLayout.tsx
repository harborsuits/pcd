import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity, Rocket, LogOut, FolderOpen, Inbox, Send } from "lucide-react";
import { toast } from "sonner";
import { AcquisitionTab } from "./AcquisitionTab";
import { DeliveryTab } from "./DeliveryTab";
import { ProjectsTab } from "./ProjectsTab";
import { AdminAuthError, clearAdminKey, setAdminKey as saveAdminKey } from "@/lib/adminFetch";

export default function OperatorLayout() {
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem("admin_key") || "");
  const [isAuthed, setIsAuthed] = useState(() => !!localStorage.getItem("admin_key"));

  // Listen for AdminAuthError events globally
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error instanceof AdminAuthError || event.message?.includes("Admin key invalid")) {
        clearAdminKey();
        setAdminKey("");
        setIsAuthed(false);
        toast.error("Session expired. Please re-enter your admin key.");
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason instanceof AdminAuthError || event.reason?.message?.includes("Admin key invalid")) {
        clearAdminKey();
        setAdminKey("");
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

  const handleSetAdminKey = () => {
    if (adminKey.trim()) {
      saveAdminKey(adminKey.trim());
      setIsAuthed(true);
      toast.success("Admin key saved");
    }
  };

  const handleLogout = () => {
    clearAdminKey();
    setAdminKey("");
    setIsAuthed(false);
    toast.success("Logged out");
  };

  // Show auth prompt if no admin key
  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSetAdminKey()}
              />
            </div>
            <Button className="w-full" onClick={handleSetAdminKey}>
              <Rocket className="h-4 w-4 mr-2" />
              Access Console
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Operator Console</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="projects" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="inbox" className="gap-2">
              <Inbox className="h-4 w-4" />
              Inbox
            </TabsTrigger>
            <TabsTrigger value="leads" className="gap-2">
              <Rocket className="h-4 w-4" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="outreach" className="gap-2">
              <Send className="h-4 w-4" />
              Outreach
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            <ProjectsTab />
          </TabsContent>

          <TabsContent value="inbox">
            <DeliveryTab />
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
  );
}
