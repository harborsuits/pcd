// Demo theme system - 3 distinct visual styles
export type ThemeId = "classic" | "bold" | "premium";

export interface DemoTheme {
  id: ThemeId;
  name: string;
  description: string;
  // Hero styling
  heroBg: string;
  heroOverlay: string;
  heroText: string;
  heroSubtext: string;
  // Card styling
  cardBg: string;
  cardBorder: string;
  cardHover: string;
  cardRadius: string;
  // Button styling
  buttonPrimary: string;
  buttonSecondary: string;
  // Section styling
  sectionBg: string;
  // Typography
  headingWeight: string;
  bodySize: string;
  // Spacing
  sectionPadding: string;
}

export const themes: Record<ThemeId, DemoTheme> = {
  classic: {
    id: "classic",
    name: "Clean",
    description: "Clean and professional — great for service businesses",
    heroBg: "bg-gradient-to-br from-primary/5 via-background to-accent/5",
    heroOverlay: "",
    heroText: "text-foreground",
    heroSubtext: "text-muted-foreground",
    cardBg: "bg-card",
    cardBorder: "border-border",
    cardHover: "hover:border-primary/30 hover:shadow-md",
    cardRadius: "rounded-lg",
    buttonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
    buttonSecondary: "border border-border text-foreground hover:bg-muted",
    sectionBg: "bg-muted/30",
    headingWeight: "font-bold",
    bodySize: "text-base",
    sectionPadding: "py-12",
  },
  bold: {
    id: "bold",
    name: "Contractor",
    description: "Bold and confident — stands out for contractors",
    heroBg: "bg-gradient-to-br from-primary via-primary/95 to-primary/90",
    heroOverlay: "absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBzdHJva2Utb3BhY2l0eT0iMC4wNSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNncmlkKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-50",
    heroText: "text-primary-foreground",
    heroSubtext: "text-primary-foreground/80",
    cardBg: "bg-card",
    cardBorder: "border-transparent shadow-lg",
    cardHover: "hover:shadow-xl hover:-translate-y-1",
    cardRadius: "rounded-xl",
    buttonPrimary: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg",
    buttonSecondary: "bg-primary-foreground/10 text-primary-foreground border border-primary-foreground/20 hover:bg-primary-foreground/20",
    sectionBg: "bg-gradient-to-b from-muted/50 to-background",
    headingWeight: "font-extrabold",
    bodySize: "text-lg",
    sectionPadding: "py-16",
  },
  premium: {
    id: "premium",
    name: "Boutique",
    description: "Elegant and refined — perfect for premium services",
    heroBg: "bg-gradient-to-b from-secondary via-background to-background",
    heroOverlay: "",
    heroText: "text-foreground",
    heroSubtext: "text-muted-foreground",
    cardBg: "bg-card/50 backdrop-blur-sm",
    cardBorder: "border-border/50",
    cardHover: "hover:bg-card hover:border-accent/30",
    cardRadius: "rounded-2xl",
    buttonPrimary: "bg-foreground text-background hover:bg-foreground/90",
    buttonSecondary: "border border-foreground/20 text-foreground hover:border-foreground/40",
    sectionBg: "bg-secondary/30",
    headingWeight: "font-semibold",
    bodySize: "text-base",
    sectionPadding: "py-16",
  },
};

// Industry-specific hero images (Unsplash placeholders)
export const industryImages: Record<string, string> = {
  plumber: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=1200&h=600&fit=crop",
  roofer: "https://images.unsplash.com/photo-1632759145351-1d592919f522?w=1200&h=600&fit=crop",
  electrician: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&h=600&fit=crop",
  hvac: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=1200&h=600&fit=crop",
  restaurant: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=600&fit=crop",
  default: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=600&fit=crop",
};

// Get initials from business name for logo circle
export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(word => word.length > 0)
    .slice(0, 2)
    .map(word => word[0].toUpperCase())
    .join("");
}
