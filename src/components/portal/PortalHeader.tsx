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
          Pleasant Cove Design
        </Link>
        {rightSlot}
      </div>
    </header>
  );
}
