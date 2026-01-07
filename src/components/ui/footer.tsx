import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface FooterProps {
  logo: React.ReactNode;
  brandName: string;
  socialLinks: Array<{
    icon: React.ReactNode;
    href: string;
    label: string;
  }>;
  mainLinks: Array<{
    href: string;
    label: string;
  }>;
  legalLinks: Array<{
    href: string;
    label: string;
  }>;
  copyright: {
    text: string;
    license?: string;
  };
}

export function Footer({
  logo,
  brandName,
  socialLinks,
  mainLinks,
  legalLinks,
  copyright,
}: FooterProps) {
  return (
    <footer className="border-t border-border bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          {/* Brand Section */}
          <div className="flex flex-col items-center gap-4 md:items-start">
            <a href="/" className="flex items-center gap-2 text-foreground">
              {logo}
              <span className="font-semibold">{brandName}</span>
            </a>
            <div className="flex gap-2">
              {socialLinks.map((link, i) => (
                <Button
                  key={i}
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <a href={link.href} target="_blank" rel="noopener noreferrer" aria-label={link.label}>
                    {link.icon}
                  </a>
                </Button>
              ))}
            </div>
          </div>

          {/* Links Section */}
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-12">
            {/* Main Links */}
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {mainLinks.map((link, i) => {
                const isExternal = link.href.startsWith('http') || link.href.startsWith('mailto:');
                return isExternal ? (
                  <a
                    key={i}
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={i}
                    to={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Legal Links */}
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {legalLinks.map((link, i) => {
                const isExternal = link.href.startsWith('http') || link.href.startsWith('mailto:');
                return isExternal ? (
                  <a
                    key={i}
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={i}
                    to={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 flex flex-col items-center gap-1 border-t border-border pt-6 text-center">
          <p className="text-sm text-muted-foreground">{copyright.text}</p>
          {copyright.license && (
            <p className="text-xs text-muted-foreground/70">{copyright.license}</p>
          )}
        </div>
      </div>
    </footer>
  );
}
