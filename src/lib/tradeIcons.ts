import {
  Droplets,
  Zap,
  Home,
  Wind,
  Leaf,
  Paintbrush,
  SprayCan,
  UtensilsCrossed,
  Hammer,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

const tradeIconMap: Record<string, LucideIcon> = {
  plumber: Droplets,
  electrician: Zap,
  roofer: Home,
  hvac: Wind,
  landscaper: Leaf,
  painter: Paintbrush,
  cleaner: SprayCan,
  restaurant: UtensilsCrossed,
  contractor: Hammer,
  default: Briefcase,
};

export function getTradeIcon(templateType: string): LucideIcon {
  return tradeIconMap[templateType] || tradeIconMap.default;
}
