import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import IntakeWizard from "./pages/IntakeWizard";
import Pricing from "./pages/Pricing";
import WhatWeBuild from "./pages/WhatWeBuild";
import NotFound from "./pages/NotFound";
import DemoPage from "./pages/demo/DemoPage";
import PortalPage from "./pages/portal/PortalPage";
import PortalHub from "./pages/PortalHub";
// OnboardingWizard removed - all new projects go through /get-demo
import OperatorLayout from "./pages/operator/OperatorLayout";
import WorkspacePage from "./pages/portal/WorkspacePage";
import ClientWorkspacePage from "./pages/portal/ClientWorkspacePage";
import CreatePasswordPage from "./pages/portal/CreatePasswordPage";
// GetStartedPage removed - /start now redirects to /get-demo
import RooferDemo from "./pages/demos/RooferDemo";
import RestaurantDemo from "./pages/demos/RestaurantDemo";
import SalonDemo from "./pages/demos/SalonDemo";
import GalleryDemo from "./pages/demos/GalleryDemo";
import BoutiqueDemo from "./pages/demos/BoutiqueDemo";
import BoutiqueProductPage from "./pages/demos/BoutiqueProductPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import MidcoastPillar from "./pages/local/MidcoastPillar";
import TownPage from "./pages/local/TownPage";
import VerticalPage from "./pages/local/VerticalPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Marketing / Landing */}
          <Route path="/" element={<Index />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/what-we-build" element={<WhatWeBuild />} />
          <Route path="/get-demo" element={<IntakeWizard />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/portal" element={<PortalHub />} />
          {/* /portal/new removed - all new projects go through /get-demo */}
          <Route path="/start" element={<Navigate to="/get-demo" replace />} />
          <Route path="/create-password" element={<CreatePasswordPage />} />
          <Route path="/login" element={<PortalHub />} />

          {/* Demo Mockup Pages */}
          <Route path="/demos" element={<Navigate to="/what-we-build" replace />} />
          <Route path="/demos/roofer" element={<RooferDemo />} />
          <Route path="/demos/restaurant" element={<RestaurantDemo />} />
          <Route path="/demos/salon" element={<SalonDemo />} />
          <Route path="/demos/gallery" element={<GalleryDemo />} />
          <Route path="/demos/boutique" element={<BoutiqueDemo />} />
          <Route path="/demos/boutique/product/:slug" element={<BoutiqueProductPage />} />

          {/* Public Token Routes */}
          <Route path="/d/:token/:slug" element={<DemoPage />} />
          <Route path="/p/:token" element={<PortalPage />} />
          <Route path="/c/:token" element={<ClientWorkspacePage />} />
          <Route path="/w/:token" element={<WorkspacePage />} />

          {/* Operator Console (unified hub) */}
          <Route path="/operator" element={<OperatorLayout />} />
          
          {/* Legacy redirects */}
          <Route path="/_ops-x7k9" element={<Navigate to="/operator" replace />} />
          <Route path="/admin" element={<Navigate to="/operator" replace />} />
          <Route path="/admin/*" element={<Navigate to="/operator" replace />} />
          
          {/* Local SEO landing pages */}
          <Route path="/midcoast-maine" element={<MidcoastPillar />} />
          <Route path="/web-design/:town" element={<TownPage />} />
          <Route path="/websites-for/:vertical" element={<VerticalPage />} />

          {/* Squarespace legacy URL redirects */}
          <Route path="/web-services" element={<Navigate to="/what-we-build" replace />} />
          <Route path="/services" element={<Navigate to="/what-we-build" replace />} />
          <Route path="/web-design-studio" element={<Navigate to="/what-we-build" replace />} />
          <Route path="/web-design" element={<Navigate to="/midcoast-maine" replace />} />
          <Route path="/studio" element={<Navigate to="/what-we-build" replace />} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
