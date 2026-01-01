"use client"

import type React from "react"
import { Award, Star } from "lucide-react"
import { cn } from "@/lib/utils"

export interface AwardsComponentProps {
  variant?: "stamp" | "award" | "certificate" | "badge" | "sticker" | "id-card"
  title: string
  subtitle?: string
  description?: string
  date?: string
  recipient?: string
  level?: "bronze" | "silver" | "gold" | "platinum"
  className?: string
  showIcon?: boolean
  customIcon?: React.ReactNode
}

const levelColors = {
  bronze: "from-amber-600 to-amber-800",
  silver: "from-gray-400 to-gray-600",
  gold: "from-yellow-400 to-yellow-600",
  platinum: "from-slate-300 to-slate-500",
}

export function Awards({
  variant = "badge",
  title,
  subtitle,
  description,
  date,
  recipient,
  level = "gold",
  className,
  showIcon = true,
}: AwardsComponentProps) {
  // Stamp Variant
  if (variant === "stamp") {
    const createSerratedPath = () => {
      const radius = 96
      const teeth = 40
      const innerRadius = radius - 8
      const outerRadius = radius

      let path = ""
      for (let i = 0; i < teeth; i++) {
        const angle = (i / teeth) * 2 * Math.PI
        const r = i % 2 === 0 ? outerRadius : innerRadius
        const x = Math.cos(angle) * r + radius
        const y = Math.sin(angle) * r + radius

        if (i === 0) {
          path += `M ${x} ${y}`
        } else {
          path += ` L ${x} ${y}`
        }
      }
      path += " Z"
      return path
    }

    const createTextPath = (radius: number) => {
      const centerX = 96
      const centerY = 96
      return `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`
    }

    return (
      <div className={cn("relative inline-block", className)}>
        <svg width="192" height="192" viewBox="0 0 192 192">
          <defs>
            <path id="textPathTop" d={createTextPath(70)} fill="none" />
            <path id="textPathBottom" d={`M ${96 - 70} ${96} A 70 70 0 0 0 ${96 + 70} ${96}`} fill="none" />
          </defs>

          <path d={createSerratedPath()} fill="none" stroke="currentColor" strokeWidth="2" className="text-stone-400" />
          <circle cx="96" cy="96" r="75" fill="none" stroke="currentColor" strokeWidth="1" className="text-stone-300" />

          <text className="fill-stone-600 text-[10px] font-bold uppercase tracking-wider">
            <textPath href="#textPathTop" startOffset="50%" textAnchor="middle">
              {title}
            </textPath>
          </text>

          <text className="fill-stone-600 text-[10px] font-bold uppercase tracking-wider">
            <textPath href="#textPathBottom" startOffset="50%" textAnchor="middle">
              {subtitle}
            </textPath>
          </text>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
          {showIcon && (
            <div className="mb-2">
              <Award className="h-8 w-8 text-stone-600" />
            </div>
          )}
          {recipient && (
            <p className="font-bold text-stone-800 text-lg">{recipient}</p>
          )}
          {date && <p className="text-stone-500 text-sm">{date}</p>}
        </div>
      </div>
    )
  }

  // Award Variant
  if (variant === "award") {
    const LaurelWreath = () => (
      <div className="absolute inset-0 flex items-center justify-between px-4 opacity-20">
        <svg viewBox="0 0 24 48" className="h-32 w-8 text-yellow-600">
          <path d="M12 4C8 8 4 16 4 24s4 16 8 20c-4-4-6-12-6-20s2-16 6-20z" fill="currentColor" />
        </svg>
        <svg viewBox="0 0 24 48" className="h-32 w-8 text-yellow-600 scale-x-[-1]">
          <path d="M12 4C8 8 4 16 4 24s4 16 8 20c-4-4-6-12-6-20s2-16 6-20z" fill="currentColor" />
        </svg>
      </div>
    )
    
    return (
      <div className={cn("relative bg-gradient-to-b from-amber-50 to-yellow-100 p-8 rounded-lg shadow-lg border border-yellow-300 max-w-sm mx-auto", className)}>
        <LaurelWreath />
        <div className="relative z-10 text-center">
          <div className={cn("inline-block px-4 py-1 rounded-full text-xs font-bold mb-4 bg-gradient-to-r text-white", levelColors[level])}>
            {level.toUpperCase()}
          </div>

          <h2 className="font-serif text-3xl font-bold text-yellow-800 mb-2">{title}</h2>

          <div className="w-16 h-0.5 bg-yellow-400 mx-auto my-4" />

          <p className="text-yellow-700 text-lg mb-4">{subtitle}</p>

          {recipient && (
            <p className="font-bold text-yellow-900 text-xl mb-2">{recipient}</p>
          )}

          <p className="text-yellow-600 text-sm">{date}</p>
        </div>
      </div>
    )
  }

  if (variant === "certificate") {
    const Badge = () => (
      <div className="flex justify-center">
        <Award className="h-12 w-12 text-amber-600" />
      </div>
    )
    
    return (
      <div className={cn("bg-white border-8 border-double border-amber-200 p-8 max-w-lg mx-auto", className)}>
        <div className="border border-amber-100 p-8">
          <Badge />
          <div className="text-center mt-4">
            <span className="text-amber-600 text-sm uppercase tracking-widest">Certificate</span>
            <span className="block text-2xl font-serif text-amber-800 mt-1"> of {title}</span>
          </div>

          <p className="text-center text-stone-500 mt-6 text-sm">This is to certify that</p>

          <p className="text-center text-2xl font-serif text-amber-900 mt-2 border-b border-amber-200 pb-2 mx-8">
            {recipient}
          </p>

          <p className="text-center text-stone-600 mt-4">{subtitle}</p>

          <div className="flex justify-center mt-6">
            <Star className="h-6 w-6 text-amber-400" />
          </div>

          <p className="text-center text-stone-400 text-sm mt-4">Awarded on: {date}</p>
        </div>
      </div>
    )
  }

  if (variant === "badge") {
    const Badge = () => (
      <div className="flex flex-col items-center">
        <Award className="h-10 w-10 text-yellow-500 mb-1" />
        <div className="flex gap-0.5">
          <div className="w-1 h-3 bg-yellow-400 rounded-full" />
          <div className="w-1 h-4 bg-yellow-500 rounded-full" />
          <div className="w-1 h-3 bg-yellow-400 rounded-full" />
        </div>
      </div>
    )
    
    return (
      <div className={cn("inline-block", className)}>
        <div className="bg-gradient-to-br from-amber-50/90 via-yellow-50/80 to-amber-100/90 backdrop-blur-md border border-amber-300/60 rounded-2xl p-6 shadow-xl min-w-[200px]">
          <Badge />
          <div className="text-center mt-3">
            <p className="text-yellow-600 text-sm font-semibold tracking-wide">
              {date}
            </p>

            <h3 className="text-xl font-bold text-amber-800 mt-1">
              {title}
            </h3>

            <p className="text-amber-600 text-sm mt-0.5">
              {subtitle}
            </p>

            <div className="flex items-center justify-center gap-2 mt-3 text-xs text-stone-500">
              {recipient && <p>by {recipient}</p>}
              <span>•</span>
              <p>{date}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Sticker Variant
  if (variant === "sticker") {
    return (
      <div className={cn("relative w-48 h-48 flex items-center justify-center", className)}>
        <div className="absolute inset-0 animate-spin-slow">
          {Array.from({ length: 15 }).map((_, i) => (
            <span
              key={i}
              className="absolute text-xs font-bold text-stone-600 uppercase tracking-widest whitespace-nowrap"
              style={{
                transform: `rotate(${i * 24}deg) translateX(60px)`,
                transformOrigin: "center center",
              }}
            >
              {title}
            </span>
          ))}
        </div>
      </div>
    )
  }

  if (variant === "id-card") {
    return (
      <div className={cn("bg-white rounded-xl shadow-xl overflow-hidden max-w-xs", className)}>
        <div className="bg-gradient-to-r from-amber-500 to-yellow-500 p-4">
          <div className="flex items-center gap-3">
            <Award className="h-8 w-8 text-white" />
            <div className="text-white">
              <p className="text-xs opacity-80">{date}</p>
              <h3 className="font-bold text-lg">{title}</h3>
              <p className="text-sm opacity-90">{subtitle}</p>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wider">VIRTUAL</p>
              <p className="text-stone-600 text-sm mt-1">{description}</p>
            </div>
            <div className="bg-stone-100 p-2 rounded">
              <div className="w-12 h-12 bg-stone-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

// Keep backward compatibility
export const AwardBadge = Awards
export default Awards
