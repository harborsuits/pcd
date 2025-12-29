import { cn } from "@/lib/utils";
import { Home, Wrench, Search, Shield, Clock, Phone, Hammer, HardHat } from "lucide-react";

interface FeatureItem {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface FeaturesSectionWithHoverEffectsProps {
  features?: FeatureItem[];
  className?: string;
  title?: string;
}

export function FeaturesSectionWithHoverEffects({
  features,
  className,
  title = "Our Services",
}: FeaturesSectionWithHoverEffectsProps) {
  const defaultFeatures: FeatureItem[] = [
    {
      title: "Roof Replacement",
      description: "Complete tear-off and installation with premium materials and manufacturer warranties.",
      icon: <Home className="h-8 w-8" />,
    },
    {
      title: "Roof Repair",
      description: "Fix leaks, storm damage, and worn shingles with expert precision.",
      icon: <Wrench className="h-8 w-8" />,
    },
    {
      title: "Inspections",
      description: "Comprehensive roof assessments and detailed reports for your peace of mind.",
      icon: <Search className="h-8 w-8" />,
    },
    {
      title: "Storm Damage",
      description: "24/7 emergency response for hail, wind, and severe weather damage.",
      icon: <Shield className="h-8 w-8" />,
    },
    {
      title: "Gutter Services",
      description: "Installation, repair, and cleaning to protect your home's foundation.",
      icon: <Hammer className="h-8 w-8" />,
    },
    {
      title: "Commercial Roofing",
      description: "Flat roofs, TPO, EPDM, and metal roofing for businesses of all sizes.",
      icon: <HardHat className="h-8 w-8" />,
    },
    {
      title: "Same-Day Estimates",
      description: "Fast, free quotes with transparent pricing and no hidden fees.",
      icon: <Clock className="h-8 w-8" />,
    },
    {
      title: "24/7 Support",
      description: "Round-the-clock emergency services when you need us most.",
      icon: <Phone className="h-8 w-8" />,
    },
  ];

  const items = features || defaultFeatures;

  return (
    <div className={cn("py-20 bg-slate-900", className)}>
      {title && (
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
          {title}
        </h2>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10 max-w-7xl mx-auto">
        {items.map((feature, index) => (
          <Feature key={feature.title} {...feature} index={index} />
        ))}
      </div>
    </div>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group/feature border-slate-700",
        (index === 0 || index === 4) && "lg:border-l border-slate-700",
        index < 4 && "lg:border-b border-slate-700"
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-slate-800 to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-slate-800 to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-orange-400">
        {icon}
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-slate-700 group-hover/feature:bg-orange-500 transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-white">
          {title}
        </span>
      </div>
      <p className="text-sm text-slate-400 max-w-xs relative z-10 px-10">
        {description}
      </p>
    </div>
  );
};
