"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Trophy, Award, Star, Medal, Crown } from "lucide-react";

type BadgeVariant = "gold" | "silver" | "bronze" | "platinum" | "default";

interface AwardBadgeProps {
  title: string;
  subtitle?: string;
  year?: string;
  variant?: BadgeVariant;
  icon?: "trophy" | "award" | "star" | "medal" | "crown";
  className?: string;
}

const variantStyles: Record<BadgeVariant, { bg: string; border: string; text: string; glow: string }> = {
  gold: {
    bg: "bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-amber-600/20",
    border: "border-amber-500/50",
    text: "text-amber-400",
    glow: "shadow-amber-500/20",
  },
  silver: {
    bg: "bg-gradient-to-br from-slate-400/20 via-gray-300/10 to-slate-500/20",
    border: "border-slate-400/50",
    text: "text-slate-300",
    glow: "shadow-slate-400/20",
  },
  bronze: {
    bg: "bg-gradient-to-br from-orange-700/20 via-amber-700/10 to-orange-800/20",
    border: "border-orange-600/50",
    text: "text-orange-400",
    glow: "shadow-orange-500/20",
  },
  platinum: {
    bg: "bg-gradient-to-br from-cyan-400/20 via-teal-300/10 to-cyan-500/20",
    border: "border-cyan-400/50",
    text: "text-cyan-300",
    glow: "shadow-cyan-400/20",
  },
  default: {
    bg: "bg-gradient-to-br from-stone-700/50 via-stone-600/30 to-stone-700/50",
    border: "border-stone-600/50",
    text: "text-stone-300",
    glow: "shadow-stone-500/20",
  },
};

const iconMap = {
  trophy: Trophy,
  award: Award,
  star: Star,
  medal: Medal,
  crown: Crown,
};

export const AwardBadge: React.FC<AwardBadgeProps> = ({
  title,
  subtitle,
  year,
  variant = "gold",
  icon = "trophy",
  className,
}) => {
  const styles = variantStyles[variant];
  const IconComponent = iconMap[icon];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.05, y: -2 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative flex flex-col items-center p-6 rounded-2xl border backdrop-blur-sm",
        "shadow-lg transition-shadow duration-300 hover:shadow-xl",
        styles.bg,
        styles.border,
        styles.glow,
        className
      )}
    >
      {/* Shine effect */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden">
        <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-12 animate-[shimmer_3s_infinite]" />
      </div>

      {/* Icon */}
      <div className={cn("mb-3 relative", styles.text)}>
        <IconComponent className="h-8 w-8" />
      </div>

      {/* Year badge */}
      {year && (
        <span className={cn("text-xs font-bold tracking-wider mb-2", styles.text)}>
          {year}
        </span>
      )}

      {/* Title */}
      <h4 className="text-stone-100 font-serif text-lg text-center leading-tight">
        {title}
      </h4>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-stone-400 text-sm mt-1 text-center">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};

export default AwardBadge;
