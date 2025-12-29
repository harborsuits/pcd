"use client";

import { cn } from "@/lib/utils";
import { motion, type Transition } from "framer-motion";

interface VerticalCutRevealProps {
  children: string;
  className?: string;
  splitBy?: "characters" | "words" | "lines";
  staggerDuration?: number;
  staggerFrom?: "first" | "last" | "center";
  transition?: Transition;
  containerClassName?: string;
}

export function VerticalCutReveal({
  children,
  className,
  splitBy = "characters",
  staggerDuration = 0.025,
  staggerFrom = "first",
  transition = { type: "spring", stiffness: 200, damping: 21 },
  containerClassName,
}: VerticalCutRevealProps) {
  const text = children;

  const getSplitContent = () => {
    switch (splitBy) {
      case "words":
        return text.split(" ");
      case "lines":
        return text.split("\n");
      default:
        return text.split("");
    }
  };

  const items = getSplitContent();

  const getStaggerDelay = (index: number, total: number) => {
    switch (staggerFrom) {
      case "last":
        return (total - 1 - index) * staggerDuration;
      case "center":
        const center = (total - 1) / 2;
        return Math.abs(center - index) * staggerDuration;
      default:
        return index * staggerDuration;
    }
  };

  return (
    <span className={cn("inline-flex flex-wrap overflow-hidden", containerClassName)}>
      {items.map((item, index) => (
        <motion.span
          key={`${item}-${index}`}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          transition={{
            ...transition,
            delay: getStaggerDelay(index, items.length),
          } as Transition}
          className={cn("inline-block", className)}
        >
          {splitBy === "words" ? (
            <>
              {item}
              {index < items.length - 1 && "\u00A0"}
            </>
          ) : (
            item === " " ? "\u00A0" : item
          )}
        </motion.span>
      ))}
    </span>
  );
}
