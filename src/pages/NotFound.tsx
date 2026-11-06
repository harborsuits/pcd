import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="pcd-shell flex flex-col min-h-screen bg-page-bg text-foreground">
      <SEOHead
        title="Page Not Found"
        description="This page could not be found. Return to Pleasant Cove Design’s homepage, explore website services, or contact Ben about your project."
        path={location.pathname || "/404"}
        noindex
      />
      <MarketingHeader />
      <main className="flex-1 w-full max-w-3xl mx-auto px-5 sm:px-6 py-12 md:py-16 text-center">
        <p className="text-sm text-muted-foreground mb-4">404</p>
        <h1 className="mb-5 text-3xl md:text-4xl font-serif font-bold">Page not found</h1>
        <p className="mb-7 text-base md:text-lg text-muted-foreground">The address may have changed, or the page may no longer be available.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button asChild><Link to="/">Home</Link></Button>
          <Button asChild variant="outline"><Link to="/what-we-build">Services</Link></Button>
          <Button asChild variant="outline"><Link to="/get-demo">Contact Ben</Link></Button>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
};

export default NotFound;
