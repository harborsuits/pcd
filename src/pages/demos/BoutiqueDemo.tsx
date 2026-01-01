import { Link } from "react-router-dom";
import { ArrowLeft, Phone, MapPin, Clock, Star, Instagram, ShoppingBag, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlowCard } from "@/components/ui/spotlight-card";
import { AwardBadge } from "@/components/ui/award-badge";
import boutiqueHero from "@/assets/boutique/boutique-hero.png";
import foundationEdit from "@/assets/boutique/foundation-edit.png";
import accentCollection from "@/assets/boutique/accent-collection.png";
import coastalChapter from "@/assets/boutique/coastal-chapter.png";
import woolCardigan from "@/assets/boutique/wool-cardigan.jpg";
import leatherTote from "@/assets/boutique/leather-tote.jpg";
import balletFlats from "@/assets/boutique/ballet-flats.jpg";
import silkScarf from "@/assets/boutique/silk-scarf.jpg";
import storeInterior from "@/assets/boutique/artisan-interior.jpg";

// Blob header component with animated text
const BlobHeader = () => (
  <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto">
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-labelledby="t" className="w-full h-full">
      <defs>
        <clipPath id="blobClip">
          <path 
            d="M43.1,-68.5C56.2,-58.6,67.5,-47.3,72.3,-33.9C77.2,-20.5,75.5,-4.9,74.2,11.3C72.9,27.6,71.9,44.5,63.8,57.2C55.7,69.8,40.6,78.2,25.5,79.2C10.4,80.1,-4.7,73.6,-20.9,69.6C-37.1,65.5,-54.5,63.9,-66,54.8C-77.5,45.8,-83.2,29.3,-85.7,12.3C-88.3,-4.8,-87.7,-22.3,-79.6,-34.8C-71.5,-47.3,-55.8,-54.9,-41.3,-64.2C-26.7,-73.6,-13.4,-84.7,0.8,-86C15,-87.2,29.9,-78.5,43.1,-68.5Z"
            transform="translate(100 100)"
          />
        </clipPath>
      </defs>
      
      <image 
        href={boutiqueHero}
        width="200" 
        height="200"
        preserveAspectRatio="xMidYMid slice"
        clipPath="url(#blobClip)"
        className="transition-transform duration-300 hover:scale-110"
      />
      
      <path
        id="textPath"    
        d="M43.1,-68.5C56.2,-58.6,67.5,-47.3,72.3,-33.9C77.2,-20.5,75.5,-4.9,74.2,11.3C72.9,27.6,71.9,44.5,63.8,57.2C55.7,69.8,40.6,78.2,25.5,79.2C10.4,80.1,-4.7,73.6,-20.9,69.6C-37.1,65.5,-54.5,63.9,-66,54.8C-77.5,45.8,-83.2,29.3,-85.7,12.3C-88.3,-4.8,-87.7,-22.3,-79.6,-34.8C-71.5,-47.3,-55.8,-54.9,-41.3,-64.2C-26.7,-73.6,-13.4,-84.7,0.8,-86C15,-87.2,29.9,-78.5,43.1,-68.5Z"
        transform="translate(100 100)"
        fill="none" 
        stroke="none"
        pathLength="100"
      />
      
      <text className="fill-orange-700 text-[8px] font-bold uppercase tracking-[2px]">
        <textPath href="#textPath" startOffset="0%">
          ✦ KENNEBUNKPORT ✦ CURATED GOODS ✦ KENNEBUNKPORT ✦ CURATED GOODS 
          <animate attributeName="startOffset" from="0%" to="100%" dur="20s" repeatCount="indefinite" />
        </textPath>
        <textPath href="#textPath" startOffset="100%">
          ✦ KENNEBUNKPORT ✦ CURATED GOODS ✦ KENNEBUNKPORT ✦ CURATED GOODS 
          <animate attributeName="startOffset" from="-100%" to="0%" dur="20s" repeatCount="indefinite" />
        </textPath>
      </text>
    </svg>
  </div>
);

