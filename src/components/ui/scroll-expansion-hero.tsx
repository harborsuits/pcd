"use client";

import * as React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScrollExpandMediaProps {
  mediaType?: "video" | "image";
  mediaSrc: string;
  bgImageSrc?: string;
  title?: string;
  date?: string;
  scrollToExpand?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function ScrollExpandMedia({
  mediaType = "image",
  mediaSrc,
  bgImageSrc,
  title = "The Golden Fork",
  date = "EST. 2015",
  scrollToExpand = "Scroll to explore",
  children,
  className,
}: ScrollExpandMediaProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    // Increases 0 → 1 as you scroll DOWN through the container
    offset: ["start start", "end start"],
  });

  // =============================
  // Phase timing
  // A: 0 → 0.55 expand, content hidden
  // B: 0.55 → 0.75 content fades in
  // C: 0.75 → 1 settle
  // =============================

  // Subtle scale settle (NO aggressive zoom)
  const mediaScale = useTransform(scrollYProgress, [0, 0.55], [0.92, 1]);
  const mediaY = useTransform(scrollYProgress, [0, 0.55], [90, 0]);
  const mediaRadius = useTransform(scrollYProgress, [0, 0.55], [32, 0]);

  // Overlay stays STRONG early (0.75), relaxes to readable level (0.35) - never too light
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.55, 1], [0.75, 0.55, 0.35]);

  // Title fades out during expansion
  const titleOpacity = useTransform(scrollYProgress, [0, 0.25, 0.50], [1, 0.9, 0]);
  const titleY = useTransform(scrollYProgress, [0, 0.50], [0, -60]);

  // Content appears earlier at ~55% (not 62%)
  const contentOpacity = useTransform(scrollYProgress, [0.55, 0.75], [0, 1]);
  const contentY = useTransform(scrollYProgress, [0.55, 0.75], [40, 0]);

  return (
    <section
      ref={containerRef}
      className={cn("relative min-h-[260vh] overflow-x-hidden", className)}
    >
      {/* Fixed background - stays at FULL OPACITY, never fades out */}
      {bgImageSrc && (
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${bgImageSrc})` }}
          />
          {/* Stronger overlay for readability */}
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}

      {/* Sticky hero viewport */}
      <div className="sticky top-0 h-screen w-full">
        {/* Title layer */}
        <motion.div
          style={{ opacity: titleOpacity, y: titleY }}
          className="absolute left-0 right-0 top-24 z-30 mx-auto max-w-5xl px-6 flex flex-col items-center justify-center text-center pt-16"
        >
          <p className="text-amber-400 font-medium mb-4 tracking-widest uppercase text-sm drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            {date}
          </p>
          <h1
            className="font-serif text-5xl md:text-7xl lg:text-8xl text-stone-100"
            style={{ textShadow: "0 4px 30px rgba(0,0,0,0.8), 0 2px 10px rgba(0,0,0,0.6)" }}
          >
            {title}
          </h1>
          <p className="mt-8 text-stone-100 text-sm animate-bounce drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            {scrollToExpand}
          </p>
        </motion.div>

        {/* Media block (starts lower, expands smoothly) */}
        <motion.div
          style={{ scale: mediaScale, y: mediaY, borderRadius: mediaRadius }}
          className="absolute inset-x-6 md:inset-x-12 lg:inset-x-16 bottom-10 top-32 z-10 overflow-hidden"
        >
          {mediaType === "video" ? (
            <video
              className="h-full w-full object-cover"
              src={mediaSrc}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img className="h-full w-full object-cover" src={mediaSrc} alt="Hero media" />
          )}

          {/* Overlay that stays stronger - prevents "washed out" look */}
          <motion.div
            style={{ opacity: overlayOpacity }}
            className="absolute inset-0 bg-black"
          />
        </motion.div>
      </div>

      {/* Content handoff with GLASS BACKING for readability */}
      <motion.div
        style={{ opacity: contentOpacity, y: contentY }}
        className="relative z-20 mx-auto max-w-6xl px-6 pt-[110vh]"
      >
        {/* Glass panel wrapper for content readability */}
        <div className="rounded-3xl bg-black/35 backdrop-blur-md border border-white/10 p-6 md:p-10">
          {children}
        </div>
      </motion.div>
    </section>
  );
}
