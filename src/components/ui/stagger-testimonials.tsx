"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const testimonials = [
  {
    tempId: 0,
    testimonial:
      "We stopped missing calls and our booking process became way smoother in the first week.",
    by: "Owner, Local Service Business",
    imgSrc:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80",
  },
  {
    tempId: 1,
    testimonial:
      "The website finally explains what we do clearly — people come in already qualified.",
    by: "Operator, Home Services",
    imgSrc:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=300&q=80",
  },
  {
    tempId: 2,
    testimonial:
      "Having one place for files + approvals eliminated the back-and-forth completely.",
    by: "Manager, Small Team",
    imgSrc:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
  },
  {
    tempId: 3,
    testimonial:
      "It feels like we added a receptionist and an ops system without adding overhead.",
    by: "Owner, Appointment-Based Business",
    imgSrc:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=300&q=80",
  },
  {
    tempId: 4,
    testimonial:
      "We look more professional instantly — and people trust us more on the first call.",
    by: "Founder, Local Business",
    imgSrc:
      "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=300&q=80",
  },
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
        "absolute left-1/2 top-1/2 cursor-pointer border p-8 transition-all duration-500 ease-in-out select-none",
        "rounded-2xl backdrop-blur-xl",
        isCenter
          ? "z-10 bg-teal-500/10 text-white border-teal-300/40 shadow-[0_0_80px_rgba(45,212,191,0.25)]"
          : "z-0 bg-white/5 text-white/85 border-white/10 hover:border-teal-300/25"
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
          ? "0px 10px 0px 4px rgba(255,255,255,0.06)"
          : "0px 0px 0px 0px transparent",
      }}
    >
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-[50px] h-[50px] bg-gradient-to-bl from-teal-400/20 to-transparent" />

      {/* Avatar */}
      <img
        src={testimonial.imgSrc}
        alt={testimonial.by}
        className="w-14 h-14 rounded-full object-cover border-2 border-teal-300/30 mb-4"
      />

      {/* Quote */}
      <p className="text-base leading-relaxed font-medium mb-6">
        "{testimonial.testimonial}"
      </p>

      {/* Attribution */}
      <div className="mt-auto">
        <span className="text-sm text-teal-200/80 font-medium">
          — {testimonial.by}
        </span>
      </div>
    </div>
  );
};

export const StaggerTestimonials: React.FC = () => {
  const [cardSize, setCardSize] = useState(365);
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
      setCardSize(matches ? 365 : 290);
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <section className="relative w-full py-24 overflow-hidden bg-black">
      {/* Subtle PCD grid glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(45,212,191,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(45,212,191,0.3) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            What clients say
          </h2>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
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
                "flex h-12 w-12 items-center justify-center transition-colors",
                "rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white hover:border-teal-300/25",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              )}
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleMove(1)}
              className={cn(
                "flex h-12 w-12 items-center justify-center transition-colors",
                "rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white hover:border-teal-300/25",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
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
