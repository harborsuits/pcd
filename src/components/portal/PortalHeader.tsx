import { Link } from "react-router-dom";
import { ReactNode } from "react";

interface PortalHeaderProps {
  rightSlot?: ReactNode;
}

export function PortalHeader({ rightSlot }: PortalHeaderProps) {
  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="font-serif text-xl font-bold tracking-tight text-foreground">
          Pleasant Cove
        </Link>
        <div className="flex items-center gap-4">
          {rightSlot}
          <nav className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link to="/what-we-build" className="hover:text-foreground transition-colors">
              Demos
            </Link>
            <Link to="/portal" className="hover:text-foreground transition-colors">
              Client Portal
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
