import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import GetDemo from "./pages/GetDemo";
import NotFound from "./pages/NotFound";
import DemoPage from "./pages/demo/DemoPage";
import PortalPage from "./pages/portal/PortalPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProjects from "./pages/admin/AdminProjects";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminLeads from "./pages/admin/AdminLeads";
import AdminOutreach from "./pages/admin/AdminOutreach";
import OpsPage from "./pages/ops/OpsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Marketing / Landing */}
          <Route path="/" element={<Index />} />
          <Route path="/get-demo" element={<GetDemo />} />

          {/* Public Token Routes */}
          <Route path="/d/:token/:slug" element={<DemoPage />} />
          <Route path="/p/:token" element={<PortalPage />} />

          {/* Operator Console (secret URL) */}
          <Route path="/_ops-x7k9" element={<OpsPage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="projects" element={<AdminProjects />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="leads" element={<AdminLeads />} />
            <Route path="outreach" element={<AdminOutreach />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
