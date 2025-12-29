"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Sparkles } from "@/components/ui/sparkles";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { Check } from "lucide-react";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { Link } from "react-router-dom";

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
      className="relative py-20 overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background"
    >
      {/* Subtle grid + sparkles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        <Sparkles
          className="absolute inset-0"
          color="hsl(var(--accent))"
          size={1.2}
          density={100}
          speed={0.3}
          opacity={0.4}
        />
      </div>

      {/* Accent glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-accent/20 blur-3xl opacity-60" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <TimelineContent animationNum={0} timelineRef={pricingRef}>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              <VerticalCutReveal splitBy="words" staggerDuration={0.06}>
                Pricing built for real businesses
              </VerticalCutReveal>
            </h2>
          </TimelineContent>

          <TimelineContent animationNum={1} timelineRef={pricingRef}>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              Choose a bundle that matches your call volume, booking needs, and how
              much you want automated.
            </p>
          </TimelineContent>

          <TimelineContent animationNum={2} timelineRef={pricingRef}>
            <p className="text-sm text-muted-foreground mb-6">
              Bundles include a one-time website build plus ongoing monthly services.
            </p>
            <PricingSwitch onSwitch={setPeriod} />
            <p className="text-xs text-muted-foreground/70 -mt-6">
              Yearly pricing is an optional prepaid discount (available on request).
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
                  <Link to="/get-demo" className="block mb-6">
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

        {/* Pilot section */}
        <TimelineContent animationNum={7} timelineRef={pricingRef}>
          <div className="text-center mt-16 max-w-xl mx-auto p-6 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
            <h3 className="font-serif text-xl font-bold mb-2">7-Day Pilot</h3>
            <p className="text-sm text-muted-foreground mb-1">
              Full functionality on real call traffic. Limited availability.
            </p>
            <p className="text-xs text-muted-foreground/70">
              Select businesses only.
            </p>
          </div>
        </TimelineContent>

        {/* Boundaries note */}
        <TimelineContent animationNum={8} timelineRef={pricingRef}>
          <div className="text-center mt-8 max-w-2xl mx-auto">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Important Boundaries:</span> PCD provides coverage, responsiveness, and operational relief — 
              not a replacement for employees, medical records handling, or enterprise compliance.
            </p>
          </div>
        </TimelineContent>
      </div>
    </section>
  );
}
