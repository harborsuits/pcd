"use client";

import {
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScrollExpandMediaProps {
  mediaType?: "video" | "image";
  mediaSrc: string;
  posterSrc?: string;
  bgImageSrc?: string;
  title?: string;
  date?: string;
  scrollToExpand?: string;
  textBlend?: boolean;
  children?: ReactNode;
  className?: string;
}

const ScrollExpandMedia = ({
  mediaType = "video",
  mediaSrc,
  posterSrc,
  bgImageSrc,
  title = "The Golden Fork",
  date = "EST. 2015",
  scrollToExpand = "Scroll to explore",
  textBlend = false,
  children,
  className,
}: ScrollExpandMediaProps) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [mediaFullyExpanded, setMediaFullyExpanded] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [isMobileState, setIsMobileState] = useState(false);

  const sectionRef = useRef<HTMLDivElement>(null);

  // Reset on media type change
  useEffect(() => {
    setScrollProgress(0);
    setShowContent(false);
    setMediaFullyExpanded(false);
  }, [mediaType]);

  // Wheel and touch event handlers
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (mediaFullyExpanded && e.deltaY < 0 && window.scrollY <= 5) {
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!mediaFullyExpanded) {
        e.preventDefault();
        const scrollDelta = e.deltaY * 0.0009;
        const newProgress = Math.min(Math.max(scrollProgress + scrollDelta, 0), 1);
        setScrollProgress(newProgress);

        if (newProgress >= 1) {
          setMediaFullyExpanded(true);
          setShowContent(true);
        } else if (newProgress < 0.55) {
          setShowContent(false);
        }
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      setTouchStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartY) return;

      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;

      if (mediaFullyExpanded && deltaY < -20 && window.scrollY <= 5) {
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!mediaFullyExpanded) {
        e.preventDefault();
        const scrollFactor = deltaY < 0 ? 0.008 : 0.005;
        const scrollDelta = deltaY * scrollFactor;
        const newProgress = Math.min(Math.max(scrollProgress + scrollDelta, 0), 1);
        setScrollProgress(newProgress);

        if (newProgress >= 1) {
          setMediaFullyExpanded(true);
          setShowContent(true);
        } else if (newProgress < 0.55) {
          setShowContent(false);
        }

        setTouchStartY(touchY);
      }
    };

    const handleTouchEnd = (): void => {
      setTouchStartY(0);
    };

    const handleScroll = (): void => {
      if (!mediaFullyExpanded) {
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [scrollProgress, mediaFullyExpanded, touchStartY]);

  // Check if mobile
  useEffect(() => {
    const checkIfMobile = (): void => {
      setIsMobileState(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Calculate dimensions based on scroll progress
  const mediaWidth = 300 + scrollProgress * (isMobileState ? 650 : 1250);
  const mediaHeight = 400 + scrollProgress * (isMobileState ? 200 : 400);
  const textTranslateX = scrollProgress * (isMobileState ? 180 : 150);

  const firstWord = title ? title.split(" ")[0] : "";
  const restOfTitle = title ? title.split(" ").slice(1).join(" ") : "";

  return (
    <div className={cn("relative", className)}>
      {/* Fixed background */}
      {bgImageSrc && (
        <motion.div
          className="fixed inset-0 -z-10"
          animate={{ opacity: 1 }}
        >
          <img
            src={bgImageSrc}
            alt="Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/35" />
        </motion.div>
      )}

      <section
        ref={sectionRef}
        className="h-screen flex items-center justify-center sticky top-0 z-10 overflow-hidden"
      >
        <div className="flex flex-col items-center w-full relative">
          {/* Media container */}
          <div className="relative flex flex-col items-center transition-none">
            <motion.div
              className="overflow-hidden rounded-xl transition-none"
              animate={{
                width: `${mediaWidth}px`,
                height: `${mediaHeight}px`,
              }}
              transition={{ duration: 0.15, ease: "linear" }}
            >
              {mediaType === "video" ? (
                <div className="relative w-full h-full pointer-events-none">
                  <video
                    src={mediaSrc}
                    poster={posterSrc}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    className="w-full h-full object-cover rounded-xl"
                    controls={false}
                    disablePictureInPicture
                  />
                  <div
                    className="absolute inset-0 z-10"
                    style={{ pointerEvents: "none" }}
                  />
                  <motion.div
                    className="absolute inset-0 bg-black rounded-xl"
                    initial={{ opacity: 0.75 }}
                    animate={{ opacity: 0.65 - scrollProgress * 0.35 }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              ) : (
                <div className="relative w-full h-full">
                  <img
                    src={mediaSrc}
                    alt={title || "Media content"}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <motion.div
                    className="absolute inset-0 bg-black rounded-xl"
                    initial={{ opacity: 0.80 }}
                    animate={{ opacity: 0.75 - scrollProgress * 0.40 }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              )}

              {/* Date and scroll hint inside media */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 transition-none">
                {date && (
                  <motion.p
                    className="text-amber-400 font-medium tracking-widest uppercase text-sm drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
                    animate={{ 
                      opacity: 1 - scrollProgress * 1.5,
                      x: `-${textTranslateX}vw`
                    }}
                    transition={{ duration: 0.15 }}
                  >
                    {date}
                  </motion.p>
                )}
                {scrollToExpand && (
                  <motion.p
                    className="text-stone-100 font-medium text-center text-sm mt-2 animate-bounce drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
                    animate={{ 
                      opacity: 1 - scrollProgress * 2,
                      x: `${textTranslateX}vw`
                    }}
                    transition={{ duration: 0.15 }}
                  >
                    {scrollToExpand}
                  </motion.p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Title text that splits apart */}
          <div
            className={cn(
              "flex items-center justify-center text-center gap-4 w-full relative z-10 transition-none flex-col mt-6",
              textBlend ? "mix-blend-difference" : "mix-blend-normal"
            )}
          >
            <motion.h1
              className="font-serif text-5xl md:text-7xl lg:text-8xl text-stone-100 transition-none"
              style={{ textShadow: "0 4px 30px rgba(0,0,0,0.8), 0 2px 10px rgba(0,0,0,0.6)" }}
              animate={{ 
                opacity: 1 - scrollProgress * 1.5,
                x: `-${textTranslateX}vw`
              }}
              transition={{ duration: 0.15 }}
            >
              {firstWord}
            </motion.h1>
            <motion.h1
              className="font-serif text-5xl md:text-7xl lg:text-8xl text-center text-stone-100 transition-none"
              style={{ textShadow: "0 4px 30px rgba(0,0,0,0.8), 0 2px 10px rgba(0,0,0,0.6)" }}
              animate={{ 
                opacity: 1 - scrollProgress * 1.5,
                x: `${textTranslateX}vw`
              }}
              transition={{ duration: 0.15 }}
            >
              {restOfTitle}
            </motion.h1>
          </div>
        </div>
      </section>

      {/* Content section with glass backing */}
      <motion.section
        className="flex flex-col w-full px-6 md:px-16 py-10 lg:py-16 relative z-20"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 16 }}
        transition={{ duration: 0.55 }}
      >
        <div className="rounded-3xl bg-black/35 backdrop-blur-md border border-white/10 p-6 md:p-10 max-w-6xl mx-auto w-full">
          {children}
        </div>
      </motion.section>
    </div>
  );
};

export default ScrollExpandMedia;
