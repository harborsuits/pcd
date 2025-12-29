"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface MediaItemType {
  id: number;
  type: "image" | "video";
  title: string;
  desc: string;
  url: string;
  span: string;
}

const MediaItem = ({
  item,
  className,
  onClick,
}: {
  item: MediaItemType;
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

interface GalleryModalProps {
  selectedItem: MediaItemType;
  isOpen: boolean;
  onClose: () => void;
  setSelectedItem: (item: MediaItemType | null) => void;
  mediaItems: MediaItemType[];
}

const GalleryModal = ({
  selectedItem,
  isOpen,
  onClose,
  setSelectedItem,
  mediaItems,
}: GalleryModalProps) => {
  const [dockPosition, setDockPosition] = useState({ x: 0, y: 0 });

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-background/90 backdrop-blur-xl"
      />

      {/* Main Modal */}
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
                  {selectedItem.desc}
                </motion.p>
              </div>
            </div>
          </div>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 md:top-12 md:right-12 z-50 p-2 rounded-full bg-card/80 border border-border/50 text-foreground hover:bg-card transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </motion.div>

      {/* Draggable Dock */}
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
            {mediaItems.map((item, index) => (
              <motion.div
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItem(item);
                }}
                style={{
                  zIndex:
                    selectedItem.id === item.id ? 30 : mediaItems.length - index,
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
                    // Fallback for videos without thumbnail
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

interface InteractiveBentoGalleryProps {
  mediaItems: MediaItemType[];
  title: string;
  description: string;
}

const InteractiveBentoGallery: React.FC<InteractiveBentoGalleryProps> = ({
  mediaItems,
  title,
  description,
}) => {
  const [selectedItem, setSelectedItem] = useState<MediaItemType | null>(null);
  const [items, setItems] = useState(mediaItems);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <section className="relative w-full min-h-[80vh] py-16 overflow-hidden bg-gradient-to-b from-background via-primary/5 to-background">
      {/* Subtle accent glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-accent/10 blur-3xl opacity-60" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
            {title}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            {description}
          </p>
        </div>

        {/* Gallery */}
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {selectedItem ? (
              <GalleryModal
                selectedItem={selectedItem}
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                setSelectedItem={setSelectedItem}
                mediaItems={items}
              />
            ) : (
              <motion.div
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[180px] md:auto-rows-[200px]"
              >
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    className={`relative overflow-hidden rounded-xl bg-card/50 border border-border/30 backdrop-blur-sm ${item.span}`}
                    onClick={() => !isDragging && setSelectedItem(item)}
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
                    onDragEnd={(_, info) => {
                      setIsDragging(false);
                      const moveDistance = info.offset.x + info.offset.y;
                      if (Math.abs(moveDistance) > 50) {
                        const newItems = [...items];
                        const draggedItem = newItems[index];
                        const targetIndex =
                          moveDistance > 0
                            ? Math.min(index + 1, items.length - 1)
                            : Math.max(index - 1, 0);

                        newItems.splice(index, 1);
                        newItems.splice(targetIndex, 0, draggedItem);
                        setItems(newItems);
                      }
                    }}
                  >
                    <MediaItem
                      item={item}
                      className="absolute inset-0 w-full h-full"
                      onClick={() => !isDragging && setSelectedItem(item)}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-foreground font-semibold text-sm md:text-base">
                          {item.title}
                        </h3>
                        <p className="text-muted-foreground text-xs md:text-sm">
                          {item.desc}
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
  );
};

export default InteractiveBentoGallery;
