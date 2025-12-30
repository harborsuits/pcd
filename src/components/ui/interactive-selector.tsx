"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SelectorOption {
  id: string;
  label: string;
  icon?: LucideIcon;
  description: string;
  image?: string;
  content?: React.ReactNode;
}

interface InteractiveSelectorProps {
  options: SelectorOption[];
  title?: string;
  className?: string;
}

export default function InteractiveSelector({
  options,
  title = "Explore the Experience",
  className,
}: InteractiveSelectorProps) {
  const [activeId, setActiveId] = useState(options[0]?.id || "");

  const activeOption = options.find((opt) => opt.id === activeId);

  return (
    <section className={cn("py-16 md:py-24", className)}>
      <div className="container mx-auto px-6">
        {title && (
          <h2 className="font-serif text-3xl md:text-4xl text-center mb-12">
            {title}
          </h2>
        )}

        {/* Tab navigation */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-12">
          {options.map((option) => {
            const Icon = option.icon;
            const isActive = activeId === option.id;

            return (
              <button
                key={option.id}
                onClick={() => setActiveId(option.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 md:px-6 py-3 rounded-full transition-all duration-300",
                  "border border-stone-700/50",
                  isActive
                    ? "bg-amber-500 text-stone-950 border-amber-500"
                    : "bg-stone-800/50 text-stone-300 hover:bg-stone-800 hover:text-stone-100"
                )}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content area */}
        <AnimatePresence mode="wait">
          {activeOption && (
            <motion.div
              key={activeOption.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid md:grid-cols-2 gap-8 md:gap-12 items-center"
            >
              {/* Image */}
              {activeOption.image && (
                <div className="aspect-[4/3] rounded-2xl overflow-hidden">
                  <img
                    src={activeOption.image}
                    alt={activeOption.label}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Text content */}
              <div className={!activeOption.image ? "md:col-span-2 text-center" : ""}>
                <h3 className="font-serif text-2xl md:text-3xl mb-4 text-stone-100">
                  {activeOption.label}
                </h3>
                <p className="text-white leading-relaxed mb-6">
                  {activeOption.description}
                </p>
                {activeOption.content}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
