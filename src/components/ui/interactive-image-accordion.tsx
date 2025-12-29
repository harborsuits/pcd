import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface AccordionItemData {
  id: number;
  category: string;
  title: string;
  imageUrl: string;
  demoUrl: string;
}

interface AccordionItemProps {
  item: AccordionItemData;
  isActive: boolean;
  onMouseEnter: () => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ item, isActive, onMouseEnter }) => {
  return (
    <div
      onMouseEnter={onMouseEnter}
      className={`
        relative overflow-hidden rounded-2xl cursor-pointer
        transition-all duration-500 ease-in-out
        ${isActive ? 'flex-[3]' : 'flex-[1]'}
        min-h-[400px] md:min-h-[500px]
      `}
    >
      {/* Background Image */}
      <img
        src={item.imageUrl}
        alt={item.title}
        className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = 'https://placehold.co/400x500/e8f5e9/2d5a47?text=' + item.title[0];
        }}
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Content */}
      <div className={`
        absolute bottom-0 left-0 right-0 p-6
        transition-all duration-500
        ${isActive ? 'opacity-100 translate-y-0' : 'opacity-70 translate-y-2'}
      `}>
        <span className="text-xs font-semibold uppercase tracking-wider text-primary/90 mb-1 block">
          {item.category}
        </span>
        <h3 className={`
          font-serif text-white mb-3
          transition-all duration-500
          ${isActive ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl'}
        `}>
          {item.title}
        </h3>
        <Link
          to={item.demoUrl}
          className={`
            inline-flex items-center gap-2 text-white/90 hover:text-white
            text-sm font-medium transition-all duration-300
            ${isActive ? 'opacity-100' : 'opacity-0'}
          `}
        >
          View Demo <ArrowRight className="w-4 h-4" />
        </Link>
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
    imageUrl: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=800&auto=format&fit=crop',
    demoUrl: '/d/test-acme-plumbing-2024/acme-plumbing',
  },
  {
    id: 2,
    category: 'Local Dining',
    title: 'Restaurant',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop',
    demoUrl: '/d/test-acme-plumbing-2024/acme-plumbing',
  },
  {
    id: 3,
    category: 'Personal Care',
    title: 'Salon',
    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop',
    demoUrl: '/d/test-acme-plumbing-2024/acme-plumbing',
  },
];

export const FeaturedDemosAccordion: React.FC<FeaturedDemosAccordionProps> = ({ 
  items = defaultItems 
}) => {
  const [activeIndex, setActiveIndex] = useState(1);

  return (
    <div className="flex gap-4 w-full">
      {items.map((item, index) => (
        <AccordionItem
          key={item.id}
          item={item}
          isActive={index === activeIndex}
          onMouseEnter={() => setActiveIndex(index)}
        />
      ))}
    </div>
  );
};

export { AccordionItem };
export type { AccordionItemData };
