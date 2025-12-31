"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Link } from "react-router-dom"

type NavItem = { label: string; href: string }

const NAV_ITEMS: NavItem[] = [
  { label: "Gallery", href: "#gallery" },
  { label: "Artists", href: "#artists" },
  { label: "Visit", href: "#visit" },
  { label: "Events", href: "#events" },
  { label: "Contact", href: "#contact" },
]

function MenuIconAnimated({ open }: { open: boolean }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      className="overflow-visible"
    >
      <motion.line
        x1="6"
        y1="10"
        x2="26"
        y2="10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        animate={open ? { rotate: 45, y: 6, x: 0 } : { rotate: 0, y: 0, x: 0 }}
        style={{ originX: "16px", originY: "16px" }}
        transition={{ duration: 0.3 }}
      />
      <motion.line
        x1="6"
        y1="16"
        x2="26"
        y2="16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        animate={open ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.2 }}
      />
      <motion.line
        x1="6"
        y1="22"
        x2="26"
        y2="22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        animate={open ? { rotate: -45, y: -6, x: 0 } : { rotate: 0, y: 0, x: 0 }}
        style={{ originX: "16px", originY: "16px" }}
        transition={{ duration: 0.3 }}
      />
    </svg>
  )
}

export function GalleryHero({
  brand = "Harborlight Gallery",
  headline = "Coastal art for modern Maine living.",
  subhead = "Original work from local artists — seascapes, working waterfront, fog & pines.",
  videoSrc = "https://assets.codepen.io/319606/tactus-waves-hero-sm.mp4",
}: {
  brand?: string
  headline?: string
  subhead?: string
  videoSrc?: string
}) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-slate-900">
      {/* Sticky nav */}
      <header className="fixed inset-x-0 top-0 z-50">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="text-xl font-semibold tracking-tight text-white mix-blend-difference opacity-60 hover:opacity-100 transition-opacity"
          >
            {brand}
          </Link>

          <button
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "rounded-2xl p-2 text-white mix-blend-difference",
              "focus:outline-none focus:ring-2 focus:ring-white/40"
            )}
            aria-label="Open menu"
          >
            <MenuIconAnimated open={open} />
          </button>
        </nav>
      </header>

      {/* Video bg */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/20 to-slate-900/60" />
      </div>

      {/* Hero content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl"
        >
          <h1 className="font-serif text-4xl font-light leading-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            {headline}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80 sm:text-xl">
            {subhead}
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="#gallery"
              className="rounded-full bg-white px-8 py-3 text-sm font-medium text-slate-900 transition hover:bg-white/90"
            >
              Explore the collection
            </a>
            <a
              href="#visit"
              className="rounded-full border border-white/30 px-8 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Visit the gallery
            </a>
          </div>
        </motion.div>
      </div>

      {/* Takeover nav */}
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[60] overflow-auto"
          >
            <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />

            <motion.div
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative grid min-h-screen grid-cols-1 bg-amber-50 lg:grid-cols-2"
            >
              {/* Contact column */}
              <div className="flex flex-col justify-between bg-slate-800 p-8 text-white lg:p-12">
                <div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-8"
                  >
                    <span className="text-2xl font-light tracking-tight">
                      {brand}
                    </span>
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="max-w-sm text-3xl font-light leading-tight sm:text-4xl"
                  >
                    discover coastal art that speaks to you
                    <span className="text-amber-400">.</span>
                  </motion.p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-4 text-sm text-white/70"
                >
                  <div>
                    <a href="tel:+12075551234" className="hover:text-white">
                      +1 (207) 555-1234
                    </a>
                  </div>
                  <div>
                    <a href="mailto:hello@harborlight.gallery" className="hover:text-white">
                      hello@harborlight.gallery
                    </a>
                  </div>
                  <div>Boothbay Harbor, Maine</div>
                </motion.div>

                <Link
                  to="/"
                  className="inline-block text-xs text-white/50 hover:text-white/80 transition-colors"
                >
                  ← Back to demos
                </Link>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-4 text-xs text-white/40"
                >
                  (Demo site) Real-world navigation + lead capture — wired to your smart intake.
                </motion.p>
              </div>

              {/* Menu column */}
              <div className="flex flex-col justify-between p-8 lg:p-12">
                <div className="flex-1 flex flex-col justify-center">
                  <nav className="space-y-4">
                    {NAV_ITEMS.map((item, i) => (
                      <motion.a
                        key={item.label}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.08 }}
                        className="block text-4xl font-bold tracking-tight text-slate-900 transition hover:text-amber-600 sm:text-5xl"
                      >
                        {item.label}
                      </motion.a>
                    ))}
                  </nav>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="mt-12 flex items-center gap-4 text-sm text-slate-500"
                  >
                    <a href="#contact" onClick={() => setOpen(false)} className="hover:text-slate-900">
                      inquiry
                    </a>
                    <span>•</span>
                    <a href="#events" onClick={() => setOpen(false)} className="hover:text-slate-900">
                      events
                    </a>
                    <span>•</span>
                    <a href="#visit" onClick={() => setOpen(false)} className="hover:text-slate-900">
                      hours
                    </a>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Curved cut corner effect */}
      <div className="absolute bottom-0 left-0 right-0 z-20 h-24">
        <svg
          viewBox="0 0 1440 96"
          fill="none"
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          <path
            d="M0 96V0C240 64 480 96 720 96C960 96 1200 64 1440 0V96H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  )
}
