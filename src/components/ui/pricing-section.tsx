"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Sparkles } from "@/components/ui/sparkles";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { Link } from "react-router-dom";
import { ALACARTE_SERVICES, CARE_PLANS, AlaCarteService } from "@/lib/pricingMenu";
import { AlaCarteRequestModal } from "@/components/AlaCarteRequestModal";

type Period = "monthly" | "yearly";

const plans = [
  {
    name: "PCD Starter System",
    description:
      "Essential website + hosting + AI Front Door. The clean baseline for owner-operators.",
    monthlyPrice: 575,
    yearlyPrice: 6100,
    buildRange: "$750–$1,250",
    badge: "Most common",
    cta: "Start with Starter",
    popular: false,
    includes: [
      "Essential website build (1–5 pages)",
      "Mobile-friendly, fast loading",
      "Click-to-call + contact forms",
      "Google Maps embed + basic SEO setup",
      "Hosting + maintenance (backups, uptime, minor updates)",
      "AI Front Door (answers calls, captures info, FAQs, after-hours)",
      "Call summaries + emergency routing",
    ],
  },
  {
    name: "PCD Growth System",
    description:
      "Booking + stronger lead capture + CRM basics. Built for businesses that live on appointments.",
    monthlyPrice: 875,
    yearlyPrice: 9300,
    buildRange: "$1,500–$2,500",
    badge: "Best value",
    cta: "Upgrade to Growth",
    popular: true,
    includes: [
      "Everything in Starter, plus:",
      "Conversion-focused layout",
      "Booking or intake integration",
      "Lead capture flows + light animations",
      "AI Front Door + Booking (single or multi-staff scheduling via your booking system)",
      "Confirmation texts/emails",
      "CRM basics (lead tracking + tagging)",
    ],
  },
  {
    name: "PCD Full Operations",
    description:
      "Premium site + AI + booking + CRM context + managed updates. The full system.",
    monthlyPrice: 1100,
    yearlyPrice: 11800,
    buildRange: "$2,500–$4,000+",
    badge: "Highest impact",
    cta: "Go Full Ops",
    popular: false,
    includes: [
      "Everything in Growth, plus:",
      "Advanced interactions + custom user flows",
      "CRM pipelines + dashboards",
      "AI + Booking + CRM Context (logging, tagging, follow-ups)",
      "Priority routing + reporting",
      "Managed updates & tuning (pricing, seasonal messaging)",
      "Priority support for digital operations",
    ],
    note: "CRM context focuses on intake, tagging, routing, and follow-ups — not enterprise CRM replacement.",
  },
];

