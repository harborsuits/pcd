import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, ChevronLeft, ChevronRight, Globe, FolderOpen, CalendarCheck, Zap, Bot, Puzzle, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";
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
    shortDesc: "Your public-facing site — fast, modern, and built around how real customers find and contact you.",
    subtitle: "Designed to explain what you do clearly, guide visitors to the right next step, and work seamlessly with your AI receptionist.",
    bullets: [
      "Marketing sites that explain what you do in seconds, not paragraphs",
      "Service pages that answer questions before the phone rings",
      "Landing pages for specific offers, locations, or campaigns",
      "Clean, SEO-ready foundations without bloated plugins",
      "Built to work with your booking and intake flow",
    ],
    url: websitesConvertVideo,
    span: "md:col-span-2 md:row-span-2 col-span-2 row-span-2",
    icon: Globe,
  },
  {
    id: "ai",
    type: "video",
    title: "AI Front Door",
    shortDesc: "An AI-powered front door for your business that handles first contact automatically.",
    subtitle: "Answers questions, captures leads, and routes requests — when you're unavailable or focused on work.",
    bullets: [
      "Answers common questions instantly (services, hours, pricing ranges, next steps)",
      "Responds to calls, texts, and messages when you're unavailable",
      "Collects structured lead information before handing off or booking",
      "Routes high-intent requests appropriately",
      "Always clearly identified as AI — no pretending",
    ],
    url: aiFrontDoorVideo,
    span: "md:col-span-2 md:row-span-1 col-span-1 row-span-1",
    icon: Bot,
  },
  {
    id: "booking",
    type: "image",
    title: "Booking + Intake",
    shortDesc: "Smart booking and intake flows that replace back-and-forth emails and missed details.",
    subtitle: "You start projects with context — not confusion.",
    bullets: [
      "Online booking connected to your existing calendar",
      "Intake forms that gather the right information upfront",
      "Automated confirmations and next steps for clients",
      "Routing based on service type or request",
      "Seamless handoff into your workflow",
    ],
    url: "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1400&q=80",
    span: "md:col-span-1 md:row-span-1 col-span-1 row-span-1",
    icon: CalendarCheck,
  },
  {
    id: "portals",
    type: "video",
    title: "Client Portal",
    shortDesc: "A private workspace where clients can message you, share files, view progress, and make payments — all in one place.",
    subtitle: "One shared thread instead of scattered emails.",
    bullets: [
      "Messages, files, approvals, and updates in one place",
      "Clear visibility into what's done and what's next",
      "Fewer follow-ups, fewer misunderstandings",
      "Built to scale from one project to many",
      "Reduces friction on both sides",
    ],
    url: clientPortalsVideo,
    span: "md:col-span-1 md:row-span-1 col-span-1 row-span-1",
    icon: FolderOpen,
  },
  {
    id: "automations",
    type: "video",
    title: "Automations",
    shortDesc: "Quiet systems that remove friction — not control.",
    subtitle: "Built to support your work, not replace it.",
    bullets: [
      "Automatic confirmations and status updates",
      "File upload reminders when something is missing",
      "Internal notifications so nothing slips through cracks",
      "Fewer manual steps, fewer mistakes",
      "You stay in control of what matters",
    ],
    url: officeVideo,
    span: "md:col-span-2 md:row-span-1 col-span-1 row-span-1",
    icon: Zap,
  },
  {
    id: "custom",
    type: "image",
    title: "Custom & Integrations",
    shortDesc: "Built around how you actually work.",
    subtitle: "The system adapts to your business — not the other way around.",
    bullets: [
      "Integrations with tools you already use",
      "Custom workflows for unique processes",
      "Flexible enough to evolve as your business grows",
      "No rigid platforms forcing bad habits",
      "Modular — use what you need, skip what you don't",
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

// Calculate which index is the visual "center" for the stagger effect
// For 6 items with position = index - length/2, the center (position 0) is at index 3
const getCenterIndex = (length: number) => Math.floor(length / 2);

// Create initial carousel order with "Websites" (index 0) centered
const getInitialCarouselOrder = () => {
  const centerPos = getCenterIndex(FEATURES.length);
  // We need index 0 to appear at centerPos (index 3 for 6 items)
  // So we rotate by -(centerPos) positions, which means moving last items to front
  const rotations = centerPos; // Move 3 items from end to start
  let items = [...FEATURES];
  for (let i = 0; i < rotations; i++) {
    const last = items.pop();
    if (last) items.unshift({ ...last });
  }
  return items;
};

const WhatWeBuild = () => {
  // Shared state
  const [activeId, setActiveId] = useState<string>(FEATURES[0].id);
  const [selectedItem, setSelectedItem] = useState<FeatureItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cardSize, setCardSize] = useState(340);
  const [carouselItems, setCarouselItems] = useState(getInitialCarouselOrder);
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
    
    // Find where this item needs to be in the array for it to appear centered
    const targetFeatureIndex = FEATURES.findIndex(f => f.id === item.id);
    const centerPos = getCenterIndex(FEATURES.length);
    
    // Calculate how many positions to rotate
    // We need targetFeatureIndex to end up at centerPos
    const rotations = targetFeatureIndex - centerPos;
    
    // Rotate the array
    let newItems = [...FEATURES];
    if (rotations > 0) {
      // Move items from start to end
      for (let i = 0; i < rotations; i++) {
        const first = newItems.shift();
        if (first) newItems.push({ ...first });
      }
    } else if (rotations < 0) {
      // Move items from end to start
      for (let i = 0; i < Math.abs(rotations); i++) {
        const last = newItems.pop();
        if (last) newItems.unshift({ ...last });
      }
    }
    
    setCarouselItems(newItems);
    
    // Scroll to carousel section
    if (carouselRef.current) {
      carouselRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isDragging]);

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
    const centerIndex = getCenterIndex(newList.length);
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
    <div className="min-h-screen flex flex-col bg-page-bg text-foreground">
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
      <section className="relative w-full min-h-[80vh] py-16 overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-3 text-foreground">
              What We Build
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Tools that help you look sharp and run smooth.
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
                  {FEATURES.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.id}
                        className={cn(
                          "group relative overflow-hidden rounded-xl bg-card/50 border backdrop-blur-sm cursor-pointer",
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
                          scale: 1.02,
                          y: -4,
                          transition: { type: "spring", stiffness: 400, damping: 25 }
                        }}
                      >
                        {/* Media with consistent overlay */}
                        <MediaItem
                          item={item}
                          className="absolute inset-0 w-full h-full"
                        />
                        
                        {/* Consistent dark overlay for all cards */}
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-background/10 group-hover:from-background/95 group-hover:via-background/40 transition-all duration-300" />

                        {/* Content overlay */}
                        <div className="absolute inset-0 flex flex-col justify-end p-4">
                          {/* Icon badge */}
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-md bg-accent/20 flex items-center justify-center">
                              <Icon className="h-3.5 w-3.5 text-accent" />
                            </div>
                            <h3 className="text-foreground font-bold text-sm md:text-base">
                              {item.title}
                            </h3>
                          </div>
                          <p className="text-muted-foreground text-xs md:text-sm mb-2">
                            {item.shortDesc}
                          </p>
                          
                          {/* View details micro-cue */}
                          <div className="flex items-center gap-1 text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <span>View details</span>
                            <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Feature Carousel - synced with gallery */}
      <section ref={carouselRef} className="relative w-full py-16 overflow-hidden">
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Details header */}
          <div className="text-center mb-8">
            <p className="text-sm uppercase tracking-wider text-accent mb-2">Here's what that includes</p>
            <h3 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
              {FEATURES.find(f => f.id === activeId)?.title || "Explore Features"}
            </h3>
          </div>
          
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

      {/* What Clients Say */}
      <section className="py-16 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="text-center mb-4">
            <p className="text-sm uppercase tracking-wider text-accent mb-2">What Clients Say</p>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
              Real Results, Real Feedback
            </h2>
          </div>
          <AnimatedTestimonials
            testimonials={[
              {
                quote: "The attention to detail and innovative features have completely transformed our workflow. This is exactly what we've been looking for.",
                name: "Sarah Chen",
                designation: "Product Manager at TechFlow",
                src: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=3560&auto=format&fit=crop",
              },
              {
                quote: "Implementation was seamless and the results exceeded our expectations. The platform's flexibility is remarkable.",
                name: "Michael Rodriguez",
                designation: "CTO at InnovateSphere",
                src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=3540&auto=format&fit=crop",
              },
              {
                quote: "This solution has significantly improved our team's productivity. The intuitive interface makes complex tasks simple.",
                name: "Emily Watson",
                designation: "Operations Director at CloudScale",
                src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=3540&auto=format&fit=crop",
              },
              {
                quote: "Outstanding support and robust features. It's rare to find a product that delivers on all its promises.",
                name: "James Kim",
                designation: "Engineering Lead at DataPro",
                src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=3464&auto=format&fit=crop",
              },
              {
                quote: "The scalability and performance have been game-changing for our organization. Highly recommend to any growing business.",
                name: "Lisa Thompson",
                designation: "VP of Technology at FutureNet",
                src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=2592&auto=format&fit=crop",
              },
            ]}
            autoplay
          />
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-6">
            Ready to see yours?
          </h2>
          <Button asChild size="lg" className="group">
            <Link to="/get-demo">
              Get Your Demo
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-auto">
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
