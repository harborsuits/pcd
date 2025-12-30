"use client";

import React, { useRef, useEffect, useState } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // ============================================
  // PHASE A (0% → 55%): Hero expands, content hidden
  // ============================================
  const mediaScale = useTransform(scrollYProgress, [0, 0.55], [0.5, 1]);
  const mediaBorderRadius = useTransform(scrollYProgress, [0, 0.55], [36, 0]);
  const mediaOpacity = useTransform(scrollYProgress, [0, 0.35, 0.55], [0.6, 0.85, 1]);
  const mediaY = useTransform(scrollYProgress, [0, 0.55], [100, 0]); // Start 100px lower
  
  // Title fades out during Phase A
  const titleOpacity = useTransform(scrollYProgress, [0, 0.2, 0.35], [1, 0.6, 0]);
  const titleY = useTransform(scrollYProgress, [0, 0.35], [0, -80]);
  const titleScale = useTransform(scrollYProgress, [0, 0.35], [1, 0.92]);
  
  // ============================================
  // PHASE B (55% → 70%): Content fades in, overlay begins fading
  // ============================================
  const contentOpacity = useTransform(scrollYProgress, [0.55, 0.70], [0, 1]);
  const contentY = useTransform(scrollYProgress, [0.55, 0.70], [40, 0]);

  // ============================================
  // Overlay: Stronger during Phase A (0.45), fades during B+C
  // ============================================
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.55, 1.0], [0.45, 0.35, 0.15]);

  // Background parallax
  const bgY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative min-h-[200vh] overflow-x-hidden",
        className
      )}
    >
      {/* Background image with parallax - z-0 */}
      {bgImageSrc && (
        <motion.div
          className="fixed inset-0 z-0"
          style={{ y: bgY }}
        >
          <img
            src={bgImageSrc}
            alt="Background"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-950/30 via-stone-950/40 to-stone-950/50" />
        </motion.div>
      )}

      {/* Fixed hero section - increased top padding */}
      <div className="sticky top-0 h-screen overflow-visible pt-24 md:pt-28">
        {/* Title overlay - z-30 always on top */}
        <motion.div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none px-4"
          style={{ opacity: titleOpacity, y: titleY, scale: titleScale }}
        >
          <p className="text-amber-400 font-medium mb-4 tracking-widest uppercase text-sm drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            {date}
          </p>
          <h1 
            className="font-serif text-5xl md:text-7xl lg:text-8xl text-center text-stone-100"
            style={{ textShadow: "0 4px 24px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5)" }}
          >
            {title}
          </h1>
          <p className="mt-8 text-stone-200 text-sm animate-bounce drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            {scrollToExpand}
          </p>
        </motion.div>

        {/* Expanding media container - starts lower with larger inset */}
        <motion.div
          className="absolute inset-10 md:inset-16 lg:inset-20 top-14 md:top-16 z-10 overflow-hidden"
          style={{
            scale: mediaScale,
            borderRadius: mediaBorderRadius,
            opacity: mediaOpacity,
            y: mediaY,
          }}
        >
          {mediaType === "video" ? (
            <video
              src={mediaSrc}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={mediaSrc}
              alt="Hero media"
              className="w-full h-full object-cover"
            />
          )}
          {/* Hero overlay - controlled opacity for readability */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/30 to-stone-950/10"
            style={{ opacity: overlayOpacity }}
          />
        </motion.div>
      </div>

      {/* Content area - fades in during Phase B (55-70%) */}
      <motion.div
        className="relative z-20 -mt-[25vh]"
        style={{ opacity: contentOpacity, y: contentY }}
      >
        {/* Bridge gradient for smooth transition */}
        <div className="h-16 bg-gradient-to-b from-transparent via-stone-950/10 to-transparent" />
        
        <div className="min-h-screen">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
