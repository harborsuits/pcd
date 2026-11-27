import { Link } from "react-router-dom";
import { Facebook, Globe, Instagram, type LucideIcon } from "lucide-react";
import { BrandMark } from "./BrandMark";
import { NAP, SOCIALS } from "@/lib/localPages";

const SOCIAL_ICONS: Record<string, LucideIcon> = {
  Facebook: Facebook,
  Instagram: Instagram,
};

const FOOTER_NAV: [string, string][] = [
  ["/what-we-build", "Services"],
  ["/pricing", "Pricing"],
  ["/marketing-and-ads", "Marketing & Ads"],
  ["/ai-receptionist", "AI Receptionist"],
  ["/blog", "Blog"],
  ["/midcoast-maine", "Midcoast Maine"],
  ["/organizations", "Organizations"],
  ["/get-demo", "Contact"],
  ["/portal", "Client Portal"],
];

export function MarketingFooter({ compact = false }: { compact?: boolean }) {
  const year = new Date().getFullYear();

  return (
    <footer className="pcd-shell border-t border-border bg-background py-10 mt-auto">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 flex flex-col items-center gap-6 text-center">
        {!compact && (
          <>
            <Link to="/" aria-label="Pleasant Cove Design home" className="inline-flex">
              <BrandMark compact />
            </Link>
            <nav aria-label="Footer navigation" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
              {FOOTER_NAV.map(([href, label]) => (
                <Link key={href} to={href} className="hover:underline underline-offset-4">
                  {label}
                </Link>
              ))}
            </nav>
          </>
        )}

        <nav aria-label="Legal and contact links" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <Link to="/privacy" className="hover:underline underline-offset-4">Privacy</Link>
          <Link to="/terms" className="hover:underline underline-offset-4">Terms</Link>
          <a href={`sms:${NAP.phoneE164}`} className="hover:underline underline-offset-4">Text</a>
          <Link to="/operator" className="hover:underline underline-offset-4">Operator Sign In</Link>
          {compact && <Link to="/get-demo" className="hover:underline underline-offset-4">Contact</Link>}
        </nav>

        <nav
          aria-label="Social media"
          className="pcd-contact-orbs pcd-contact-orbs--sm text-muted-foreground"
        >
          {SOCIALS.map(({ label, href }) => {
            const Icon = SOCIAL_ICONS[label] ?? Globe;
            return (
              <a
                key={href}
                href={href}
                aria-label={label}
                title={label}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon aria-hidden="true" />
              </a>
            );
          })}
        </nav>

        <a
          href={`mailto:${NAP.email}`}
          className="text-sm text-muted-foreground underline underline-offset-4 break-all"
        >
          {NAP.email}
        </a>

        <div aria-hidden="true" className="w-full max-w-[280px] border-t border-border/70" />

        <p className="text-xs text-muted-foreground">
          © {year} {NAP.name} · Midcoast Maine. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
