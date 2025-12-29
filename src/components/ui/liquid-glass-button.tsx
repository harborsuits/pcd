"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const liquidButtonVariants = cva(
  "inline-flex items-center transition-colors justify-center cursor-pointer gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  {
    variants: {
      variant: {
        default: "bg-transparent hover:scale-105 duration-300 transition text-primary",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 text-xs gap-1.5 px-4 has-[>svg]:px-4",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        xl: "h-12 rounded-md px-8 has-[>svg]:px-6",
        xxl: "h-14 rounded-md px-10 has-[>svg]:px-8",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "lg",
    },
  }
)

function GlassFilter() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
      <defs>
        <filter id="liquid-glass-filter" x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.015"
            numOctaves="3"
            seed="1"
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="2" result="blurredNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blurredNoise"
            scale="8"
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />
          <feGaussianBlur in="displaced" stdDeviation="0.5" result="finalBlur" />
          <feMerge>
            <feMergeNode in="finalBlur" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  )
}

interface LiquidButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof liquidButtonVariants> {
  asChild?: boolean
}

function LiquidButton({
  className,
  variant,
  size,
  asChild = false,
  children,
  ...props
}: LiquidButtonProps) {
  const Comp = asChild ? Slot : "button"

  return (
    <div className="relative inline-flex group">
      <GlassFilter />
      
      {/* Outer glow layer */}
      <div 
        className="absolute -inset-1 rounded-xl bg-gradient-to-r from-accent via-accent/80 to-accent opacity-60 blur-lg group-hover:opacity-80 transition-opacity duration-300"
        style={{ filter: "url(#liquid-glass-filter)" }}
      />
      
      {/* Glass background */}
      <div 
        className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-sm"
        style={{ filter: "url(#liquid-glass-filter)" }}
      />
      
      {/* Inner highlight */}
      <div className="absolute inset-[1px] rounded-lg bg-gradient-to-b from-white/30 via-transparent to-white/5" />
      
      {/* Button content */}
      <Comp
        className={cn(
          liquidButtonVariants({ variant, size }),
          "relative z-10 bg-accent/90 hover:bg-accent text-accent-foreground font-semibold rounded-lg shadow-lg shadow-accent/25 border border-white/20",
          className
        )}
        {...props}
      >
        {children}
      </Comp>
      
      {/* Shine effect on hover */}
      <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
        <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
      </div>
    </div>
  )
}

export { LiquidButton, liquidButtonVariants }
