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
    <div className={cn("py-16 bg-slate-800", className)}>
      <div className="mx-auto max-w-5xl px-6">
        {title && (
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-white">
            {title}
          </h2>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-12">
          {items.map((feature, index) => (
            <Feature key={feature.title} {...feature} index={index} />
          ))}
        </div>
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
    <div className="flex flex-col items-center text-center group/feature">
      <div className="mb-6 text-orange-400 group-hover/feature:scale-110 transition-transform duration-200">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3 text-white group-hover/feature:text-orange-400 transition-colors duration-200">
        {title}
      </h3>
      <p className="text-sm text-slate-400 max-w-sm">
        {description}
      </p>
    </div>
  );
};
