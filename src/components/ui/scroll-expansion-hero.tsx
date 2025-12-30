"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
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
    offset: ["start start", "end end"],
  });

  // Debug: verify progress increases when scrolling down (remove after confirming)
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    console.log("scrollYProgress", v);
  });

  // ============================================
  // PHASE A (0% → 65%): Hero expands, content HIDDEN
  // ============================================
  const mediaScale = useTransform(scrollYProgress, [0, 0.65], [0.45, 1]);
  const mediaBorderRadius = useTransform(scrollYProgress, [0, 0.65], [40, 0]);
  const mediaOpacity = useTransform(scrollYProgress, [0, 0.4, 0.65], [0.5, 0.8, 1]);
  const mediaY = useTransform(scrollYProgress, [0, 0.65], [140, 0]); // Start 140px lower
  
  // Title fades out during Phase A
  const titleOpacity = useTransform(scrollYProgress, [0, 0.25, 0.45], [1, 0.5, 0]);
  const titleY = useTransform(scrollYProgress, [0, 0.45], [0, -100]);
  const titleScale = useTransform(scrollYProgress, [0, 0.45], [1, 0.9]);
  
  // ============================================
  // PHASE B (65% → 80%): Content fades in
  // ============================================
  const contentOpacity = useTransform(scrollYProgress, [0.65, 0.80], [0, 1]);
  const contentY = useTransform(scrollYProgress, [0.65, 0.80], [48, 0]);

  // ============================================
  // Overlay: STRONG during Phase A (0.62), fades in B+C
  // ============================================
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.65, 1], [0.62, 0.40, 0.18]);

  // Background parallax
  const bgY = useTransform(scrollYProgress, [0, 1], [0, -50]);

  return (
    <div
      ref={containerRef}
      className={cn(
        // Taller container so Phase A has time to complete
        "relative min-h-[260vh] md:min-h-[240vh] overflow-x-hidden",
        className
      )}
    >
      {/* Background image - z-0 */}
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

      {/* Fixed hero section - h-screen */}
      <div className="sticky top-0 h-screen overflow-visible">
        {/* Title overlay - z-30 */}
        <motion.div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none px-4 pt-16"
          style={{ opacity: titleOpacity, y: titleY, scale: titleScale }}
        >
          <p className="text-amber-400 font-medium mb-4 tracking-widest uppercase text-sm drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            {date}
          </p>
          <h1 
            className="font-serif text-5xl md:text-7xl lg:text-8xl text-center text-stone-100"
            style={{ textShadow: "0 4px 30px rgba(0,0,0,0.8), 0 2px 10px rgba(0,0,0,0.6)" }}
          >
            {title}
          </h1>
          <p className="mt-8 text-stone-100 text-sm animate-bounce drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            {scrollToExpand}
          </p>
        </motion.div>

        {/* Expanding media container - z-10, starts very low with large inset */}
        <motion.div
          className="absolute inset-10 md:inset-20 lg:inset-24 z-10 overflow-hidden"
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
          {/* Overlay - z-20, STRONG during expansion */}
          <motion.div 
            className="absolute inset-0 z-20 bg-gradient-to-t from-stone-950 via-stone-950/50 to-stone-950/30"
            style={{ opacity: overlayOpacity }}
          />
        </motion.div>
      </div>

      {/* Content area - z-20, fades in during Phase B (65-80%) */}
      <motion.div
        className="relative z-20 -mt-[20vh]"
        style={{ opacity: contentOpacity, y: contentY }}
      >
        <div className="min-h-screen">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
