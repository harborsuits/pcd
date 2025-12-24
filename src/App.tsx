import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import GetDemo from "./pages/GetDemo";
import Pricing from "./pages/Pricing";
import WhatWeBuild from "./pages/WhatWeBuild";
import NotFound from "./pages/NotFound";
import DemoPage from "./pages/demo/DemoPage";
import PortalPage from "./pages/portal/PortalPage";
import PortalHub from "./pages/PortalHub";
import OnboardingWizard from "./pages/portal/OnboardingWizard";
import OperatorLayout from "./pages/operator/OperatorLayout";

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
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/what-we-build" element={<WhatWeBuild />} />
          <Route path="/get-demo" element={<GetDemo />} />
          <Route path="/portal" element={<PortalHub />} />
          <Route path="/portal/new" element={<OnboardingWizard />} />
          <Route path="/login" element={<PortalHub />} />

          {/* Public Token Routes */}
          <Route path="/d/:token/:slug" element={<DemoPage />} />
          <Route path="/p/:token" element={<PortalPage />} />

          {/* Operator Console (unified hub) */}
          <Route path="/operator" element={<OperatorLayout />} />
          
          {/* Legacy redirects */}
          <Route path="/_ops-x7k9" element={<Navigate to="/operator" replace />} />
          <Route path="/admin" element={<Navigate to="/operator" replace />} />
          <Route path="/admin/*" element={<Navigate to="/operator" replace />} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
