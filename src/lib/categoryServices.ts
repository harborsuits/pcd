// Maps Google Place types and categories to realistic service lists

export const categoryServicesMap: Record<string, string[]> = {
  // Plumbing
  plumber: [
    "Emergency Plumbing Repairs",
    "Drain Cleaning & Unclogging",
    "Water Heater Installation & Repair",
    "Leak Detection & Pipe Repair",
    "Bathroom & Kitchen Remodels",
    "Sewer Line Services",
  ],
  
  // Roofing
  roofer: [
    "Roof Repairs & Patching",
    "Full Roof Replacement",
    "Storm Damage Assessment",
    "Gutter Installation & Cleaning",
    "Roof Inspections",
    "Metal & Shingle Roofing",
  ],
  
  // Electrical
  electrician: [
    "Electrical Panel Upgrades",
    "Wiring & Rewiring",
    "Lighting Installation",
    "Outlet & Switch Repair",
    "Generator Installation",
    "Safety Inspections",
  ],
  
  // HVAC
  hvac: [
    "AC Repair & Installation",
    "Heating System Service",
    "Ductwork Cleaning",
    "Thermostat Installation",
    "Indoor Air Quality",
    "Emergency HVAC Service",
  ],
  
  // Landscaping
  landscaper: [
    "Lawn Maintenance",
    "Landscape Design",
    "Tree & Shrub Care",
    "Irrigation Systems",
    "Hardscaping & Patios",
    "Seasonal Cleanup",
  ],
  
  // Painting
  painter: [
    "Interior Painting",
    "Exterior Painting",
    "Cabinet Refinishing",
    "Deck Staining",
    "Wallpaper Removal",
    "Color Consultation",
  ],
  
  // Cleaning
  cleaner: [
    "Residential Cleaning",
    "Deep Cleaning",
    "Move-In/Move-Out Cleaning",
    "Office Cleaning",
    "Carpet Cleaning",
    "Window Cleaning",
  ],
  
  // Restaurant
  restaurant: [
    "Dine-In Service",
    "Takeout & Pickup",
    "Catering Services",
    "Private Events",
    "Online Ordering",
    "Delivery Available",
  ],
  
  // General contractor
  contractor: [
    "Home Renovations",
    "Kitchen Remodeling",
    "Bathroom Remodeling",
    "Additions & Extensions",
    "Deck & Patio Building",
    "General Repairs",
  ],
  
  // Default fallback
  default: [
    "Professional Service",
    "Quality Workmanship",
    "Free Estimates",
    "Licensed & Insured",
    "Satisfaction Guaranteed",
    "Competitive Pricing",
  ],
};

// Get services for a template type
export function getServicesForTemplate(templateType: string): string[] {
  return categoryServicesMap[templateType] || categoryServicesMap.default;
}

// Try to infer template from Google types or category string
export function inferTemplateFromCategory(category: string | null, googleTypes: string[] = []): string {
  const combined = [category?.toLowerCase() || "", ...googleTypes.map(t => t.toLowerCase())].join(" ");
  
  if (combined.includes("plumb")) return "plumber";
  if (combined.includes("roof")) return "roofer";
  if (combined.includes("electr")) return "electrician";
  if (combined.includes("hvac") || combined.includes("heating") || combined.includes("air_condition")) return "hvac";
  if (combined.includes("landscap") || combined.includes("lawn") || combined.includes("garden")) return "landscaper";
  if (combined.includes("paint")) return "painter";
  if (combined.includes("clean") || combined.includes("maid") || combined.includes("janitorial")) return "cleaner";
  if (combined.includes("restaurant") || combined.includes("food") || combined.includes("cafe") || combined.includes("bakery")) return "restaurant";
  if (combined.includes("contractor") || combined.includes("construction") || combined.includes("remodel")) return "contractor";
  
  return "default";
}

// Generate a tagline based on template and location
export function generateTagline(templateType: string, city: string): string {
  const taglines: Record<string, string> = {
    plumber: `Professional plumbing services for ${city} homes and businesses`,
    roofer: `Trusted roofing solutions protecting ${city} properties`,
    electrician: `Reliable electrical services for ${city} residential and commercial`,
    hvac: `Keeping ${city} comfortable year-round`,
    landscaper: `Creating beautiful outdoor spaces in ${city}`,
    painter: `Quality painting services transforming ${city} homes`,
    cleaner: `Spotless cleaning services for ${city} homes and offices`,
    restaurant: `Delicious food served fresh in ${city}`,
    contractor: `Quality home improvements for ${city} homeowners`,
    default: `Quality service you can trust in ${city}`,
  };
  
  return taglines[templateType] || taglines.default;
}
