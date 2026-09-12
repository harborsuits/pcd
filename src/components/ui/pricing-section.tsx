"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Sparkles } from "@/components/ui/sparkles";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { Link } from "react-router-dom";
import {
  ALACARTE_SERVICES,
  ALACARTE_NOTE,
  CARE_PLANS,
  CARE_TERMS,
  PROJECT_OFFERINGS,
  PROJECT_PRICING_FACTORS,
  AI_MODEL_INTRO,
  AI_COMPONENTS,
  AI_BILLING_NOTES,
  AlaCarteService,
} from "@/lib/pricingMenu";
import { AlaCarteRequestModal } from "@/components/AlaCarteRequestModal";

export default function PricingSection() {
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
    <section ref={pricingRef} className="relative pt-8 pb-20 overflow-hidden">
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
        {/* Intro */}
        <div className="text-center mb-12">
          <TimelineContent animationNum={0} timelineRef={pricingRef}>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Starting prices reflect the focused scope described below. Your final
              investment depends on the design, content, functionality, integrations, and
              support required. You receive a fixed proposal with clear deliverables
              before work begins.
            </p>
          </TimelineContent>
        </div>

        {/* Project offerings */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {PROJECT_OFFERINGS.map((offering, index) => (
            <TimelineContent
              key={offering.id}
              animationNum={index + 3}
              timelineRef={pricingRef}
              customVariants={revealVariants}
            >
              <Card
                className={cn(
                  "relative h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                )}
              >
                <CardHeader className="pb-4">
                  <div className="space-y-3">
                    <h3 className="font-serif text-xl font-bold">{offering.label}</h3>

                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-accent">
                        {offering.price}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground/70">
                      {offering.quoteOnly
                        ? "Scoped and quoted for your business"
                        : "One-time build — starting price"}
                    </p>

                    <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                      {offering.description}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  <Link
                    to={`/get-demo?service=website&tier=${offering.id}`}
                    className="block mb-6"
                  >
                    <LiquidButton variant="default" size="lg" className="w-full">
                      Discuss your project
                    </LiquidButton>
                  </Link>

                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {offering.quoteOnly ? "Examples:" : "Starting scope:"}
                    </p>
                    <ul className="space-y-2.5">
                      {offering.features?.map((feature, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 text-sm text-muted-foreground"
                        >
                          <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {offering.scopeNote && (
                      <p className="text-xs text-muted-foreground/70 pt-2">
                        {offering.scopeNote}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TimelineContent>
          ))}
        </div>

        {/* What determines project pricing */}
        <TimelineContent animationNum={7} timelineRef={pricingRef}>
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="text-center mb-6">
              <h3 className="font-serif text-2xl font-bold mb-2">
                What determines your price
              </h3>
              <p className="text-muted-foreground">
                We scope the work around what your business needs, then put it in writing.
              </p>
            </div>
            <ul className="space-y-2.5">
              {PROJECT_PRICING_FACTORS.map((factor, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm text-muted-foreground"
                >
                  <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        </TimelineContent>

        {/* Website Care Plans */}
        <TimelineContent animationNum={8} timelineRef={pricingRef}>
          <div className="mt-20 max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h3 className="font-serif text-2xl font-bold mb-2">Website Care</h3>
              <p className="text-muted-foreground">
                Keep your website maintained, checked, and up to date. Month-to-month, no
                project required.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {CARE_PLANS.map((plan) => (
                <Card key={plan.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-foreground mb-1">{plan.label}</h4>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-2xl font-bold text-accent">{plan.price}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {plan.description}
                    </p>
                    <ul className="space-y-2 mb-4">
                      {plan.features.map((feature, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link to={`/get-demo?product=care_plan&tier=${plan.id}`}>
                      <LiquidButton variant="default" size="sm" className="w-full">
                        Request a quote
                      </LiquidButton>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>

            <ul className="mt-6 space-y-2">
              {CARE_TERMS.map((term, i) => (
                <li key={i} className="text-xs text-muted-foreground/70">
                  {term}
                </li>
              ))}
            </ul>
          </div>
        </TimelineContent>

        {/* Focused individual services */}
        <TimelineContent animationNum={9} timelineRef={pricingRef}>
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h3 className="font-serif text-2xl font-bold mb-2">
                Focused Individual Services
              </h3>
              <p className="text-muted-foreground">
                Need one specific thing handled? Pick the piece you actually need right
                now. Each price is a starting point for the scope described.
              </p>
              <p className="text-xs text-muted-foreground/70 mt-2">
                We work with the tools you already use — Toast, Square, Shopify, ChowNow,
                Calendly, Google, and more.
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
                    <p className="text-sm text-muted-foreground mb-3">
                      {service.description}
                    </p>
                    <p className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Request a quote →
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <p className="text-xs text-muted-foreground/70 text-center mt-6 max-w-2xl mx-auto">
              {ALACARTE_NOTE}
            </p>

            <div className="text-center mt-6">
              <Link
                to="/get-demo?service=other"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                Have something else in mind? Let's talk <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </TimelineContent>

        {/* AI receptionist & business automation */}
        <TimelineContent animationNum={10} timelineRef={pricingRef}>
          <div className="mt-20 max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h3 className="font-serif text-2xl font-bold mb-2">
                AI Receptionist & Business Automation
              </h3>
              <p className="text-muted-foreground font-medium mb-2">
                {AI_MODEL_INTRO.heading}
              </p>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                {AI_MODEL_INTRO.body}
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {AI_COMPONENTS.map((component) => (
                <Card key={component.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <h4 className="font-semibold text-foreground mb-1">
                      {component.label}
                    </h4>
                    <p className="text-sm text-accent font-medium mb-2">
                      {component.price}
                    </p>
                    <p className="text-sm text-muted-foreground">{component.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <ul className="mt-6 space-y-2">
              {AI_BILLING_NOTES.map((note, i) => (
                <li key={i} className="text-xs text-muted-foreground/70">
                  {note}
                </li>
              ))}
            </ul>

            <div className="text-center mt-8">
              <Link to="/get-demo?service=ai">
                <LiquidButton size="lg">Request a quote</LiquidButton>
              </Link>
            </div>
          </div>
        </TimelineContent>

        {/* Pilot section */}
        <TimelineContent animationNum={11} timelineRef={pricingRef}>
          <div className="text-center mt-16 max-w-xl mx-auto p-8 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
            <h3 className="font-serif text-2xl font-bold mb-3">7-Day Pilot</h3>
            <p className="text-muted-foreground mb-2">
              A short, defined trial run for selected businesses. The pilot scope and any
              fees are agreed before it starts, so you know exactly what is being tested
              and what it costs.
            </p>
            <p className="text-sm text-muted-foreground/70 italic mb-6">
              Limited availability — select businesses only.
            </p>
            <Link to="/get-demo?product=pilot">
              <LiquidButton size="lg">Request a Pilot</LiquidButton>
            </Link>
          </div>
        </TimelineContent>

        {/* Payment expectations note */}
        <TimelineContent animationNum={12} timelineRef={pricingRef}>
          <div className="text-center mt-8 max-w-2xl mx-auto space-y-4">
            <p className="text-sm text-muted-foreground/80 italic">
              Projects start with a deposit to lock in your build slot. The remainder is
              due when your site is ready to launch.
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">What we don't do:</span> we add coverage,
              responsiveness, and ongoing care — we're not a replacement for staff,
              medical records handling, or enterprise compliance work.
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
