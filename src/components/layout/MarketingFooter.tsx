import { Link } from "react-router-dom";
import { BrandMark } from "./BrandMark";
import { NAP } from "@/lib/localPages";

export function MarketingFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className="pcd-shell border-t border-border bg-background py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 flex flex-col gap-6">
        {!compact && <Link to="/" aria-label="Pleasant Cove Design home" className="self-start"><BrandMark /></Link>}
        {!compact && <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
          {[["/what-we-build", "Services"], ["/pricing", "Pricing"], ["/ai-receptionist", "AI Receptionist"], ["/blog", "Blog"], ["/midcoast-maine", "Midcoast Maine"], ["/get-demo", "Contact"], ["/portal", "Client Portal"]].map(([href, label]) => <Link key={href} to={href} className="hover:underline underline-offset-4">{label}</Link>)}
        </nav>}
        <div className="flex flex-col sm:flex-row justify-between gap-5 text-sm text-muted-foreground">
          <div className="min-w-0 space-y-2"><p>© {new Date().getFullYear()} {NAP.name} · Midcoast Maine</p><a href={`mailto:${NAP.email}`} className="block [overflow-wrap:anywhere] underline underline-offset-4">{NAP.email}</a></div>
          <nav aria-label="Legal and contact links" className="flex flex-wrap gap-x-5 gap-y-3 self-start"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><a href={`sms:${NAP.phoneE164}`}>Text Ben</a>{compact && <Link to="/get-demo">Contact</Link>}</nav>
        </div>
      </div>
    </footer>
  );
}