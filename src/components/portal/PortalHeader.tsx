import { Link } from "react-router-dom";
import { ReactNode } from "react";
import { BrandMark } from "@/components/layout/BrandMark";

interface PortalHeaderProps {
  rightSlot?: ReactNode;
}

export function PortalHeader({ rightSlot }: PortalHeaderProps) {
  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-5 sm:px-6 py-2 flex items-center justify-between gap-3">
        <Link to="/" aria-label="Pleasant Cove Design home" className="shrink-0">
          <BrandMark compact />
        </Link>
        {rightSlot}
      </div>
    </header>
  );
}
