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

  // Media expansion transforms
  const mediaScale = useTransform(scrollYProgress, [0, 0.3], [0.6, 1]);
  const mediaBorderRadius = useTransform(scrollYProgress, [0, 0.3], [24, 0]);
  const mediaOpacity = useTransform(scrollYProgress, [0, 0.15], [0.7, 1]);
  
  // Title transforms
  const titleOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const titleY = useTransform(scrollYProgress, [0, 0.15], [0, -50]);
  
  // Content reveal
  const contentOpacity = useTransform(scrollYProgress, [0.25, 0.4], [0, 1]);
  const contentY = useTransform(scrollYProgress, [0.25, 0.4], [50, 0]);

  // Background parallax
  const bgY = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative min-h-[250vh]",
        className
      )}
    >
      {/* Background image with parallax */}
      {bgImageSrc && (
        <motion.div
          className="fixed inset-0 z-0"
          style={{ y: bgY }}
        >
          <img
            src={bgImageSrc}
            alt="Background"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-950/60 via-stone-950/80 to-stone-950" />
        </motion.div>
      )}

      {/* Fixed hero section */}
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Title overlay */}
        <motion.div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none"
          style={{ opacity: titleOpacity, y: titleY }}
        >
          <p className="text-amber-400 font-medium mb-4 tracking-widest uppercase text-sm">
            {date}
          </p>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-center text-stone-100">
            {title}
          </h1>
          <p className="mt-8 text-stone-400 text-sm animate-bounce">
            {scrollToExpand}
          </p>
        </motion.div>

        {/* Expanding media container */}
        <motion.div
          className="absolute inset-4 md:inset-8 lg:inset-12 z-10 overflow-hidden"
          style={{
            scale: mediaScale,
            borderRadius: mediaBorderRadius,
            opacity: mediaOpacity,
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
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent" />
        </motion.div>
      </div>

      {/* Expanded content area */}
      <motion.div
        className="relative z-30 bg-stone-950 -mt-[50vh]"
        style={{ opacity: contentOpacity, y: contentY }}
      >
        <div className="min-h-screen pt-20">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
