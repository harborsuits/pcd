import { MapPin } from "lucide-react";

interface ServiceAreaBlockProps {
  city: string;
  state?: string;
  nearbyTowns?: string[];
}

export function ServiceAreaBlock({ city, state, nearbyTowns = [] }: ServiceAreaBlockProps) {
  // Generate nearby towns if not provided
  const defaultNearbyTowns = [
    "Surrounding areas",
    "Nearby communities"
  ];
  
  const towns = nearbyTowns.length > 0 ? nearbyTowns : defaultNearbyTowns;
  const locationString = state ? `${city}, ${state}` : city;
  
  return (
    <section className="bg-accent/5 border-y border-accent/10">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-foreground">Service Area</h3>
        </div>
        <p className="text-center text-muted-foreground">
          Proudly serving <span className="font-medium text-foreground">{locationString}</span>
          {towns.length > 0 && (
            <span>, {towns.slice(0, 3).join(", ")}</span>
          )}
        </p>
      </div>
    </section>
  );
}
