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

  // Media expansion - fully expands by 40% scroll
  const mediaScale = useTransform(scrollYProgress, [0, 0.4], [0.5, 1]);
  const mediaBorderRadius = useTransform(scrollYProgress, [0, 0.4], [32, 0]);
  const mediaOpacity = useTransform(scrollYProgress, [0, 0.25, 0.4], [0.5, 0.8, 1]);
  const mediaY = useTransform(scrollYProgress, [0, 0.4], [60, 0]);
  
  // Title fades out as media expands
  const titleOpacity = useTransform(scrollYProgress, [0, 0.15, 0.25], [1, 0.7, 0]);
  const titleY = useTransform(scrollYProgress, [0, 0.25], [0, -60]);
  const titleScale = useTransform(scrollYProgress, [0, 0.25], [1, 0.95]);
  
  // Content reveals AFTER media is fully expanded (starts at 45%, done by 60%)
  const contentOpacity = useTransform(scrollYProgress, [0.45, 0.6], [0, 1]);
  const contentY = useTransform(scrollYProgress, [0.45, 0.6], [30, 0]);

  // Background parallax
  const bgY = useTransform(scrollYProgress, [0, 1], [0, -80]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative min-h-[200vh] overflow-x-hidden",
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

      {/* Fixed hero section */}
      <div className="sticky top-0 h-screen overflow-hidden pt-16 md:pt-20">
        {/* Title overlay */}
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

        {/* Expanding media container */}
        <motion.div
          className="absolute inset-6 md:inset-12 lg:inset-16 z-10 overflow-hidden"
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
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/10 to-transparent" />
        </motion.div>
      </div>

      {/* Expanded content area - appears after hero fully expanded */}
      <motion.div
        className="relative z-20 -mt-[30vh]"
        style={{ opacity: contentOpacity, y: contentY }}
      >
        <div className="min-h-screen">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
