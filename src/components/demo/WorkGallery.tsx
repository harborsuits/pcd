import { Camera } from "lucide-react";

interface WorkGalleryProps {
  templateType: string;
  businessName: string;
  photoReferences?: string[];
}

// Build proxy URL for Google Place photos
function getPhotoUrl(photoRef: string, width: number = 400): string {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${baseUrl}/functions/v1/place-photo?ref=${encodeURIComponent(photoRef)}&w=${width}`;
}

// Industry-specific placeholder work images (fallback when no Google photos)
const galleryImages: Record<string, { src: string; label: string }[]> = {
  plumber: [
    { src: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&h=300&fit=crop", label: "Water Heater Installation" },
    { src: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400&h=300&fit=crop", label: "Pipe Repair" },
    { src: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=300&fit=crop", label: "Bathroom Remodel" },
    { src: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=300&fit=crop", label: "Drain Cleaning" },
    { src: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&h=300&fit=crop", label: "Fixture Installation" },
    { src: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop", label: "Emergency Repair" },
  ],
  roofer: [
    { src: "https://images.unsplash.com/photo-1632759145351-1d592919f522?w=400&h=300&fit=crop", label: "Roof Replacement" },
    { src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop", label: "Shingle Repair" },
    { src: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop", label: "Storm Damage" },
    { src: "https://images.unsplash.com/photo-1605276373954-0c4a0dac5b12?w=400&h=300&fit=crop", label: "Gutter Installation" },
    { src: "https://images.unsplash.com/photo-1632759145351-1d592919f522?w=400&h=300&fit=crop", label: "Inspection" },
    { src: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop", label: "Metal Roofing" },
  ],
  electrician: [
    { src: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop", label: "Panel Upgrade" },
    { src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop", label: "Wiring Install" },
    { src: "https://images.unsplash.com/photo-1565608087341-404b25492fee?w=400&h=300&fit=crop", label: "Lighting" },
    { src: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop", label: "Safety Inspection" },
    { src: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop", label: "Generator Setup" },
    { src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop", label: "Outlet Installation" },
  ],
  default: [
    { src: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop", label: "Recent Project" },
    { src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop", label: "Quality Work" },
    { src: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop", label: "Professional Service" },
    { src: "https://images.unsplash.com/photo-1605276373954-0c4a0dac5b12?w=400&h=300&fit=crop", label: "Expert Installation" },
    { src: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop", label: "Completed Job" },
    { src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop", label: "Customer Project" },
  ],
};

export function WorkGallery({ templateType, businessName, photoReferences = [] }: WorkGalleryProps) {
  // Use real Google photos if available, otherwise fall back to placeholders
  const hasRealPhotos = photoReferences.length > 0;
  
  const images = hasRealPhotos
    ? photoReferences.slice(0, 6).map((ref, i) => ({
        src: getPhotoUrl(ref, 400),
        label: `Photo ${i + 1}`,
        isReal: true,
      }))
    : (galleryImages[templateType] || galleryImages.default).map(img => ({
        ...img,
        isReal: false,
      }));

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-accent mb-2">
              <Camera className="w-5 h-5" />
              <span className="text-sm font-medium uppercase tracking-wide">Our Work</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              Recent Projects
            </h2>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div
                key={index}
                className="relative group overflow-hidden rounded-xl aspect-[4/3]"
              >
                <img
                  src={image.src}
                  alt={image.label}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white text-sm font-medium">{image.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <p className="text-center text-xs text-muted-foreground/60 mt-6">
            {hasRealPhotos 
              ? `Photos from Google for ${businessName}`
              : `Example work images — we can replace with photos from ${businessName}`
            }
          </p>
        </div>
      </div>
    </section>
  );
}
