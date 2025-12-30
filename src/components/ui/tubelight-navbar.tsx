"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavBarProps {
  items: NavItem[];
  className?: string;
  activeColor?: string;
}

export function NavBar({ items, className, activeColor = "hsl(var(--accent))" }: NavBarProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleClick = (index: number, href: string) => {
    setActiveIndex(index);
    
    // Handle smooth scroll for anchor links
    if (href.startsWith("#")) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else if (href === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <nav
      className={cn(
        "fixed z-50 transition-all duration-300",
        isMobile 
          ? "bottom-4 left-1/2 -translate-x-1/2" 
          : "top-4 left-1/2 -translate-x-1/2",
        className
      )}
    >
      <div className="flex items-center gap-1 bg-stone-900/90 backdrop-blur-xl border border-stone-700/50 rounded-full px-2 py-2 shadow-2xl">
        {items.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeIndex === index;

          return (
            <button
              key={item.label}
              onClick={() => handleClick(index, item.href)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300",
                isActive 
                  ? "text-stone-950" 
                  : "text-stone-400 hover:text-stone-200"
              )}
            >
              {/* Tubelight glow effect */}
              {isActive && (
                <motion.div
                  layoutId="tubelight"
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${activeColor}, hsl(45 93% 58%))`,
                    boxShadow: `0 0 20px ${activeColor}, 0 0 40px ${activeColor}40`,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}
              
              <span className="relative z-10">
                <Icon className="h-4 w-4" />
              </span>
              
              {/* Show label on desktop or when active */}
              {(!isMobile || isActive) && (
                <motion.span
                  className="relative z-10 text-sm font-medium"
                  initial={false}
                  animate={{ 
                    width: isActive ? "auto" : isMobile ? 0 : "auto",
                    opacity: isActive ? 1 : isMobile ? 0 : 1
                  }}
                >
                  {item.label}
                </motion.span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
