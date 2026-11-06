import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { BrandMark } from "./BrandMark";

type ActivePage =
  | "home"
  | "what-we-build"
  | "pricing"
  | "ai-receptionist"
  | "blog"
  | "midcoast-maine"
  | "contact";

interface MarketingHeaderProps {
  activePage?: ActivePage;
}

const NAV_ITEMS: { label: string; href: string; key: ActivePage }[] = [
  { label: "Midcoast Maine", href: "/midcoast-maine", key: "midcoast-maine" },
  { label: "What We Build", href: "/what-we-build", key: "what-we-build" },
  { label: "AI Receptionist", href: "/ai-receptionist", key: "ai-receptionist" },
  { label: "Blog", href: "/blog", key: "blog" },
  { label: "Pricing", href: "/pricing", key: "pricing" },
  { label: "Contact", href: "/get-demo", key: "contact" },
];

const CTA_HREF = "/get-demo?service=review";
const CTA_LABEL = "Get a Free Review";

export function MarketingHeader({ activePage }: MarketingHeaderProps) {
  const [open, setOpen] = useState(false);
  const items = NAV_ITEMS;
  const { pathname } = useLocation();
  const isCurrent = (item: typeof NAV_ITEMS[number]) => item.key === activePage || pathname === item.href || (item.key === "blog" && pathname.startsWith("/blog/"));

  return (
    <header className="pcd-shell border-b border-border bg-card sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 flex items-center justify-between gap-3 py-1">
        <Link
          to="/"
          className="font-serif text-lg md:text-xl font-bold text-foreground shrink-0"
          aria-label="Pleasant Cove Design home"
        >
          <BrandMark />
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main navigation" className="hidden xl:flex items-center gap-1">
          {items.map((item) => (
            <Button
              key={item.key}
              asChild
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <Link to={item.href} aria-current={isCurrent(item) ? "page" : undefined}>{item.label}</Link>
            </Button>
          ))}
          <Button asChild size="sm" variant="outline" className="whitespace-nowrap">
            <Link to="/portal">Client Portal</Link>
          </Button>
        </nav>

        {/* Mobile nav */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="xl:hidden">
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="pcd-shell w-72 max-w-[90vw] overflow-y-auto">
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription className="sr-only">Pleasant Cove Design pages and client portal</SheetDescription>
            <nav aria-label="Mobile navigation" className="flex flex-col gap-4 mt-8">
              {items.map((item) => (
                <Link
                  key={item.key}
                  to={item.href}
                  aria-current={isCurrent(item) ? "page" : undefined}
                  className="text-lg font-medium hover:text-accent transition-colors"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link to="/portal" className="text-lg font-medium" onClick={() => setOpen(false)}>Client Portal</Link>
              <Button
                asChild
                size="lg"
                className="mt-4"
                onClick={() => setOpen(false)}
              >
                <Link to={CTA_HREF}>{CTA_LABEL}</Link>
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

export default MarketingHeader;
