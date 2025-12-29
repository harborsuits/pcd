"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const liquidbuttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[transform,filter] duration-200 disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
  {
    variants: {
      variant: {
        default:
          "text-white hover:brightness-110 active:brightness-95",
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

  return (
    <Comp
      className={cn(
        "group isolate overflow-hidden",
        liquidbuttonVariants({ variant, size }),
        className
      )}
      {...props}
    >
      {/* glass base */}
      <span className="absolute inset-0 -z-10 rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/20" />

      {/* inner highlight */}
      <span className="absolute inset-0 -z-10 rounded-full bg-gradient-to-b from-white/25 via-white/10 to-transparent opacity-80" />

      {/* soft edge shadow */}
      <span className="absolute inset-0 -z-10 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.25)]" />

      {/* content */}
      <span className="relative z-10">{children}</span>
    </Comp>
  )
}

export { liquidbuttonVariants }
