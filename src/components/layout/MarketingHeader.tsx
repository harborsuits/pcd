import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import wordmark from "@/assets/pcd-wave-wordmark.svg.asset.json";

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
  const items = NAV_ITEMS.filter((i) => i.key !== activePage);

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className={`container mx-auto px-6 flex items-center justify-between gap-4 ${activePage === "home" ? "py-1" : "py-4"}`}>
        <Link
          to="/"
          className="font-serif text-lg md:text-xl font-bold text-foreground shrink-0"
          aria-label="Pleasant Cove Design home"
        >
          {activePage === "home" ? <img src={wordmark.url} alt="Pleasant Cove Design" width="680" height="280" className="w-44 sm:w-52 h-auto" /> : "Pleasant Cove Design"}
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main navigation" className={`hidden ${activePage === "home" ? "xl:flex" : "md:flex"} items-center gap-2 lg:gap-4`}>
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
          <SheetTrigger asChild className={activePage === "home" ? "xl:hidden" : "md:hidden"}>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <nav aria-label="Mobile navigation" className="flex flex-col gap-4 mt-8">
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
