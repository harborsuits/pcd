import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type ActivePage =
  | "home"
  | "what-we-build"
  | "pricing"
  | "ai-receptionist"
  | "blog"
  | "midcoast-maine";

interface MarketingHeaderProps {
  activePage?: ActivePage;
}

const NAV_ITEMS: { label: string; href: string; key: ActivePage }[] = [
  { label: "Midcoast Maine", href: "/midcoast-maine", key: "midcoast-maine" },
  { label: "What We Build", href: "/what-we-build", key: "what-we-build" },
  { label: "AI Receptionist", href: "/ai-receptionist", key: "ai-receptionist" },
  { label: "Blog", href: "/blog", key: "blog" },
  { label: "Pricing", href: "/pricing", key: "pricing" },
];

const CTA_HREF = "/get-demo?service=review";
const CTA_LABEL = "Get a Free Review";

export function MarketingHeader({ activePage }: MarketingHeaderProps) {
  const [open, setOpen] = useState(false);
  const items = NAV_ITEMS.filter((i) => i.key !== activePage);

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="font-serif text-lg md:text-xl font-bold tracking-tight text-foreground whitespace-nowrap"
        >
          Pleasant Cove Design
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2 lg:gap-4">
          {items.map((item) => (
            <Button
              key={item.key}
              asChild
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <Link to={item.href}>{item.label}</Link>
            </Button>
          ))}
          <Button asChild size="sm" className="whitespace-nowrap">
            <Link to={CTA_HREF}>{CTA_LABEL}</Link>
          </Button>
        </nav>

        {/* Mobile nav */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <nav className="flex flex-col gap-4 mt-8">
              {items.map((item) => (
                <Link
                  key={item.key}
                  to={item.href}
                  className="text-lg font-medium hover:text-accent transition-colors"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
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
