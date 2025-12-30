"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const liquidbuttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
  {
    variants: {
      variant: {
        default:
          "text-slate-900 hover:brightness-105 active:brightness-95",
        dark:
          "text-white hover:brightness-110 active:brightness-95",
        teal:
          "text-accent-foreground hover:brightness-105 active:brightness-95",
      },
      size: {
        sm: "h-9 px-4 rounded-full text-sm",
        lg: "h-11 px-7 rounded-full text-sm",
        xxl: "h-14 px-10 rounded-full text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "lg",
    },
  }
)

export function LiquidButton({
  className,
  variant,
  size,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof liquidbuttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"
  const isDark = variant === "dark"
  const isTeal = variant === "teal"

  return (
    <Comp
      className={cn(
        "group isolate overflow-hidden cursor-pointer",
        liquidbuttonVariants({ variant, size }),
        className
      )}
      {...props}
    >
      {/* glass base */}
      <span 
        className={cn(
          "absolute inset-0 -z-10 rounded-full backdrop-blur-md border transition-colors",
          isDark 
            ? "bg-slate-900/70 border-white/20 group-hover:bg-slate-900/85" 
            : isTeal
              ? "bg-[hsl(175_35%_45%)] border-[hsl(175_35%_35%)] group-hover:bg-[hsl(175_35%_40%)]"
              : "bg-white/60 border-slate-900/40 group-hover:bg-white/75 group-hover:border-slate-900/60"
        )} 
      />

      {/* inner highlight */}
      <span 
        className={cn(
          "absolute inset-0 -z-10 rounded-full bg-gradient-to-b opacity-80",
          isDark 
            ? "from-white/10 via-white/5 to-transparent" 
            : isTeal
              ? "from-white/25 via-white/10 to-transparent"
              : "from-white/40 via-white/20 to-transparent"
        )} 
      />

      {/* soft edge shadow + ring for silhouette */}
      <span className={cn(
        "absolute inset-0 -z-10 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.15)]",
        isTeal ? "ring-1 ring-[hsl(175_35%_35%)]" : "ring-1 ring-black/10"
      )} />

      {/* content */}
      <span className={cn(
        "relative z-10 font-medium",
        isDark ? "text-white" : isTeal ? "text-white" : "text-slate-900"
      )}>
        {children}
      </span>
    </Comp>
  )
}

export { liquidbuttonVariants }
