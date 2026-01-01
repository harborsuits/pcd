import { Link } from "react-router-dom";
import { ArrowLeft, Phone, MapPin, Clock, Star, Instagram, ShoppingBag, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlowCard } from "@/components/ui/spotlight-card";
import boutiqueHero from "@/assets/boutique/boutique-hero.png";
import foundationEdit from "@/assets/boutique/foundation-edit.png";
import accentCollection from "@/assets/boutique/accent-collection.png";

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
      
      <text className="fill-amber-800 text-[8px] font-bold uppercase tracking-[2px]">
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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50/30 to-stone-50 text-stone-800">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-amber-100 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-amber-600 hover:text-amber-700 transition-colors text-sm font-medium flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Pleasant Cove Design
            </Link>
          </div>
          <span className="font-serif text-2xl text-amber-900 tracking-wide">The Copper Fox</span>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#collections" className="text-stone-600 hover:text-amber-700">Collections</a>
            <a href="#about" className="text-stone-600 hover:text-amber-700">Our Story</a>
            <a href="#visit" className="text-stone-600 hover:text-amber-700">Visit</a>
            <Button size="sm" className="bg-amber-700 hover:bg-amber-800">
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
            background: "radial-gradient(circle at 50% 50%, #F4C6A5 0%, #F9D9C2 10%, #FFF8F3 40%)"
          }}
        />
        
        <div className="relative z-20 container mx-auto px-6 text-center">
          <BlobHeader />
          
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl mb-4 text-amber-900 mt-8">
            The Copper Fox
          </h1>
          <p className="text-lg md:text-xl text-stone-600 mb-8 max-w-2xl mx-auto font-light">
            Effortlessly curated ensembles designed to converse with one another. 
            Every piece, purposefully selected to complement the collection entire.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-amber-700 hover:bg-amber-800 shadow-lg shadow-amber-700/20">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Explore Collections
            </Button>
            <Button size="lg" variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100 bg-white/50 backdrop-blur-sm">
              Our Story
            </Button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-stone-600">
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full">
              <Clock className="h-4 w-4 text-amber-600" />
              <span>Open Daily 10AM–6PM</span>
            </div>
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full">
              <Star className="h-4 w-4 text-amber-600" />
              <span>4.9★ Local Favorite</span>
            </div>
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full">
              <MapPin className="h-4 w-4 text-amber-600" />
              <span>Dock Square</span>
            </div>
          </div>
        </div>
      </section>

      {/* Collections */}
      <section id="collections" className="py-20 bg-white relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <h2 className="font-serif text-4xl text-center mb-4 text-amber-900">The Capsule Philosophy</h2>
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
                image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop",
                items: "Limited"
              },
            ].map((collection) => (
              <GlowCard 
                key={collection.title} 
                glowColor="orange" 
                customSize 
                className="bg-amber-50/80 overflow-hidden group cursor-pointer"
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={collection.image} 
                    alt={collection.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-amber-900/60 to-transparent" />
                  <span className="absolute bottom-3 left-4 text-white/90 text-sm font-medium">
                    {collection.items}
                  </span>
                </div>
                <div className="p-6 relative z-10">
                  <h3 className="font-serif text-xl text-amber-900 mb-2">{collection.title}</h3>
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
          <h2 className="font-serif text-4xl text-center mb-4 text-amber-900">New Arrivals</h2>
          <p className="text-stone-500 text-center mb-12">Fresh finds just added to the shop</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { name: "Brass Ship Bell", price: "$145", image: "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=300&auto=format&fit=crop" },
              { name: "Linen Throw", price: "$89", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&auto=format&fit=crop" },
              { name: "Sea Glass Earrings", price: "$48", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300&auto=format&fit=crop" },
              { name: "Driftwood Mirror", price: "$225", image: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=300&auto=format&fit=crop" },
            ].map((product) => (
              <div key={product.name} className="group cursor-pointer">
                <div className="relative aspect-square rounded-xl overflow-hidden bg-white shadow-sm mb-3">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Heart className="h-4 w-4 text-amber-600" />
                  </button>
                </div>
                <h3 className="font-medium text-stone-800 text-sm">{product.name}</h3>
                <p className="text-amber-700 font-medium">{product.price}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100">
              View All Products
            </Button>
          </div>
        </div>
      </section>

      {/* About / Story */}
      <section id="about" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-serif text-4xl mb-6 text-amber-900">Our Story</h2>
              <p className="text-stone-600 mb-4 leading-relaxed">
                The Copper Fox was born from a singular conviction: that a thoughtfully edited 
                wardrobe liberates rather than limits. We believe in fewer pieces, chosen with 
                intention, each one earning its place through versatility and quiet beauty.
              </p>
              <p className="text-stone-600 mb-6 leading-relaxed">
                Every garment in our collection has been selected to harmonize with the others. 
                Purchase one piece or the entire capsule—the result is always a wardrobe that works.
              </p>
              <div className="flex items-center gap-4">
                <img 
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop" 
                  alt="Owner"
                  className="w-14 h-14 rounded-full object-cover border-2 border-amber-200"
                />
                <div>
                  <p className="font-medium text-amber-900">Sarah Mitchell</p>
                  <p className="text-stone-500 text-sm">Owner & Curator</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop" 
                alt="Inside The Copper Fox"
                className="rounded-2xl shadow-xl"
              />
              <div className="absolute -bottom-4 -left-4 bg-amber-100 rounded-xl p-4 shadow-lg">
                <p className="font-serif text-amber-900 text-lg">"Find something you love."</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visit Section */}
      <section id="visit" className="py-20 bg-amber-900 text-white relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl mb-4">Visit Us in Kennebunkport</h2>
            <p className="text-amber-200 max-w-xl mx-auto">
              Stop by our shop in the heart of Dock Square. We'd love to help you find 
              something special.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <MapPin className="h-8 w-8 text-amber-300 mx-auto mb-4" />
              <h3 className="font-medium mb-2">Location</h3>
              <p className="text-amber-200 text-sm">
                28 Dock Square<br />
                Kennebunkport, ME 04046
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Clock className="h-8 w-8 text-amber-300 mx-auto mb-4" />
              <h3 className="font-medium mb-2">Hours</h3>
              <p className="text-amber-200 text-sm">
                Mon–Sat: 10AM–6PM<br />
                Sunday: 11AM–5PM
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Phone className="h-8 w-8 text-amber-300 mx-auto mb-4" />
              <h3 className="font-medium mb-2">Contact</h3>
              <p className="text-amber-200 text-sm">
                (207) 967-8520<br />
                hello@copperfoxkport.com
              </p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Button size="lg" className="bg-white text-amber-900 hover:bg-amber-50">
              Get Directions
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-300 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="font-serif text-2xl text-white mb-4">The Copper Fox</h3>
              <p className="text-stone-400 text-sm max-w-md">
                A capsule wardrobe atelier in Kennebunkport, Maine. Interchangeable elegance, 
                purposefully curated since 2018.
              </p>
              <div className="flex gap-4 mt-4">
                <a href="#" className="text-stone-400 hover:text-white transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-white mb-4">Shop</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">New Arrivals</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Vintage</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Artisan Goods</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Gift Cards</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-4">Info</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Visit</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Shipping</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-stone-800 mt-8 pt-8 text-center text-sm text-stone-500">
            <p>© 2024 The Copper Fox. All rights reserved.</p>
            <p className="mt-2 text-xs">
              Demo site by <Link to="/" className="text-amber-500 hover:underline">Pleasant Cove Design</Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BoutiqueDemo;
