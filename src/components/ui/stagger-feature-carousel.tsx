"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Globe, FolderOpen, CalendarCheck, Zap, Bot, Puzzle, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type FeatureCard = {
  tempId: number;
  title: string;
  subtitle: string;
  bullets: string[];
  icon: LucideIcon;
};

const features: FeatureCard[] = [
  {
    tempId: 0,
    icon: Bot,
    title: "AI Receptionist",
    subtitle: "An AI-powered front door for your business.",
    bullets: [
      "Answers common questions instantly (services, hours, pricing ranges, next steps)",
      "Handles calls and messages when you're unavailable",
      "Collects structured lead info before handing off",
      "Routes high-intent requests appropriately",
      "Reduces interruptions during focused work",
      "Always clearly identified as AI",
    ],
  },
  {
    tempId: 1,
    icon: Globe,
    title: "Websites",
    subtitle: "Your public face — fast, modern, and built to convert.",
    bullets: [
      "Marketing sites that explain what you do in seconds, not paragraphs",
      "Service pages that answer questions before the phone rings",
      "Landing pages for specific offers, locations, or campaigns",
      "Clean, SEO-ready foundations without bloated plugins",
      "Designed to work with your booking and intake flow",
    ],
  },
  {
    tempId: 2,
    icon: FolderOpen,
    title: "Client Portals",
    subtitle: "A private workspace for you and your clients.",
    bullets: [
      "One shared place for messages, files, approvals, and updates",
      "No more email threads, lost attachments, or 'did you see this?'",
      "Clear visibility into what's done and what's next",
      "Built to scale from one project to many",
      "Reduces friction on both sides of the relationship",
    ],
  },
  {
    tempId: 3,
    icon: CalendarCheck,
    title: "Booking & Intake",
    subtitle: "Structured information instead of back-and-forth.",
    bullets: [
      "Smart intake forms that gather the right info upfront",
      "Booking flows that respect your availability and rules",
      "Routing based on service type or request",
      "Seamless handoff into your workflow",
      "You start projects with context — not confusion",
    ],
  },
  {
    tempId: 4,
    icon: Zap,
    title: "Automations",
    subtitle: "Quiet systems that remove friction — not control.",
    bullets: [
      "Automatic confirmations and status updates",
      "File upload reminders when something is missing",
      "Internal notifications so nothing slips through cracks",
      "Fewer manual steps, fewer mistakes",
      "Built to support your work, not replace it",
    ],
  },
  {
    tempId: 5,
    icon: Puzzle,
    title: "Custom & Integrations",
    subtitle: "Built around how you actually work.",
    bullets: [
      "Integrations with tools you already use",
      "Custom workflows for unique processes",
      "Flexible enough to evolve as your business grows",
      "No rigid platforms forcing bad habits",
      "The system adapts to your business — not the other way around",
    ],
  },
];

interface CardProps {
  position: number;
  item: FeatureCard;
  handleMove: (steps: number) => void;
  cardSize: number;
}

