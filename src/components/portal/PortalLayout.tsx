import { Link } from "react-router-dom";
import { ReactNode } from "react";

interface PortalLayoutProps {
  children: ReactNode;
  showLogout?: boolean;
  onLogout?: () => void;
  rightContent?: ReactNode;
}

export function PortalLayout({ 
  children, 
  showLogout = false, 
  onLogout,
  rightContent 
}: PortalLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header - matches homepage */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl font-bold tracking-tight text-foreground">
            Pleasant Cove
          </Link>
          <div className="flex items-center gap-4">
            {rightContent}
            {showLogout && onLogout && (
              <button
                onClick={onLogout}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Log out
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

interface PortalHeroProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
}

export function PortalHero({ title, subtitle, badge }: PortalHeroProps) {
  return (
    <div className="bg-gradient-to-b from-accent/5 to-background border-b border-border">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
          {badge && <div>{badge}</div>}
        </div>
      </div>
    </div>
  );
}

interface PortalCardProps {
  children: ReactNode;
  className?: string;
}

export function PortalCard({ children, className = "" }: PortalCardProps) {
  return (
    <div className={`bg-card rounded-xl border border-border shadow-sm ${className}`}>
      {children}
    </div>
  );
}
