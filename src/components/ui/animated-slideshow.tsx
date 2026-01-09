"use client";

import * as React from "react";
import { MotionConfig, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TextStaggerHoverProps {
  text: string;
  index: number;
}

interface HoverSliderImageProps {
  index: number;
  imageUrl: string;
}

interface HoverSliderContextValue {
  activeSlide: number;
  changeSlide: (index: number) => void;
}

function splitText(text: string) {
  const words = text.split(" ").map((word) => word.concat(" "));
  const characters = words.map((word) => word.split("")).flat(1);

  return {
    words,
    characters,
  };
}

const HoverSliderContext = React.createContext<HoverSliderContextValue | undefined>(undefined);

function useHoverSliderContext() {
  const context = React.useContext(HoverSliderContext);
  if (context === undefined) {
    throw new Error("useHoverSliderContext must be used within a HoverSliderProvider");
  }
  return context;
}

export const HoverSlider = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className, ...props }, ref) => {
  const [activeSlide, setActiveSlide] = React.useState(0);
  const changeSlide = React.useCallback(
    (index: number) => setActiveSlide(index),
    [setActiveSlide]
  );
  return (
    <HoverSliderContext.Provider value={{ activeSlide, changeSlide }}>
      <MotionConfig transition={{ duration: 0.5, ease: "easeInOut" }}>
        <section ref={ref} className={cn("relative", className)} {...props}>
          {children}
        </section>
      </MotionConfig>
    </HoverSliderContext.Provider>
  );
});
HoverSlider.displayName = "HoverSlider";

const WordStaggerHover = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ children, className, ...props }, ref) => {
  return (
    <span ref={ref} className={cn("relative overflow-hidden inline-block", className)} {...props}>
      {children}
    </span>
  );
});
WordStaggerHover.displayName = "WordStaggerHover";

export const TextStaggerHover = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & TextStaggerHoverProps
>(({ text, index, children, className, ...props }, ref) => {
  const { activeSlide, changeSlide } = useHoverSliderContext();
  const { characters } = splitText(text);
  const isActive = activeSlide === index;
  const handleMouse = () => changeSlide(index);
  
  return (
    <div
      ref={ref}
      onMouseEnter={handleMouse}
      className={cn(
        "flex flex-wrap text-3xl md:text-4xl lg:text-5xl font-medium cursor-pointer transition-opacity duration-300",
        isActive ? "opacity-100" : "opacity-40 hover:opacity-70",
        className
      )}
      {...props}
    >
      {characters.map((char, charIndex) => (
        <WordStaggerHover key={charIndex}>
          <motion.span
            className="flex flex-col"
            animate={isActive ? "active" : "inactive"}
            variants={{
              active: { y: "-50%" },
              inactive: { y: "0%" },
            }}
            transition={{ delay: charIndex * 0.02 }}
          >
            <span className="text-slate-400">
              {char}
              {char === " " && charIndex < characters.length - 1 && <>&nbsp;</>}
            </span>
            <span className="text-slate-900 dark:text-white">
              {char}
            </span>
          </motion.span>
        </WordStaggerHover>
      ))}
    </div>
  );
});
TextStaggerHover.displayName = "TextStaggerHover";

export const clipPathVariants = {
  visible: {
    clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
  },
  hidden: {
    clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0px)",
  },
};

export const HoverSliderImageWrap = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "grid aspect-[3/4] w-full overflow-hidden rounded-xl [&>*]:col-start-1 [&>*]:col-end-1 [&>*]:row-start-1 [&>*]:row-end-1 [&>*]:size-full",
        className
      )}
      {...props}
    />
  );
});
HoverSliderImageWrap.displayName = "HoverSliderImageWrap";

export const HoverSliderImage = React.forwardRef<
  HTMLImageElement,
  React.ComponentProps<typeof motion.img> & HoverSliderImageProps
>(({ index, imageUrl, children, className, ...props }, ref) => {
  const { activeSlide } = useHoverSliderContext();
  return (
    <motion.img
      ref={ref}
      src={imageUrl}
      alt=""
      variants={clipPathVariants}
      animate={index <= activeSlide ? "visible" : "hidden"}
      className={cn("h-full w-full object-cover", className)}
      {...props}
    />
  );
});
HoverSliderImage.displayName = "HoverSliderImage";
