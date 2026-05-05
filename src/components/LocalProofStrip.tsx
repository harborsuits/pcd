import { Link } from "react-router-dom";
import { GlowCard } from "@/components/ui/spotlight-card";
import { Hammer, UtensilsCrossed, Scissors } from "lucide-react";

const items = [
  {
    icon: Hammer,
    trade: "Roofer",
    fix: "Clear quote button + mobile fix",
    href: "/demos/roofer",
  },
  {
    icon: UtensilsCrossed,
    trade: "Restaurant",
    fix: "Fast menu + reservations on mobile",
    href: "/demos/restaurant",
  },
  {
    icon: Scissors,
    trade: "Salon",
    fix: "Online booking right on the homepage",
    href: "/demos/salon",
  },
];

export function LocalProofStrip() {
  return (
    <section className="py-12 md:py-16 border-t border-border">
      <div className="container mx-auto px-6">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-wider text-accent font-semibold mb-2">
            Built for Midcoast Maine
          </p>
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2">
            Sample layouts by trade
          </h2>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Example designs showing how a clean, mobile-friendly site looks for common Midcoast trades.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {items.map((it) => (
            <Link key={it.trade} to={it.href}>
              <GlowCard
                customSize
                glowColor="emerald"
                className="bg-card/80 p-5 h-full hover:bg-card transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <it.icon className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground leading-tight">{it.trade}</h3>
                    <p className="text-xs text-muted-foreground">Sample design</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{it.fix}</p>
                <p className="text-xs text-accent mt-3">View demo →</p>
              </GlowCard>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