const FeatureCardView: React.FC<CardProps> = ({ position, item, handleMove, cardSize }) => {
  const isCenter = position === 0;
  const Icon = item.icon;

  return (
    <div
      key={item.tempId}
      onClick={() => handleMove(position)}
      className={cn(
        "absolute left-1/2 top-1/2 cursor-pointer border-2 p-6 transition-all duration-500 ease-in-out select-none overflow-hidden",
        "rounded-2xl",
        isCenter
          ? "z-10 bg-primary text-primary-foreground border-primary shadow-lg"
          : "z-0 bg-card text-card-foreground border-border hover:border-primary/50"
      )}
      style={{
        width: cardSize,
        height: cardSize,
        clipPath:
          "polygon(40px 0%, calc(100% - 40px) 0%, 100% 40px, 100% 100%, calc(100% - 40px) 100%, 40px 100%, 0 100%, 0 0)",
        transform: `
          translate(-50%, -50%)
          translateX(${(cardSize / 1.5) * position}px)
          translateY(${isCenter ? -50 : position % 2 ? 12 : -12}px)
          rotate(${isCenter ? 0 : position % 2 ? 2 : -2}deg)
        `,
        boxShadow: isCenter
          ? "0px 8px 0px 4px hsl(var(--border))"
          : "0px 0px 0px 0px transparent",
      }}
    >
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-[40px] h-[40px] bg-gradient-to-bl from-primary/20 to-transparent" />

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
          isCenter ? "bg-primary-foreground/20" : "bg-accent/10"
        )}>
          <Icon className={cn("h-4 w-4", isCenter ? "text-primary-foreground" : "text-accent")} />
        </div>
        <h3 className="font-bold text-lg leading-tight">{item.title}</h3>
      </div>

      {/* Subtitle */}
      <p className={cn(
        "text-sm mb-4 leading-relaxed",
        isCenter ? "text-primary-foreground/90" : "text-muted-foreground"
      )}>
        {item.subtitle}
      </p>

      {/* Bullets */}
      <ul className="space-y-2">
        {item.bullets.slice(0, 3).map((b, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
              isCenter ? "bg-primary-foreground/60" : "bg-accent"
            )} />
            <span className={cn(
              "leading-tight",
              isCenter ? "text-primary-foreground/85" : "text-foreground/80"
            )}>
              {b}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

interface StaggerFeatureCarouselProps {
  embedded?: boolean;
  height?: number;
  className?: string;
}

export const StaggerFeatureCarousel: React.FC<StaggerFeatureCarouselProps> = ({
  embedded = false,
  height = 500,
  className,
}) => {
  const [cardSize, setCardSize] = useState(340);
  const [items, setItems] = useState(features);

  const handleMove = (steps: number) => {
    const newList = [...items];
    if (steps > 0) {
      for (let i = steps; i > 0; i--) {
        const item = newList.shift();
        if (!item) return;
        newList.push({ ...item, tempId: Math.random() });
      }
    } else {
      for (let i = steps; i < 0; i++) {
        const item = newList.pop();
        if (!item) return;
        newList.unshift({ ...item, tempId: Math.random() });
      }
    }
    setItems(newList);
  };

  useEffect(() => {
    const updateSize = () => {
      const { matches } = window.matchMedia("(min-width: 640px)");
      setCardSize(embedded ? (matches ? 320 : 280) : (matches ? 340 : 280));
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [embedded]);

  // Embedded mode - just the carousel
  if (embedded) {
    return (
      <div
        className={cn("relative w-full overflow-hidden", className)}
        style={{ height }}
      >
        <div className="relative h-full flex items-center justify-center">
          {items.map((item, index) => {
            const position =
              items.length % 2
                ? index - (items.length + 1) / 2
                : index - items.length / 2;

            return (
              <FeatureCardView
                key={item.tempId}
                position={position}
                item={item}
                handleMove={handleMove}
                cardSize={cardSize}
              />
            );
          })}

          {/* Navigation */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
            <button
              onClick={() => handleMove(-1)}
              className={cn(
                "flex h-10 w-10 items-center justify-center transition-colors rounded-lg",
                "bg-background/80 border border-border hover:bg-primary hover:text-primary-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              aria-label="Previous feature"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleMove(1)}
              className={cn(
                "flex h-10 w-10 items-center justify-center transition-colors rounded-lg",
                "bg-background/80 border border-border hover:bg-primary hover:text-primary-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              aria-label="Next feature"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full section mode
  return (
    <section className={cn("relative w-full py-24 overflow-hidden bg-background", className)}>
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            What we build
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Websites, portals, booking, automations, and AI — packaged as a clean system.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative h-[450px] sm:h-[500px] flex items-center justify-center">
          {items.map((item, index) => {
            const position =
              items.length % 2
                ? index - (items.length + 1) / 2
                : index - items.length / 2;

            return (
              <FeatureCardView
                key={item.tempId}
                position={position}
                item={item}
                handleMove={handleMove}
                cardSize={cardSize}
              />
            );
          })}

          {/* Navigation */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-4">
            <button
              onClick={() => handleMove(-1)}
              className={cn(
                "flex h-14 w-14 items-center justify-center transition-colors rounded-lg",
                "bg-background border-2 border-border hover:bg-primary hover:text-primary-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
              aria-label="Previous feature"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleMove(1)}
              className={cn(
                "flex h-14 w-14 items-center justify-center transition-colors rounded-lg",
                "bg-background border-2 border-border hover:bg-primary hover:text-primary-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
              aria-label="Next feature"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StaggerFeatureCarousel;