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

  // Media expansion transforms - start much lower and smaller
  const mediaScale = useTransform(scrollYProgress, [0, 0.35], [0.5, 1]);
  const mediaBorderRadius = useTransform(scrollYProgress, [0, 0.35], [32, 0]);
  const mediaOpacity = useTransform(scrollYProgress, [0, 0.2, 0.35], [0.5, 0.8, 1]);
  const mediaY = useTransform(scrollYProgress, [0, 0.35], [60, 0]);
  
  // Title transforms - smoother fade
  const titleOpacity = useTransform(scrollYProgress, [0, 0.12, 0.2], [1, 0.8, 0]);
  const titleY = useTransform(scrollYProgress, [0, 0.2], [0, -60]);
  const titleScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  
  // Content reveal - smoother transition
  const contentOpacity = useTransform(scrollYProgress, [0.28, 0.45], [0, 1]);
  const contentY = useTransform(scrollYProgress, [0.28, 0.45], [40, 0]);

  // Background parallax + fade
  const bgY = useTransform(scrollYProgress, [0, 1], [0, -80]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative min-h-[250vh] overflow-x-hidden",
        className
      )}
    >
      {/* Background image with parallax - covers entire scroll area */}
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
          <div className="absolute inset-0 bg-gradient-to-b from-stone-950/40 via-stone-950/50 to-stone-950/60" />
        </motion.div>
      )}

      {/* Fixed hero section with more top padding */}
      <div className="sticky top-0 h-screen overflow-hidden pt-20 md:pt-24">
        {/* Title overlay - highest z-index for readability */}
        <motion.div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none px-4"
          style={{ opacity: titleOpacity, y: titleY, scale: titleScale }}
        >
          <p className="text-amber-400 font-medium mb-4 tracking-widest uppercase text-sm drop-shadow-lg">
            {date}
          </p>
          <h1 
            className="font-serif text-5xl md:text-7xl lg:text-8xl text-center text-stone-100 drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
            style={{ textShadow: "0 2px 20px rgba(0,0,0,0.6), 0 4px 40px rgba(0,0,0,0.4)" }}
          >
            {title}
          </h1>
          <p className="mt-8 text-stone-300 text-sm animate-bounce drop-shadow-md">
            {scrollToExpand}
          </p>
        </motion.div>

        {/* Expanding media container - starts much lower with more inset */}
        <motion.div
          className="absolute inset-8 md:inset-16 lg:inset-20 z-10 overflow-hidden"
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
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/10 to-transparent" />
        </motion.div>
      </div>

      {/* Expanded content area - transparent, not solid bg */}
      <motion.div
        className="relative z-20 -mt-[50vh]"
        style={{ opacity: contentOpacity, y: contentY }}
      >
        {/* Gradient bridge from hero to content */}
        <div className="h-40 bg-gradient-to-b from-transparent via-stone-950/60 to-stone-950/80" />
        
        <div className="min-h-screen pt-8">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