function PricingSwitch({
  onSwitch,
}: {
  onSwitch: (value: Period) => void;
}) {
  const [selected, setSelected] = useState<Period>("monthly");

  const handleSwitch = (value: Period) => {
    setSelected(value);
    onSwitch(value);
  };

  return (
    <div className="mx-auto mb-10 flex w-fit items-center gap-2 rounded-full bg-primary/10 p-1.5 backdrop-blur-sm">
      <div className="relative flex">
        <button
          type="button"
          onClick={() => handleSwitch("monthly")}
          className={cn(
            "relative z-10 h-10 rounded-full px-4 sm:px-6 py-2 text-sm font-medium transition-colors",
            selected === "monthly" ? "text-primary-foreground" : "text-muted-foreground"
          )}
        >
          {selected === "monthly" && (
            <motion.span
              layoutId="pricing-pill"
              className="absolute inset-0 rounded-full bg-primary"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">Monthly</span>
        </button>
        <button
          type="button"
          onClick={() => handleSwitch("yearly")}
          className={cn(
            "relative z-10 h-10 rounded-full px-4 sm:px-6 py-2 text-sm font-medium transition-colors",
            selected === "yearly" ? "text-primary-foreground" : "text-muted-foreground"
          )}
        >
          {selected === "yearly" && (
            <motion.span
              layoutId="pricing-pill"
              className="absolute inset-0 rounded-full bg-primary"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            Yearly <span className="text-xs opacity-80">(save)</span>
          </span>
        </button>
      </div>
    </div>
  );
}

export default function PricingSection() {
  const [period, setPeriod] = useState<Period>("monthly");
  const pricingRef = useRef<HTMLDivElement>(null);
  
  // À la carte request modal state
  const [selectedService, setSelectedService] = useState<AlaCarteService | null>(null);

  const revealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: { delay: i * 0.18, duration: 0.5 },
    }),
    hidden: {
      filter: "blur(10px)",
      y: -18,
      opacity: 0,
    },
  };

  return (
    <section
      ref={pricingRef}
      className="relative pt-8 pb-20 overflow-hidden"
    >
      {/* Subtle sparkles only - no grid or glow to avoid color mismatch */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <Sparkles
          className="absolute inset-0"
          color="hsl(var(--accent))"
          size={1.2}
          density={60}
          speed={0.3}
          opacity={0.25}
        />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Pricing Controls */}
        <div className="text-center mb-12">
          <TimelineContent animationNum={0} timelineRef={pricingRef}>
            <PricingSwitch onSwitch={setPeriod} />
            <p className="text-xs text-muted-foreground/70 -mt-6 mb-4">
              Yearly pricing is an optional prepaid discount (available on request).
            </p>
            <p className="text-sm text-muted-foreground">
              Bundles include a one-time website build plus ongoing monthly services.
            </p>
          </TimelineContent>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <TimelineContent
              key={plan.name}
              animationNum={index + 3}
              timelineRef={pricingRef}
              customVariants={revealVariants}
            >
              <Card
                className={cn(
                  "relative h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
                  plan.popular && "border-accent shadow-lg ring-2 ring-accent/20"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-semibold px-4 py-1 rounded-b-lg">
                    {plan.badge}
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif text-xl font-bold">{plan.name}</h3>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-accent">$</span>
                      <NumberFlow
                        value={period === "yearly" ? plan.yearlyPrice : plan.monthlyPrice}
                        className="text-4xl font-bold text-accent"
                        transformTiming={{ duration: 400, easing: "ease-out" }}
                      />
                      <span className="text-muted-foreground text-sm">
                        /{period === "yearly" ? "year" : "month"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground/70">
                      Monthly services{period === "yearly" ? " (prepaid)" : ""}
                    </p>
                    <p className="text-xs text-accent/80 font-medium">
                      + one-time build: {plan.buildRange}
                    </p>

                    <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                      {plan.description}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  <Link 
                    to={`/get-demo?service=both&tier=${index === 0 ? 'starter' : index === 1 ? 'growth' : 'full_ops'}`} 
                    className="block mb-6"
                  >
                    <LiquidButton 
                      variant={plan.popular ? "dark" : "default"} 
                      size="lg" 
                      className="w-full"
                    >
                      {plan.cta}
                    </LiquidButton>
                  </Link>

                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Includes:
                    </p>
                    <ul className="space-y-2.5">
                      {plan.includes.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TimelineContent>
          ))}
        </div>

        {/* Website Care Plans */}
        <TimelineContent animationNum={7} timelineRef={pricingRef}>
          <div className="mt-20 max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h3 className="font-serif text-2xl font-bold mb-2">Website Care Plans</h3>
              <p className="text-muted-foreground">
                Ongoing maintenance, updates, and oversight — so your site doesn't rot.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-6">
              {CARE_PLANS.map((plan, index) => (
                <Card key={plan.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-foreground mb-1">{plan.label}</h4>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-2xl font-bold text-accent">$</span>
                      <NumberFlow
                        value={period === "yearly" ? plan.yearlyPrice : plan.monthlyPrice}
                        className="text-2xl font-bold text-accent"
                        transformTiming={{ duration: 400, easing: "ease-out" }}
                      />
                      <span className="text-muted-foreground text-sm">
                        /{period === "yearly" ? "year" : "month"}
                      </span>
                    </div>
                    {period === "yearly" && (
                      <p className="text-xs text-accent/70 mb-2">
                        Save ${(plan.monthlyPrice * 12) - plan.yearlyPrice}/year
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                    <ul className="space-y-2 mb-4">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link to={`/get-demo?product=care_plan&tier=${index === 0 ? 'care_starter' : 'care_growth'}`}>
                      <LiquidButton variant="default" size="sm" className="w-full">
                        Get Started
                      </LiquidButton>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TimelineContent>

        {/* À la carte section */}
        <TimelineContent animationNum={8} timelineRef={pricingRef}>
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h3 className="font-serif text-2xl font-bold mb-2">À La Carte Services</h3>
              <p className="text-muted-foreground">
                Not ready for a bundle? Pick individual services that fit your needs.
              </p>
              <p className="text-xs text-muted-foreground/70 mt-2">
                Most services are built & managed — we don't just build and disappear.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ALACARTE_SERVICES.map((service) => (
                <Card 
                  key={service.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => setSelectedService(service)}
                >
                  <CardContent className="p-5">
                    <h4 className="font-semibold text-foreground mb-1">{service.label}</h4>
                    <p className="text-sm text-accent font-medium mb-2">{service.price}</p>
                    <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
                    <p className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Request this service →
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center mt-6">
              <Link to="/get-demo" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                Have something else in mind? Let's talk <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </TimelineContent>

        {/* Pilot section */}
        <TimelineContent animationNum={9} timelineRef={pricingRef}>
          <div className="text-center mt-16 max-w-xl mx-auto p-8 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
            <h3 className="font-serif text-2xl font-bold mb-3">7-Day Pilot</h3>
            <p className="text-muted-foreground mb-2">
              Full functionality on real call traffic. Clear conversion expectations discussed upfront.
            </p>
            <p className="text-sm text-muted-foreground/70 italic mb-6">
              Limited availability — select businesses only.
            </p>
            <Link to="/get-demo?product=pilot">
              <LiquidButton size="lg">
                Request a Pilot
              </LiquidButton>
            </Link>
          </div>
        </TimelineContent>

        {/* Boundaries note */}
        <TimelineContent animationNum={10} timelineRef={pricingRef}>
          <div className="text-center mt-8 max-w-2xl mx-auto">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Important Boundaries:</span> PCD provides coverage, responsiveness, and operational relief — 
              not a replacement for employees, medical records handling, or enterprise compliance.
            </p>
          </div>
        </TimelineContent>
      </div>

      {/* À la carte request modal */}
      <AlaCarteRequestModal
        open={!!selectedService}
        onOpenChange={(open) => !open && setSelectedService(null)}
        serviceKey={selectedService?.id ?? ""}
        serviceLabel={selectedService?.label ?? ""}
      />
    </section>
  );
}
