"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const testimonials = [
  {
    tempId: 0,
    testimonial: "We stopped missing calls and our booking process became way smoother in the first week.",
    by: "Alex, Owner at ServicePro",
    imgSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80"
  },
  {
    tempId: 1,
    testimonial: "The website finally explains what we do clearly — people come in already qualified.",
    by: "Dan, Operator at HomeWorks",
    imgSrc: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80"
  },
  {
    tempId: 2,
    testimonial: "Having one place for files + approvals eliminated the back-and-forth completely.",
    by: "Stephanie, Manager at TeamSync",
    imgSrc: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80"
  },
  {
    tempId: 3,
    testimonial: "It feels like we added a receptionist and an ops system without adding overhead.",
    by: "Marie, Owner at BookingFlow",
    imgSrc: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80"
  },
  {
    tempId: 4,
    testimonial: "We look more professional instantly — and people trust us more on the first call.",
    by: "Andre, Founder at LocalBiz",
    imgSrc: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80"
  },
  {
    tempId: 5,
    testimonial: "SO SO SO HAPPY WE FOUND YOU GUYS!!!! I'd bet you've saved me 100 hours so far.",
    by: "Jeremy, Manager at TimeWise",
    imgSrc: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=300&q=80"
  },
  {
    tempId: 6,
    testimonial: "Took some convincing, but now that we're set up, we're never going back.",
    by: "Pam, Director at BrandBuilders",
    imgSrc: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
  },
  {
    tempId: 7,
    testimonial: "The ROI is EASILY 100X for us. Worth every penny.",
    by: "Daniel, Analyst at GrowthCo",
    imgSrc: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80"
  },
  {
    tempId: 8,
    testimonial: "It's just the best. Period.",
    by: "Fernando, Designer at UserFirst",
    imgSrc: "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=300&q=80"
  },
  {
    tempId: 9,
    testimonial: "I switched and never looked back.",
    by: "Andy, Engineer at CloudMasters",
    imgSrc: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80"
  }
];

interface TestimonialCardProps {
  position: number;
  testimonial: (typeof testimonials)[0];
  handleMove: (steps: number) => void;
  cardSize: number;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({
  position,
  testimonial,
  handleMove,
  cardSize,
}) => {
  const isCenter = position === 0;

  return (
    <div
      key={testimonial.tempId}
      onClick={() => handleMove(position)}
      className={cn(
        "absolute left-1/2 top-1/2 cursor-pointer border-2 p-8 transition-all duration-500 ease-in-out select-none",
        "rounded-2xl backdrop-blur-xl",
        isCenter
          ? "z-10 bg-primary text-primary-foreground border-primary shadow-lg"
          : "z-0 bg-card text-card-foreground border-border hover:border-primary/50"
      )}
      style={{
        width: cardSize,
        height: cardSize,
        clipPath:
          "polygon(50px 0%, calc(100% - 50px) 0%, 100% 50px, 100% 100%, calc(100% - 50px) 100%, 50px 100%, 0 100%, 0 0)",
        transform: `
          translate(-50%, -50%)
          translateX(${(cardSize / 1.5) * position}px)
          translateY(${isCenter ? -65 : position % 2 ? 15 : -15}px)
          rotate(${isCenter ? 0 : position % 2 ? 2.5 : -2.5}deg)
        `,
        boxShadow: isCenter
          ? "0px 8px 0px 4px hsl(var(--border))"
          : "0px 0px 0px 0px transparent",
      }}
    >
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-[50px] h-[50px] bg-gradient-to-bl from-primary/20 to-transparent" />

      {/* Avatar */}
      <img
        src={testimonial.imgSrc}
        alt={testimonial.by}
        className="w-14 h-14 rounded-full object-cover border-2 border-primary/30 mb-4"
      />

      {/* Quote */}
      <p className="text-base leading-relaxed font-medium mb-6">
        "{testimonial.testimonial}"
      </p>

      {/* Attribution */}
      <div className="mt-auto">
        <span className="text-sm opacity-80 font-medium">
          - {testimonial.by}
        </span>
      </div>
    </div>
  );
};

interface StaggerTestimonialsProps {
  embedded?: boolean;
  height?: number;
  className?: string;
}

export const StaggerTestimonials: React.FC<StaggerTestimonialsProps> = ({
  embedded = false,
  height = 500,
  className,
}) => {
  const [cardSize, setCardSize] = useState(embedded ? 300 : 365);
  const [testimonialsList, setTestimonialsList] = useState(testimonials);

  const handleMove = (steps: number) => {
    const newList = [...testimonialsList];
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
    setTestimonialsList(newList);
  };

  useEffect(() => {
    const updateSize = () => {
      const { matches } = window.matchMedia("(min-width: 640px)");
      setCardSize(embedded ? (matches ? 300 : 260) : (matches ? 365 : 290));
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
        {/* Carousel */}
        <div className="relative h-full flex items-center justify-center">
          {testimonialsList.map((t, index) => {
            const position =
              testimonialsList.length % 2
                ? index - (testimonialsList.length + 1) / 2
                : index - testimonialsList.length / 2;

            return (
              <TestimonialCard
                key={t.tempId}
                position={position}
                testimonial={t}
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
              aria-label="Previous testimonial"
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
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full section mode (default)
  return (
    <section className="relative w-full py-24 overflow-hidden bg-background">
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            What clients say
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Real outcomes from websites, booking systems, and the AI Front Door.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative h-[450px] sm:h-[500px] flex items-center justify-center">
          {testimonialsList.map((t, index) => {
            const position =
              testimonialsList.length % 2
                ? index - (testimonialsList.length + 1) / 2
                : index - testimonialsList.length / 2;

            return (
              <TestimonialCard
                key={t.tempId}
                position={position}
                testimonial={t}
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
                "flex h-14 w-14 items-center justify-center text-2xl transition-colors",
                "bg-background border-2 border-border hover:bg-primary hover:text-primary-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleMove(1)}
              className={cn(
                "flex h-14 w-14 items-center justify-center text-2xl transition-colors",
                "bg-background border-2 border-border hover:bg-primary hover:text-primary-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StaggerTestimonials;
