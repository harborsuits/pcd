import React from 'react';

interface ImageAutoSliderProps {
  images: { src: string; alt: string }[];
  className?: string;
}

export const ImageAutoSlider = ({ images, className = "" }: ImageAutoSliderProps) => {
  // Duplicate images for seamless loop
  const duplicatedImages = [...images, ...images];

  return (
    <>
      <style>{`
        @keyframes scroll-right {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .infinite-scroll {
          animation: scroll-right 30s linear infinite;
        }

        .infinite-scroll:hover {
          animation-play-state: paused;
        }

        .scroll-container {
          mask: linear-gradient(
            90deg,
            transparent 0%,
            black 5%,
            black 95%,
            transparent 100%
          );
          -webkit-mask: linear-gradient(
            90deg,
            transparent 0%,
            black 5%,
            black 95%,
            transparent 100%
          );
        }

        .image-item {
          transition: transform 0.3s ease, filter 0.3s ease;
        }

        .image-item:hover {
          transform: scale(1.05);
          filter: brightness(1.1);
        }
      `}</style>
      
      <div className={`relative w-full overflow-hidden scroll-container ${className}`}>
        <div className="flex infinite-scroll" style={{ width: 'max-content' }}>
          {duplicatedImages.map((image, index) => (
            <div 
              key={index} 
              className="image-item flex-shrink-0 px-3"
            >
              <div className="aspect-[4/5] w-64 md:w-72 rounded-3xl overflow-hidden shadow-sm">
                <img 
                  src={image.src} 
                  alt={image.alt}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
