import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, ChevronLeft, ChevronRight, Globe, FolderOpen, CalendarCheck, Zap, Bot, Puzzle, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StaggerTestimonials } from "@/components/ui/stagger-testimonials";
import websitesConvertVideo from "@/assets/videos/websites-convert.mp4";
import officeVideo from "@/assets/videos/office-video.mp4";
import aiFrontDoorVideo from "@/assets/videos/ai-front-door.mp4";
import clientPortalsVideo from "@/assets/videos/client-portals.mp4";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// Unified feature data - single source of truth
type FeatureItem = {
  id: string;
  type: "video" | "image";
  title: string;
  shortDesc: string;
  subtitle: string;
  bullets: string[];
  url: string;
  span: string;
  icon: LucideIcon;
};

const FEATURES: FeatureItem[] = [
  {
    id: "websites",
    type: "video",
    title: "Websites that convert",
    shortDesc: "Clean design, fast load, mobile-first.",
    subtitle: "Your public face — fast, modern, and built to convert.",
    bullets: [
      "Marketing sites that explain what you do in seconds, not paragraphs",
      "Service pages that answer questions before the phone rings",
      "Landing pages for specific offers, locations, or campaigns",
      "Clean, SEO-ready foundations without bloated plugins",
      "Designed to work with your booking and intake flow",
    ],
    url: websitesConvertVideo,
    span: "md:col-span-2 md:row-span-2 col-span-2 row-span-2",
    icon: Globe,
  },
  {
    id: "ai",
    type: "video",
    title: "AI Front Door",
    shortDesc: "Answer calls, capture info, route leads.",
    subtitle: "An AI-powered front door for your business.",
    bullets: [
      "Answers common questions instantly (services, hours, pricing ranges, next steps)",
      "Handles calls and messages when you're unavailable",
      "Collects structured lead info before handing off",
      "Routes high-intent requests appropriately",
      "Reduces interruptions during focused work",
      "Always clearly identified as AI",
    ],
    url: aiFrontDoorVideo,
    span: "md:col-span-2 md:row-span-1 col-span-1 row-span-1",
    icon: Bot,
  },
  {
    id: "booking",
    type: "image",
    title: "Booking + Intake",
    shortDesc: "Rules-based scheduling and forms.",
    subtitle: "Structured information instead of back-and-forth.",
    bullets: [
      "Smart intake forms that gather the right info upfront",
      "Booking flows that respect your availability and rules",
      "Routing based on service type or request",
      "Seamless handoff into your workflow",
      "You start projects with context — not confusion",
    ],
    url: "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1400&q=80",
    span: "md:col-span-1 md:row-span-1 col-span-1 row-span-1",
    icon: CalendarCheck,
  },
  {
    id: "portals",
    type: "video",
    title: "Client Portals",
    shortDesc: "One shared place for approvals and updates.",
    subtitle: "A private workspace for you and your clients.",
    bullets: [
      "One shared place for messages, files, approvals, and updates",
      "No more email threads, lost attachments, or 'did you see this?'",
      "Clear visibility into what's done and what's next",
      "Built to scale from one project to many",
      "Reduces friction on both sides of the relationship",
    ],
    url: clientPortalsVideo,
    span: "md:col-span-1 md:row-span-1 col-span-1 row-span-1",
    icon: FolderOpen,
  },
  {
    id: "automations",
    type: "video",
    title: "Automations",
    shortDesc: "Reminders, follow-ups, and workflows.",
    subtitle: "Quiet systems that remove friction — not control.",
    bullets: [
      "Automatic confirmations and status updates",
      "File upload reminders when something is missing",
      "Internal notifications so nothing slips through cracks",
      "Fewer manual steps, fewer mistakes",
      "Built to support your work, not replace it",
    ],
    url: officeVideo,
    span: "md:col-span-2 md:row-span-1 col-span-1 row-span-1",
    icon: Zap,
  },
  {
    id: "custom",
    type: "image",
    title: "Custom & Integrations",
    shortDesc: "Consistent brand, consistent trust.",
    subtitle: "Built around how you actually work.",
    bullets: [
      "Integrations with tools you already use",
      "Custom workflows for unique processes",
      "Flexible enough to evolve as your business grows",
      "No rigid platforms forcing bad habits",
      "The system adapts to your business — not the other way around",
    ],
    url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=80",
    span: "md:col-span-2 md:row-span-1 col-span-1 row-span-1",
    icon: Puzzle,
  },
];