const BoutiqueDemo = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-orange-100/30 to-stone-50 text-stone-800">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-orange-200/50 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-orange-600 hover:text-orange-700 transition-colors text-sm font-medium flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Pleasant Cove Design
            </Link>
          </div>
          <span className="font-serif text-2xl tracking-wide" style={{ color: '#B87333' }}>The Copper Fox</span>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#collections" className="text-stone-600 hover:text-orange-700">Collections</a>
            <a href="#about" className="text-stone-600 hover:text-orange-700">Our Story</a>
            <a href="#visit" className="text-stone-600 hover:text-orange-700">Visit</a>
            <Button size="sm" className="text-white" style={{ background: 'linear-gradient(135deg, #B87333 0%, #DA8A4E 50%, #B87333 100%)' }}>
              Shop Now
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero with Blob */}
      <section className="relative min-h-[85vh] overflow-hidden flex items-center justify-center py-16">
        {/* Radial gradient background */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            background: "radial-gradient(circle at 50% 50%, #E8A87C 0%, #F4C6A5 15%, #FFF5EE 45%)"
          }}
        />
        
        <div className="relative z-20 container mx-auto px-6 text-center">
          <BlobHeader />
          
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl mb-4 mt-8" style={{ color: '#B87333' }}>
            The Copper Fox
          </h1>
          <p className="text-lg md:text-xl text-stone-600 mb-8 max-w-2xl mx-auto font-light">
            Effortlessly curated ensembles designed to converse with one another. 
            Every piece, purposefully selected to complement the collection entire.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#collections">
              <Button size="lg" className="text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #B87333 0%, #DA8A4E 50%, #B87333 100%)', boxShadow: '0 10px 25px -5px rgba(184, 115, 51, 0.4)' }}>
                <ShoppingBag className="mr-2 h-5 w-5" />
                Explore Collections
              </Button>
            </a>
            <a href="#about">
              <Button size="lg" variant="outline" className="border-orange-300 hover:bg-orange-50 bg-white/50 backdrop-blur-sm" style={{ color: '#B87333' }}>
                Our Story
              </Button>
            </a>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-stone-600">
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full">
              <Clock className="h-4 w-4" style={{ color: '#B87333' }} />
              <span>Open Daily 10AM–6PM</span>
            </div>
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full">
              <Star className="h-4 w-4" style={{ color: '#B87333' }} />
              <span>4.9★ Local Favorite</span>
            </div>
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full">
              <MapPin className="h-4 w-4" style={{ color: '#B87333' }} />
              <span>Dock Square</span>
            </div>
          </div>
        </div>
      </section>

      {/* Collections */}
      <section id="collections" className="py-20 bg-white relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <h2 className="font-serif text-4xl text-center mb-4" style={{ color: '#B87333' }}>The Capsule Philosophy</h2>
          <p className="text-stone-500 text-center mb-12 max-w-xl mx-auto">
            Each garment exists in dialogue with its companions. Mix, layer, reimagine—every combination, intentional.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { 
                title: "The Foundation Edit", 
                description: "Quietly luxurious essentials in whispered neutrals. The canvas upon which your wardrobe is built.",
                image: foundationEdit,
                items: "12 pieces"
              },
              { 
                title: "The Accent Collection", 
                description: "Statement pieces that elevate and transform. One addition, infinite possibilities.",
                image: accentCollection,
                items: "8 pieces"
              },
              { 
                title: "The Coastal Chapter", 
                description: "Seasonal silhouettes inspired by Maine's understated elegance. Refined, never contrived.",
                image: coastalChapter,
                items: "Limited"
              },
            ].map((collection) => (
              <GlowCard 
                key={collection.title} 
                glowColor="orange" 
                customSize 
                className="bg-orange-50/80 overflow-hidden group cursor-pointer"
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={collection.image} 
                    alt={collection.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(184, 115, 51, 0.7), transparent)' }} />
                  <span className="absolute bottom-3 left-4 text-white/90 text-sm font-medium">
                    {collection.items}
                  </span>
                </div>
                <div className="p-6 relative z-10">
                  <h3 className="font-serif text-xl mb-2" style={{ color: '#B87333' }}>{collection.title}</h3>
                  <p className="text-stone-600 text-sm">{collection.description}</p>
                </div>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-stone-50">
        <div className="container mx-auto px-6">
          <h2 className="font-serif text-4xl text-center mb-4" style={{ color: '#B87333' }}>New Arrivals</h2>
          <p className="text-stone-500 text-center mb-12">Fresh finds just added to the shop</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { name: "Hand-Knit Wool Cardigan", price: "$595", subtitle: "Maine wool • hand-finished", image: woolCardigan, slug: "wool-cardigan" },
              { name: "Artisan Leather Tote", price: "$685", subtitle: "Vegetable-tanned • hand-stitched", image: leatherTote, slug: "leather-tote" },
              { name: "Woven Leather Ballet Flats", price: "$385", subtitle: "Italian leather • hand-woven", image: balletFlats, slug: "ballet-flats" },
              { name: "Silk Coastal Scarf", price: "$245", subtitle: "Mulberry silk • hand-dyed", image: silkScarf, slug: "silk-scarf" },
            ].map((product) => (
              <Link to={`/demos/boutique/product/${product.slug}`} key={product.name} className="group cursor-pointer block">
                <div className="relative aspect-square rounded-xl overflow-hidden bg-white shadow-sm mb-3">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Heart className="h-4 w-4" style={{ color: '#B87333' }} />
                  </div>
                </div>
                <h3 className="font-medium text-stone-800 text-sm">{product.name}</h3>
                <p className="text-stone-500 text-xs mt-0.5">{product.subtitle}</p>
                <p className="font-medium mt-1" style={{ color: '#B87333' }}>{product.price}</p>
              </Link>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link to="/demos/boutique/product/wool-cardigan">
              <Button variant="outline" className="border-orange-300 hover:bg-orange-50" style={{ color: '#B87333' }}>
                View All Products
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About / Story */}
      <section id="about" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
              <h2 className="font-serif text-4xl mb-6" style={{ color: '#B87333' }}>Our Story</h2>
              <p className="text-stone-600 mb-4 leading-relaxed">
                The Copper Fox curates, rather than produces.
              </p>
              <p className="text-stone-600 mb-4 leading-relaxed">
                Garments are chosen for balance, texture, and longevity — designed to exist 
                in conversation with one another.
              </p>
              <p className="text-stone-600 mb-6 leading-relaxed">
                We release wardrobes, not seasons. Each piece is intentional. The result is inevitable.
              </p>
              <div className="flex items-center gap-4 justify-center md:justify-start">
                <img 
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop" 
                  alt="Owner"
                  className="w-14 h-14 rounded-full object-cover border-2 border-orange-300"
                />
                <div className="text-left">
                  <p className="font-medium" style={{ color: '#B87333' }}>Sarah Mitchell</p>
                  <p className="text-stone-500 text-sm">Owner & Curator</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src={storeInterior}
                alt="Inside The Copper Fox"
                className="rounded-2xl shadow-xl"
              />
              <div className="absolute -bottom-4 -left-4 bg-orange-100 rounded-xl p-4 shadow-lg">
                <p className="font-serif text-lg" style={{ color: '#B87333' }}>"Find something you love."</p>
              </div>
              <div className="absolute -top-4 -right-4 md:-right-8 z-10 scale-[0.6] origin-top-right">
                <AwardBadge
                  variant="badge"
                  title="Best Boutique"
                  subtitle="Kennebunkport"
                  date="2025"
                  level="gold"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capsule Philosophy Explainer */}
      <section className="py-20 bg-stone-50">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="font-serif text-4xl mb-4" style={{ color: '#B87333' }}>The Capsule Philosophy</h2>
            <p className="text-stone-500">How we think about building a wardrobe.</p>
          </div>
          
          <div className="max-w-2xl mx-auto space-y-12">
            <div className="border-l-2 pl-8" style={{ borderColor: '#B87333' }}>
              <h3 className="font-serif text-xl mb-3" style={{ color: '#B87333' }}>Everything converses.</h3>
              <p className="text-stone-600 leading-relaxed">
                Each piece is designed to complement every other. No orphans. No single-occasion 
                purchases gathering dust. Every garment earns its place through versatility.
              </p>
            </div>
            
            <div className="border-l-2 pl-8" style={{ borderColor: '#B87333' }}>
              <h3 className="font-serif text-xl mb-3" style={{ color: '#B87333' }}>Released as complete looks.</h3>
              <p className="text-stone-600 leading-relaxed">
                We don't sell singles hoping you'll figure it out. Collections arrive as 
                considered ensembles—the decisions have been made for you, thoughtfully.
              </p>
            </div>
            
            <div className="border-l-2 pl-8" style={{ borderColor: '#B87333' }}>
              <h3 className="font-serif text-xl mb-3" style={{ color: '#B87333' }}>Intentional, not impulsive.</h3>
              <p className="text-stone-600 leading-relaxed">
                Buying here is a deliberate act. You're not chasing trends—you're investing 
                in pieces that will serve you season after season.
              </p>
            </div>
            
            <div className="border-l-2 pl-8" style={{ borderColor: '#B87333' }}>
              <h3 className="font-serif text-xl mb-3" style={{ color: '#B87333' }}>Finite and curated.</h3>
              <p className="text-stone-600 leading-relaxed">
                Each collection is limited by design. When it's gone, it's gone. 
                This isn't scarcity marketing—it's editorial restraint.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Client Notes */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="font-serif text-4xl mb-4" style={{ color: '#B87333' }}>Client Notes</h2>
          </div>
          
          <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-8">
            <div className="bg-orange-50/50 p-8 rounded-xl">
              <p className="text-stone-700 italic leading-relaxed mb-4">
                "I packed three outfits for a week in Paris. Never once felt underdressed."
              </p>
              <p className="text-stone-500 text-sm">A.M. — Kennebunkport</p>
            </div>
            
            <div className="bg-orange-50/50 p-8 rounded-xl">
              <p className="text-stone-700 italic leading-relaxed mb-4">
                "Finally, a shop that doesn't make me think. Everything just works together."
              </p>
              <p className="text-stone-500 text-sm">C.L. — Portland</p>
            </div>
            
            <div className="bg-orange-50/50 p-8 rounded-xl">
              <p className="text-stone-700 italic leading-relaxed mb-4">
                "My closet is half the size and I get twice the compliments."
              </p>
              <p className="text-stone-500 text-sm">R.H. — Boston</p>
            </div>
            
            <div className="bg-orange-50/50 p-8 rounded-xl">
              <p className="text-stone-700 italic leading-relaxed mb-4">
                "Sarah understood exactly what I needed before I could articulate it."
              </p>
              <p className="text-stone-500 text-sm">M.W. — Cape Elizabeth</p>
            </div>
          </div>
        </div>
      </section>

      {/* Visit Section - Editorial Close */}
      <section id="visit" className="py-24 md:py-32 text-white" style={{ background: 'linear-gradient(135deg, #8B5A2B 0%, #B87333 50%, #CD853F 100%)' }}>
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-serif text-3xl md:text-4xl mb-6 tracking-tight">
              Visit Us in Kennebunkport
            </h2>
            <p className="text-white/80 text-lg md:text-xl leading-relaxed mb-12 font-light">
              Dock Square, Kennebunkport<br />
              <span className="text-white/60">A considered space. A slower pace.</span>
            </p>
            
            {/* Hairline divider */}
            <div className="w-12 h-px bg-white/30 mx-auto mb-10" />
            
            {/* Quiet metadata */}
            <div className="space-y-2 text-white/70 text-sm tracking-wide">
              <p className="font-light">28 Dock Square · Kennebunkport, ME 04046</p>
              <p className="font-light">Mon–Sat 10–6 · Sun 11–5</p>
              <p className="font-light">(207) 967-8520</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="bg-stone-900 text-stone-400 py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            {/* Centered brand + social */}
            <div className="text-center mb-12">
              <h3 className="font-serif text-xl text-white tracking-wide mb-4">The Copper Fox</h3>
              <a href="#" className="inline-block text-stone-500 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
            
            {/* Minimal links row */}
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs tracking-widest uppercase mb-12">
              <a href="#" className="hover:text-white transition-colors">New Arrivals</a>
              <a href="#" className="hover:text-white transition-colors">About</a>
              <a href="#" className="hover:text-white transition-colors">Visit</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
            
            {/* Copyright */}
            <div className="text-center text-xs text-stone-600 space-y-2">
              <p>© 2024 The Copper Fox</p>
              <p>
                Demo site by <Link to="/" className="transition-colors" style={{ color: '#B87333' }}>Pleasant Cove Design</Link>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BoutiqueDemo;
