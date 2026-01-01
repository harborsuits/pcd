import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import woolCardigan from "@/assets/boutique/wool-cardigan.jpg";
import leatherTote from "@/assets/boutique/leather-tote.jpg";
import balletFlats from "@/assets/boutique/ballet-flats.jpg";
import silkScarf from "@/assets/boutique/silk-scarf.jpg";

const products = {
  "wool-cardigan": {
    name: "Hand-Knit Wool Cardigan",
    price: "$595",
    subtitle: "Maine wool • hand-finished",
    image: woolCardigan,
    description: "Spun from Maine wool and finished by hand in our coastal studio. Each stitch considered. Each button sourced from local artisans. A piece that softens with wear and improves with age.",
    details: ["100% Maine wool", "Hand-finished seams", "Artisan bone buttons", "Relaxed fit", "Dry clean recommended"]
  },
  "leather-tote": {
    name: "Artisan Leather Tote",
    price: "$685",
    subtitle: "Vegetable-tanned • hand-stitched",
    image: leatherTote,
    description: "Full-grain leather, vegetable-tanned over six weeks. No shortcuts. Hand-stitched with waxed linen thread. Develops a rich patina unique to you.",
    details: ["Full-grain vegetable-tanned leather", "Hand-stitched with waxed linen", "Brass hardware", "Unlined interior", "Made to order"]
  },
  "ballet-flats": {
    name: "Woven Leather Ballet Flats",
    price: "$385",
    subtitle: "Italian leather • hand-woven",
    image: balletFlats,
    description: "Italian leather strips, hand-woven by a third-generation craftsman. Flexible, breathable, and sculptural. Worn barefoot or with intention.",
    details: ["Italian vegetable-tanned leather", "Hand-woven upper", "Leather-wrapped sole", "Cushioned insole", "True to size"]
  },
  "silk-scarf": {
    name: "Silk Coastal Scarf",
    price: "$245",
    subtitle: "Mulberry silk • hand-dyed",
    image: silkScarf,
    description: "Mulberry silk, hand-dyed in small batches using plant-based pigments. Each piece carries subtle variations—proof of the hand that made it.",
    details: ["100% Mulberry silk", "Hand-dyed with plant pigments", "Hand-rolled edges", "36\" × 36\"", "Dry clean only"]
  }
};

const BoutiqueProductPage = () => {
  const { slug } = useParams<{ slug: string }>();
  
  const product = slug ? products[slug as keyof typeof products] : null;
  
  if (!product) {
    return <Navigate to="/demos/boutique" replace />;
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-orange-200/50 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link 
            to="/demos/boutique" 
            className="text-stone-500 hover:text-stone-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Shop
          </Link>
          <span className="font-serif text-xl tracking-wide" style={{ color: '#B87333' }}>
            The Copper Fox
          </span>
          <div className="w-24" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Product Content */}
      <main className="container mx-auto px-6 py-12 md:py-20">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-start">
          {/* Image */}
          <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-sm">
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details */}
          <div className="py-4">
            <p className="text-stone-400 text-sm tracking-wide uppercase mb-2">
              {product.subtitle}
            </p>
            <h1 className="font-serif text-3xl md:text-4xl mb-2" style={{ color: '#B87333' }}>
              {product.name}
            </h1>
            <p className="text-2xl font-light mb-8" style={{ color: '#B87333' }}>
              {product.price}
            </p>

            <p className="text-stone-600 leading-relaxed mb-8">
              {product.description}
            </p>

            {/* Details list */}
            <ul className="space-y-2 mb-10 text-sm text-stone-500">
              {product.details.map((detail, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full" style={{ background: '#B87333' }} />
                  {detail}
                </li>
              ))}
            </ul>

            {/* Actions */}
            <div className="flex gap-4">
              <Button 
                size="lg" 
                className="flex-1 text-white"
                style={{ background: 'linear-gradient(135deg, #B87333 0%, #DA8A4E 50%, #B87333 100%)' }}
              >
                Add to Bag
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-orange-300 hover:bg-orange-50"
                style={{ color: '#B87333' }}
              >
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            <p className="text-xs text-stone-400 mt-6 text-center">
              Free shipping on orders over $500 · Made to order
            </p>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-stone-200 py-8">
        <div className="container mx-auto px-6 text-center text-xs text-stone-400">
          <p>© 2024 The Copper Fox · Kennebunkport, Maine</p>
          <p className="mt-2">
            Demo site by <Link to="/" className="transition-colors hover:text-stone-600" style={{ color: '#B87333' }}>Pleasant Cove Design</Link>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default BoutiqueProductPage;