// Media item component for gallery
const MediaItem = ({
  item,
  className,
  onClick,
}: {
  item: FeatureItem;
  className?: string;
  onClick?: () => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => setIsInView(entry.isIntersecting));
      },
      { root: null, rootMargin: "50px", threshold: 0.1 }
    );

    if (videoRef.current) observer.observe(videoRef.current);

    return () => {
      if (videoRef.current) observer.unobserve(videoRef.current);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const handleVideoPlay = async () => {
      if (!videoRef.current || !isInView || !mounted) return;

      try {
        if (videoRef.current.readyState >= 3) {
          setIsBuffering(false);
          await videoRef.current.play();
        } else {
          setIsBuffering(true);
          await new Promise((resolve) => {
            if (videoRef.current) videoRef.current.oncanplay = resolve as any;
          });
          if (mounted) {
            setIsBuffering(false);
            await videoRef.current.play();
          }
        }
      } catch (error) {
        console.warn("Video playback failed:", error);
      }
    };

    if (isInView) handleVideoPlay();
    else if (videoRef.current) videoRef.current.pause();

    return () => {
      mounted = false;
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, [isInView]);

  if (item.type === "video") {
    return (
      <div
        onClick={onClick}
        className={`relative overflow-hidden rounded-xl cursor-pointer ${className}`}
      >
        <video
          ref={videoRef}
          src={item.url}
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />

        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/80">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }

  return (
    <img
      src={item.url}
      alt={item.title}
      onClick={onClick}
      className={`object-cover rounded-xl cursor-pointer ${className}`}
    />
  );
};

// Gallery modal with dock
const GalleryModal = ({
  selectedItem,
  isOpen,
  onClose,
  setSelectedItem,
  features,
}: {
  selectedItem: FeatureItem;
  isOpen: boolean;
  onClose: () => void;
  setSelectedItem: (item: FeatureItem | null) => void;
  features: FeatureItem[];
}) => {
  const [dockPosition, setDockPosition] = useState({ x: 0, y: 0 });

  if (!isOpen) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-background/90 backdrop-blur-xl"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-4 md:inset-10 z-50 flex items-center justify-center"
        onClick={onClose}
      >
        <div
          className="relative w-full h-full max-w-6xl max-h-[85vh] overflow-hidden rounded-2xl bg-card/50 border border-border/50 backdrop-blur-md shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full h-full flex flex-col">
            <div className="flex-1 relative overflow-hidden">
              <MediaItem
                item={selectedItem}
                className="w-full h-full object-contain"
              />

              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background/90 via-background/60 to-transparent">
                <motion.h3
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-2xl font-serif font-bold text-foreground mb-2"
                >
                  {selectedItem.title}
                </motion.h3>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-muted-foreground"
                >
                  {selectedItem.shortDesc}
                </motion.p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-6 right-6 md:top-12 md:right-12 z-50 p-2 rounded-full bg-card/80 border border-border/50 text-foreground hover:bg-card transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </motion.div>

      <motion.div
        drag
        dragMomentum={false}
        onDragEnd={(_, info) => {
          setDockPosition((prev) => ({
            x: prev.x + info.offset.x,
            y: prev.y + info.offset.y,
          }));
        }}
        className="fixed z-[60] left-1/2 bottom-4 -translate-x-1/2 touch-none"
        style={{ x: dockPosition.x, y: dockPosition.y }}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="p-2 rounded-2xl bg-card/80 border border-border/50 backdrop-blur-xl shadow-2xl"
        >
          <div className="flex items-center gap-2">
            {features.map((item, index) => (
              <motion.div
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItem(item);
                }}
                style={{
                  zIndex:
                    selectedItem.id === item.id ? 30 : features.length - index,
                }}
                className={`relative group w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 rounded-xl overflow-hidden cursor-pointer
                            ${selectedItem.id === item.id
                              ? "ring-2 ring-accent shadow-[0_0_25px_hsl(var(--accent)/0.25)]"
                              : "hover:ring-2 hover:ring-border"}`}
                initial={{ rotate: index % 2 === 0 ? -12 : 12 }}
                animate={{
                  scale: selectedItem.id === item.id ? 1.18 : 1,
                  rotate:
                    selectedItem.id === item.id ? 0 : index % 2 === 0 ? -12 : 12,
                  y: selectedItem.id === item.id ? -8 : 0,
                }}
                whileHover={{
                  scale: 1.28,
                  rotate: 0,
                  y: -10,
                  transition: { type: "spring", stiffness: 400, damping: 25 },
                }}
              >
                <img
                  src={item.type === "video" ? item.url.replace(".mp4", ".jpg") : item.url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    if (item.type === "video") {
                      (e.target as HTMLImageElement).src = item.url;
                    }
                  }}
                />
                <div className="absolute inset-0 bg-background/20 group-hover:bg-transparent transition-colors" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

// Feature card component for carousel
interface FeatureCardViewProps {
  position: number;
  item: FeatureItem;
  handleMove: (steps: number) => void;
  cardSize: number;
}

const FeatureCardView: React.FC<FeatureCardViewProps> = ({ position, item, handleMove, cardSize }) => {
  const isCenter = position === 0;
  const Icon = item.icon;

  return (
    <div
      onClick={() => handleMove(position)}
      className={cn(
        "absolute left-1/2 top-1/2 cursor-pointer border-2 p-6 transition-all duration-500 ease-in-out select-none overflow-hidden",
        "rounded-2xl",
        isCenter
          ? "z-10 bg-primary text-primary-foreground border-primary shadow-lg"
          : "z-0 bg-card text-card-foreground border-border hover:border-primary/50"
      )}
      style={{
        width: cardSize,
        height: cardSize,
        clipPath:
          "polygon(40px 0%, calc(100% - 40px) 0%, 100% 40px, 100% 100%, calc(100% - 40px) 100%, 40px 100%, 0 100%, 0 0)",
        transform: `
          translate(-50%, -50%)
          translateX(${(cardSize / 1.5) * position}px)
          translateY(${isCenter ? -50 : position % 2 ? 12 : -12}px)
          rotate(${isCenter ? 0 : position % 2 ? 2 : -2}deg)
        `,
        boxShadow: isCenter
          ? "0px 8px 0px 4px hsl(var(--border))"
          : "0px 0px 0px 0px transparent",
      }}
    >
      <div className="absolute top-0 right-0 w-[40px] h-[40px] bg-gradient-to-bl from-primary/20 to-transparent" />

      <div className="flex items-center gap-2 mb-3">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
          isCenter ? "bg-primary-foreground/20" : "bg-accent/10"
        )}>
          <Icon className={cn("h-4 w-4", isCenter ? "text-primary-foreground" : "text-accent")} />
        </div>
        <h3 className="font-bold text-lg leading-tight">{item.title}</h3>
      </div>

      <p className={cn(
        "text-sm mb-4 leading-relaxed",
        isCenter ? "text-primary-foreground/90" : "text-muted-foreground"
      )}>
        {item.subtitle}
      </p>

      <ul className="space-y-2">
        {item.bullets.slice(0, 3).map((b, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
              isCenter ? "bg-primary-foreground/60" : "bg-accent"
            )} />
            <span className={cn(
              "leading-tight",
              isCenter ? "text-primary-foreground/85" : "text-foreground/80"
            )}>
              {b}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const WhatWeBuild = () => {
  // Shared state
  const [activeId, setActiveId] = useState<string>(FEATURES[0].id);
  const [selectedItem, setSelectedItem] = useState<FeatureItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cardSize, setCardSize] = useState(340);
  const [carouselItems, setCarouselItems] = useState(FEATURES);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Find the active index
  const activeIndex = React.useMemo(
    () => FEATURES.findIndex((f) => f.id === activeId),
    [activeId]
  );

  // Handle gallery card click - scroll to carousel and set active
  const handleGalleryCardClick = useCallback((item: FeatureItem) => {
    if (isDragging) return;
    
    // Update active state
    setActiveId(item.id);
    
    // Reorder carousel items to center the selected item
    const targetIndex = FEATURES.findIndex(f => f.id === item.id);
    const currentCenterIndex = carouselItems.findIndex(f => f.id === carouselItems[Math.floor(carouselItems.length / 2)]?.id);
    
    // Reorganize the array to put the selected item in the center
    const newItems = [...FEATURES];
    const itemsToMove = targetIndex;
    for (let i = 0; i < itemsToMove; i++) {
      const first = newItems.shift();
      if (first) {
        newItems.push({ ...first });
      }
    }
    setCarouselItems(newItems);
    
    // Scroll to carousel section
    if (carouselRef.current) {
      carouselRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isDragging, carouselItems]);

  // Handle carousel navigation
  const handleCarouselMove = useCallback((steps: number) => {
    const newList = [...carouselItems];
    if (steps > 0) {
      for (let i = steps; i > 0; i--) {
        const item = newList.shift();
        if (!item) return;
        newList.push({ ...item });
      }
    } else {
      for (let i = steps; i < 0; i++) {
        const item = newList.pop();
        if (!item) return;
        newList.unshift({ ...item });
      }
    }
    setCarouselItems(newList);
    
    // Update active ID based on new center item
    const centerIndex = Math.floor(newList.length / 2);
    const centerItem = newList[centerIndex];
    if (centerItem) {
      setActiveId(centerItem.id);
    }
  }, [carouselItems]);

  // Resize handler for carousel cards
  useEffect(() => {
    const updateSize = () => {
      const { matches } = window.matchMedia("(min-width: 640px)");
      setCardSize(matches ? 340 : 280);
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl font-bold tracking-tight text-foreground">
            Pleasant Cove Design
          </Link>
          <nav className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link to="/pricing">Pricing</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link to="/demos">Demos</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/portal">Client Portal</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Back Link */}
      <div className="container mx-auto px-6 pt-8">
        <Link 
          to="/" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to home
        </Link>
      </div>

      {/* Bento Gallery */}
      <section className="relative w-full min-h-[80vh] py-16 overflow-hidden bg-gradient-to-b from-background via-primary/5 to-background">
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-accent/10 blur-3xl opacity-60" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
              What We Build
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              A complete system for client-facing work. Everything you need to look professional and run smoothly — nothing you don't.
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              {selectedItem ? (
                <GalleryModal
                  selectedItem={selectedItem}
                  isOpen={!!selectedItem}
                  onClose={() => setSelectedItem(null)}
                  setSelectedItem={setSelectedItem}
                  features={FEATURES}
                />
              ) : (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[180px] md:auto-rows-[200px]"
                >
                  {FEATURES.map((item, index) => (
                    <motion.div
                      key={item.id}
                      className={cn(
                        "relative overflow-hidden rounded-xl bg-card/50 border backdrop-blur-sm",
                        item.span,
                        activeId === item.id 
                          ? "border-accent ring-2 ring-accent/30" 
                          : "border-border/30 hover:border-accent/50"
                      )}
                      onClick={() => handleGalleryCardClick(item)}
                      variants={{
                        hidden: { y: 30, scale: 0.92, opacity: 0 },
                        visible: {
                          y: 0,
                          scale: 1,
                          opacity: 1,
                          transition: {
                            type: "spring",
                            stiffness: 350,
                            damping: 25,
                            delay: index * 0.03,
                          },
                        },
                      }}
                      whileHover={{
                        scale: 1.015,
                        boxShadow: "0 0 0 1px hsl(var(--accent) / 0.25)",
                      }}
                      drag
                      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                      dragElastic={1}
                      onDragStart={() => setIsDragging(true)}
                      onDragEnd={() => setIsDragging(false)}
                    >
                      <MediaItem
                        item={item}
                        className="absolute inset-0 w-full h-full"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-foreground font-semibold text-sm md:text-base">
                            {item.title}
                          </h3>
                          <p className="text-muted-foreground text-xs md:text-sm">
                            {item.shortDesc}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Feature Carousel - synced with gallery */}
      <section ref={carouselRef} className="relative w-full py-16 overflow-hidden bg-background">
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative h-[450px] sm:h-[500px] flex items-center justify-center">
            {carouselItems.map((item, index) => {
              const position =
                carouselItems.length % 2
                  ? index - (carouselItems.length + 1) / 2
                  : index - carouselItems.length / 2;

              return (
                <FeatureCardView
                  key={`${item.id}-${index}`}
                  position={position}
                  item={item}
                  handleMove={handleCarouselMove}
                  cardSize={cardSize}
                />
              );
            })}

            {/* Navigation */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-4">
              <button
                onClick={() => handleCarouselMove(-1)}
                className={cn(
                  "flex h-14 w-14 items-center justify-center transition-colors rounded-lg",
                  "bg-background border-2 border-border hover:bg-primary hover:text-primary-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
                aria-label="Previous feature"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleCarouselMove(1)}
                className={cn(
                  "flex h-14 w-14 items-center justify-center transition-colors rounded-lg",
                  "bg-background border-2 border-border hover:bg-primary hover:text-primary-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
                aria-label="Next feature"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <StaggerTestimonials />

      {/* CTA */}
      <section className="py-16 border-t border-border bg-accent/5">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-3">
            Ready to see it in action?
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Explore our demos or request a custom preview for your business.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="group">
              <Link to="/get-demo">
                Get a Demo
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/demos">See Examples</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-card mt-auto">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-serif text-sm text-muted-foreground">
            © {new Date().getFullYear()} Pleasant Cove Design
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="mailto:hello@pleasantcove.design" className="hover:text-foreground transition-colors">
              Contact
            </a>
            <Link to="/operator" className="hover:text-foreground transition-colors opacity-50 hover:opacity-100">
              Operator
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WhatWeBuild;
