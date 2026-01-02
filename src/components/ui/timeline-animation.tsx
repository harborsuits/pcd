"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, useInView, type Variants } from "framer-motion";

type TimelineContentProps<T extends React.ElementType> = {
  as?: T;
  className?: string;
  children?: React.ReactNode;
  animationNum?: number;
  timelineRef?: React.RefObject<HTMLElement>;
  customVariants?: Variants;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "children">;

export function TimelineContent<T extends React.ElementType = "div">({
  as,
  className,
  children,
  animationNum = 0,
  timelineRef,
  customVariants,
  ...props
}: TimelineContentProps<T>) {
  const Comp = (as ?? "div") as React.ElementType;
  const localRef = React.useRef<HTMLDivElement | null>(null);

  const isInView = useInView(localRef, {
    margin: "-10% 0px -10% 0px",
    once: true,
  });

  const variants: Variants = customVariants ?? {
    hidden: { opacity: 0, y: 10, filter: "blur(8px)" },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { delay: i * 0.12, duration: 0.45 },
    }),
  };

  const content = React.createElement(Comp, props as Record<string, unknown>, children);
  
  return (
    <motion.div
      ref={localRef}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      custom={animationNum}
      variants={variants}
      className={cn(className)}
    >
      {content}
    </motion.div>
  );
}
