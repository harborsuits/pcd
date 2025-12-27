import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

interface ClientLayoutProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  rightSlot?: ReactNode;
  centered?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "5xl";
}

export function ClientLayout({
  title,
  subtitle,
  children,
  rightSlot,
  centered = false,
  maxWidth = "5xl",
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
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl font-bold tracking-tight text-foreground">
            Pleasant Cove
          </Link>
          <div className="flex items-center gap-4">
            {rightSlot}
            <Button asChild variant="ghost" size="sm">
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero band - like homepage/pricing */}
      {(title || subtitle) && (
        <div className="bg-gradient-to-b from-accent/15 to-accent/5 border-b border-border py-12">
          <div className={`container mx-auto px-6 ${maxWidthClass}`}>
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
              <Link to="/pricing" className="hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link to="/what-we-build" className="hover:text-foreground transition-colors">
                Demos
              </Link>
              <Link to="/portal" className="hover:text-foreground transition-colors">
                Client Portal
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
