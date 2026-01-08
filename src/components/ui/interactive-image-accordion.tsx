import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import rooferImage from '@/assets/demos/roofer-hero.jpeg';
import galleryCoverVideo from '@/assets/demos/gallery-cover.mp4';
import salonCoverVideo from '@/assets/demos/salon-cover.mp4';
import boutiqueCoverVideo from '@/assets/demos/boutique-cover.mp4';
import restaurantCoverVideo from '@/assets/demos/restaurant-cover.mp4';

interface AccordionItemData {
  id: number;
  category: string;
  title: string;
  imageUrl?: string;
  videoUrl?: string;
  demoUrl: string;
}

interface AccordionItemProps {
  item: AccordionItemData;
  isActive: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ item, isActive, onMouseEnter, onClick }) => {
  return (
    <div
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl cursor-pointer
        transition-all duration-500 ease-in-out
        ${isActive ? 'flex-[3]' : 'flex-[1]'}
        min-h-[400px] md:min-h-[500px]
      `}
    >
      {/* Background Image or Video */}
      {item.videoUrl ? (
        <video
          src={item.videoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <img
          src={item.imageUrl}
          alt={item.title}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://placehold.co/400x500/e8f5e9/2d5a47?text=' + item.title[0];
          }}
        />
      )}
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Content */}
      <div className={`
        absolute bottom-0 left-0 right-0 p-6
        transition-all duration-500
        ${isActive ? 'opacity-100 translate-y-0' : 'opacity-70 translate-y-2'}
      `}>
        <h3 className={`
          font-serif text-white mb-3
          transition-all duration-500
          ${isActive ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl'}
        `}>
          {item.title}
        </h3>
        <span
          className={`
            inline-flex items-center gap-2 text-white/90 hover:text-white
            text-sm font-medium transition-all duration-300
            ${isActive ? 'opacity-100' : 'opacity-0'}
          `}
        >
          View Demo <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </div>
  );
};

interface FeaturedDemosAccordionProps {
  items?: AccordionItemData[];
}

const defaultItems: AccordionItemData[] = [
  {
    id: 1,
    category: 'Contractor',
    title: 'Roofer',
    imageUrl: rooferImage,
    demoUrl: '/demos/roofer',
  },
  {
    id: 2,
    category: 'Local Dining',
    title: 'Restaurant',
    videoUrl: restaurantCoverVideo,
    demoUrl: '/demos/restaurant',
  },
  {
    id: 3,
    category: 'Personal Care',
    title: 'Salon',
    videoUrl: salonCoverVideo,
    demoUrl: '/demos/salon',
  },
  {
    id: 4,
    category: 'Art & Culture',
    title: 'Gallery',
    videoUrl: galleryCoverVideo,
    demoUrl: '/demos/gallery',
  },
  {
    id: 5,
    category: 'Retail',
    title: 'Boutique',
    videoUrl: boutiqueCoverVideo,
    demoUrl: '/demos/boutique',
  },
];

export const FeaturedDemosAccordion: React.FC<FeaturedDemosAccordionProps> = ({ 
  items = defaultItems 
}) => {
  const [activeIndex, setActiveIndex] = useState(1);
  const navigate = useNavigate();

  const handleClick = (demoUrl: string) => {
    navigate(demoUrl);
  };

  return (
    <div className="flex gap-4 w-full">
      {items.map((item, index) => (
        <AccordionItem
          key={item.id}
          item={item}
          isActive={index === activeIndex}
          onMouseEnter={() => setActiveIndex(index)}
          onClick={() => handleClick(item.demoUrl)}
        />
      ))}
    </div>
  );
};

export { AccordionItem };
export type { AccordionItemData };
