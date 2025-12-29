"use client";

import * as React from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

/* ───────────────────────────────────────────────────────────
   ContainerScroll - Main scroll-driven container
   ─────────────────────────────────────────────────────────── */
interface ContainerScrollProps {
  children: React.ReactNode;
  className?: string;
}

export const ContainerScroll: React.FC<ContainerScrollProps> = ({
  children,
  className,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 0.4], [0.85, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0.4, 1]);
  const y = useTransform(scrollYProgress, [0, 0.4], [60, 0]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <motion.div
        style={{
          scale,
          opacity,
          y,
        }}
        className="will-change-transform"
      >
        {children}
      </motion.div>
    </div>
  );
};

/* ───────────────────────────────────────────────────────────
   ContainerInset - Decorative frame with glow effects
   ─────────────────────────────────────────────────────────── */
interface ContainerInsetProps {
  children: React.ReactNode;
  className?: string;
}

export const ContainerInset: React.FC<ContainerInsetProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "relative rounded-2xl overflow-hidden",
        "bg-gradient-to-b from-accent/5 to-accent/10",
        "border border-accent/20",
        "shadow-[0_0_60px_-15px] shadow-accent/30",
        className
      )}
    >
      {/* Glow overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 via-transparent to-accent/10 pointer-events-none" />
      
      {/* Inner content */}
      <div className="relative">{children}</div>
    </div>
  );
};

/* ───────────────────────────────────────────────────────────
   ContainerStagger - Staggered fade-in animation
   ─────────────────────────────────────────────────────────── */
interface ContainerStaggerProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const ContainerStagger: React.FC<ContainerStaggerProps> = ({
  children,
  className,
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.25, 0.4, 0.25, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ───────────────────────────────────────────────────────────
   ContainerAnimated - Subtle floating animation
   ─────────────────────────────────────────────────────────── */
interface ContainerAnimatedProps {
  children: React.ReactNode;
  className?: string;
}

export const ContainerAnimated: React.FC<ContainerAnimatedProps> = ({
  children,
  className,
}) => {
  return (
    <motion.div
      animate={{
        y: [0, -8, 0],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ───────────────────────────────────────────────────────────
   HeroVideoPlayer - Video player with decorative frame
   ─────────────────────────────────────────────────────────── */
interface HeroVideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
}

export const HeroVideoPlayer: React.FC<HeroVideoPlayerProps> = ({
  src,
  poster,
  className,
  autoPlay = true,
  loop = true,
  muted = true,
}) => {
  return (
    <div className={cn("relative aspect-video rounded-xl overflow-hidden", className)}>
      {/* Decorative border glow */}
      <div className="absolute -inset-[1px] bg-gradient-to-r from-accent/40 via-accent/60 to-accent/40 rounded-xl" />
      
      {/* Video container */}
      <div className="absolute inset-[1px] bg-background rounded-xl overflow-hidden">
        <video
          src={src}
          poster={poster}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          playsInline
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Corner accents */}
      <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-accent/60 rounded-tl" />
      <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-accent/60 rounded-tr" />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-accent/60 rounded-bl" />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-accent/60 rounded-br" />
    </div>
  );
};

/* ───────────────────────────────────────────────────────────
   AIReceptionistHero - Complete section component
   ─────────────────────────────────────────────────────────── */
interface AIReceptionistHeroProps {
  videoSrc: string;
  className?: string;
}

export const AIReceptionistHero: React.FC<AIReceptionistHeroProps> = ({
  videoSrc,
  className,
}) => {
  return (
    <ContainerScroll className={className}>
      <ContainerStagger delay={0.1}>
        <ContainerInset>
          <ContainerAnimated>
            <HeroVideoPlayer src={videoSrc} />
          </ContainerAnimated>
        </ContainerInset>
      </ContainerStagger>
    </ContainerScroll>
  );
};
