import React, { useEffect, useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'teal' | 'blue' | 'purple' | 'green' | 'red' | 'orange' | 'emerald' | 'rose';
  size?: 'sm' | 'md' | 'lg';
  width?: string | number;
  height?: string | number;
  customSize?: boolean;
}

const glowColorMap = {
  teal: { hue: 175, saturation: 80, lightness: 50 },
  blue: { hue: 220, saturation: 80, lightness: 50 },
  purple: { hue: 280, saturation: 80, lightness: 50 },
  green: { hue: 120, saturation: 80, lightness: 50 },
  red: { hue: 0, saturation: 80, lightness: 50 },
  orange: { hue: 30, saturation: 80, lightness: 50 },
  emerald: { hue: 160, saturation: 80, lightness: 50 },
  rose: { hue: 350, saturation: 70, lightness: 65 }
};

const sizeMap = {
  sm: 'w-48 h-64',
  md: 'w-64 h-80',
  lg: 'w-80 h-96'
};

const GlowCard: React.FC<GlowCardProps> = ({ 
  children, 
  className = '', 
  glowColor = 'teal',
  size = 'md',
  width,
  height,
  customSize = false
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncPointer = (e: PointerEvent) => {
      const { clientX: x, clientY: y } = e;
      
      if (cardRef.current) {
        cardRef.current.style.setProperty('--x', x.toFixed(2));
        cardRef.current.style.setProperty('--y', y.toFixed(2));
      }
    };

    document.addEventListener('pointermove', syncPointer);
    return () => document.removeEventListener('pointermove', syncPointer);
  }, []);

  const { hue, saturation, lightness } = glowColorMap[glowColor];

  const getSizeClasses = () => {
    if (customSize) {
      return '';
    }
    return sizeMap[size];
  };

  const inlineStyles: React.CSSProperties = {
    position: 'relative',
    ...(width !== undefined && { width: typeof width === 'number' ? `${width}px` : width }),
    ...(height !== undefined && { height: typeof height === 'number' ? `${height}px` : height }),
  };

  const glowStyles = `
    .glow-card-${glowColor} {
      --glow-hue: ${hue};
      --glow-sat: ${saturation}%;
      --glow-light: ${lightness}%;
      --spotlight-size: 200px;
      --border-width: 3px;
    }
    
    .glow-card-${glowColor}::before {
      content: "";
      position: absolute;
      inset: calc(var(--border-width) * -1);
      border-radius: inherit;
      padding: var(--border-width);
      background: radial-gradient(
        var(--spotlight-size) var(--spotlight-size) at
        calc(var(--x, 100) * 1px)
        calc(var(--y, 100) * 1px),
        hsl(var(--glow-hue) var(--glow-sat) var(--glow-light) / 0.9),
        hsl(var(--glow-hue) var(--glow-sat) var(--glow-light) / 0.3) 40%,
        transparent 70%
      );
      background-attachment: fixed;
      -webkit-mask: 
        linear-gradient(#fff 0 0) content-box, 
        linear-gradient(#fff 0 0);
      mask: 
        linear-gradient(#fff 0 0) content-box, 
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
      z-index: 1;
    }
    
    .glow-card-${glowColor}::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: radial-gradient(
        calc(var(--spotlight-size) * 0.6) calc(var(--spotlight-size) * 0.6) at
        calc(var(--x, 100) * 1px)
        calc(var(--y, 100) * 1px),
        hsl(var(--glow-hue) var(--glow-sat) var(--glow-light) / 0.08),
        transparent 60%
      );
      background-attachment: fixed;
      pointer-events: none;
      z-index: 0;
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: glowStyles }} />
      <div
        ref={cardRef}
        style={inlineStyles}
        className={cn(
          `glow-card-${glowColor}`,
          getSizeClasses(),
          !customSize && 'aspect-[3/4]',
          'rounded-2xl relative grid shadow-lg backdrop-blur-[5px] overflow-visible',
          className
        )}
      >
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </>
  );
};

export { GlowCard };
