import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { PortalHeader } from "@/components/portal/PortalHeader";

interface ClientLayoutProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  rightSlot?: ReactNode;
  centered?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "5xl";
  hideHeader?: boolean;
}

export function ClientLayout({
  title,
  subtitle,
  children,
  rightSlot,
  centered = false,
  maxWidth = "5xl",
  hideHeader = false,
}: ClientLayoutProps) {
  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
  }[maxWidth];

  return (
    <div className="min-h-screen flex flex-col bg-accent/10">
      {/* Header - matches homepage */}
      {!hideHeader && <PortalHeader rightSlot={rightSlot} />}

      {/* Hero band - like homepage/pricing */}
      {(title || subtitle) && (
        <div className="bg-gradient-to-b from-accent/15 to-accent/5 border-b border-border py-12">
          <div className={`container mx-auto px-6 ${maxWidthClass} text-center`}>
            {title && (
              <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-2 text-lg text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Content area */}
      <main className={`flex-1 ${centered ? "flex items-center justify-center" : ""}`}>
        <div className={`container mx-auto px-6 py-10 ${maxWidthClass}`}>
          {children}
        </div>
      </main>

      {/* Footer - shared across all portal screens */}
      <footer className="border-t border-border bg-card/50 py-8 mt-auto">
        <div className="container mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>© {new Date().getFullYear()} Pleasant Cove Design</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Built for local businesses</span>
            </div>

            <div className="flex items-center gap-4">
              <Link to="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
