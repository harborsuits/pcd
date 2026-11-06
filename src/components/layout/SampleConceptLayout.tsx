import { Outlet, Link, useLocation } from "react-router-dom";
import { BrandMark } from "./BrandMark";
import { SEOHead } from "@/components/SEOHead";

export function SampleConceptLayout() {
  const { pathname } = useLocation();
  const label = pathname.split("/")[2] || "Website";
  const name = label.charAt(0).toUpperCase() + label.slice(1);
  return <><SEOHead title={`${name} Sample Concept`} description={`An illustrative ${label} website concept by Pleasant Cove Design. Explore a sample layout, not a live client website or an active store.`} path={pathname} noindex /><aside aria-label="Sample concept" className="pcd-shell bg-background text-foreground border-b border-border px-4 py-2"><div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2"><Link to="/" aria-label="Pleasant Cove Design home"><BrandMark compact /></Link><span className="text-xs font-semibold">Sample concept</span><nav aria-label="Sample navigation" className="flex gap-4 text-sm"><Link to="/what-we-build" className="underline underline-offset-4">Back to services</Link><Link to="/get-demo" className="underline underline-offset-4">Contact Ben</Link></nav></div></aside><Outlet /></>;
}