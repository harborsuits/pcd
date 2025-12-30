import { Link } from "react-router-dom";
import { Phone, MapPin, Clock, Star, Instagram, Facebook, Home, UtensilsCrossed, Info, PhoneCall, Wine, ChefHat, Leaf, Sparkles } from "lucide-react";
import { MetalButton } from "@/components/ui/liquid-glass-button";
import ScrollExpandMedia from "@/components/ui/scroll-expansion-hero";
import { NavBar } from "@/components/ui/tubelight-navbar";
import InteractiveSelector from "@/components/ui/interactive-selector";
import { GlowCard } from "@/components/ui/spotlight-card";
import { AwardBadge } from "@/components/ui/award-badge";
import lobsterHero from "@/assets/restaurant/lobster-thermidor-hero.webp";
import privateEventsImg from "@/assets/restaurant/private-events.jpeg";

const navItems = [
  { label: "Home", href: "#hero", icon: Home },
  { label: "Menu", href: "#menu", icon: UtensilsCrossed },
  { label: "About", href: "#about", icon: Info },
  { label: "Contact", href: "#contact", icon: PhoneCall },
];

const signatureDishes = [
  { 
    name: "Pan-Seared Duck Breast", 
    desc: "Cherry gastrique, roasted root vegetables, wild rice",
    price: "$42",
    icon: ChefHat,
  },
  { 
    name: "Herb-Crusted Lamb", 
    desc: "Rosemary jus, pomme purée, seasonal greens",
    price: "$48",
    icon: Leaf,
  },
  { 
    name: "Wild Mushroom Risotto", 
    desc: "Truffle oil, aged parmesan, micro herbs",
    price: "$32",
    icon: Sparkles,
  },
  { 
    name: "Grilled Branzino", 
    desc: "Lemon caper butter, haricots verts, fingerling potatoes",
    price: "$44",
    icon: Star,
  },
  { 
    name: "Wagyu Beef Tartare", 
    desc: "Quail egg, capers, shallot, house-made crostini",
    price: "$38",
    icon: ChefHat,
  },
  { 
    name: "Lobster Thermidor", 
    desc: "Cognac cream, gruyère, saffron rice",
    price: "$62",
    icon: Sparkles,
  },
];

const experienceOptions = [
  {
    id: "dining",
    label: "Fine Dining",
    icon: UtensilsCrossed,
    description: "Experience culinary artistry in our elegant main dining room. Each dish is crafted with locally-sourced ingredients and presented with meticulous attention to detail. Our tasting menu offers a journey through seasonal flavors curated by Chef Max Powers.",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&auto=format&fit=crop",
  },
  {
    id: "wine",
    label: "Wine Cellar",
    icon: Wine,
    description: "Descend into our temperature-controlled wine cellar housing over 500 labels from around the world. Our sommelier offers private tastings and can pair the perfect vintage with your meal. Reserve our intimate cellar table for a truly unique experience.",
    image: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&auto=format&fit=crop",
  },
  {
    id: "private",
    label: "Private Events",
    icon: Star,
    description: "Host your next celebration in our exclusive private dining room. Accommodating up to 20 guests, this space features a dedicated kitchen, personalized menus, and white-glove service. Perfect for anniversaries, corporate dinners, and intimate gatherings.",
    image: privateEventsImg,
  },
  {
    id: "chef",
    label: "Chef's Table",
    icon: ChefHat,
    description: "The ultimate culinary experience. Sit just steps from the kitchen and watch Chef Max Powers and his team create your personalized multi-course tasting menu. Limited to 6 guests per evening, this intimate experience includes wine pairings and behind-the-scenes stories.",
    image: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800&auto=format&fit=crop",
  },
];

const RestaurantDemo = () => {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 overflow-x-hidden relative">
      {/* Pleasant Cove Design badge - fixed top left */}
      <Link 
        to="/" 
        className="fixed top-4 left-4 z-50 text-xs text-stone-400 hover:text-amber-400 transition-colors bg-stone-950/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-stone-700/30 hover:border-amber-500/30"
      >
        ← Pleasant Cove Design
      </Link>

      {/* Fixed background - z-0 */}
      <div className="fixed inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&auto=format&fit=crop"
          alt="Background"
          className="w-full h-full object-cover opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/30 via-stone-950/40 to-stone-950/60" />
      </div>


      {/* Scroll Expansion Hero */}
      <section id="hero" className="relative z-10">
        <ScrollExpandMedia
          mediaType="image"
          mediaSrc={lobsterHero}
          bgImageSrc="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&auto=format&fit=crop"
          title="The Golden Fork"
          date="EST. 2015"
          scrollToExpand="Scroll to explore"
        >
          {/* About Section - reduced padding */}
          <div id="about" className="container mx-auto px-6 pt-10 md:pt-12 pb-6 relative z-20">
            <div className="max-w-4xl mx-auto text-center mb-8">
              <p className="text-amber-400 font-medium mb-3 tracking-widest uppercase text-sm drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">Our Story</p>
              <h2 
                className="font-serif text-4xl md:text-5xl mb-4 text-stone-100"
                style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
              >
                A Passion for Excellence
              </h2>
              <p className="text-stone-200 text-lg leading-relaxed mb-3">
                Founded by Chef Max Powers after two decades of culinary exploration across Europe and Asia, 
                The Golden Fork represents the culmination of a lifelong dream.
              </p>
              <p className="text-stone-300 leading-relaxed">
                Every dish tells a story. From our hand-selected local farmers to our carefully curated wine list, 
                every detail is thoughtfully considered to create moments worth savoring.
              </p>
            </div>

            {/* Signature Dishes */}
            <div id="menu" className="mb-8 relative z-20">
              <h2 
                className="font-serif text-3xl md:text-4xl text-center mb-2 text-stone-100"
                style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
              >
                Signature Dishes
              </h2>
              <p className="text-stone-300 text-center mb-5 max-w-xl mx-auto">
                Seasonal favorites crafted by Chef Max Powers.
              </p>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 relative z-20">
                {signatureDishes.map((dish) => {
                  const Icon = dish.icon;
                  return (
                    <GlowCard
                      key={dish.name}
                      glowColor="orange"
                      customSize
                      className="p-4 bg-stone-900/40 backdrop-blur-sm border border-stone-700/40"
                    >
                      <div className="flex flex-col h-full relative z-10">
                        <div className="flex items-start justify-between mb-2">
                          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <Icon className="h-4 w-4 text-amber-400" />
                          </div>
                          <span className="text-amber-400 font-bold">{dish.price}</span>
                        </div>
                        <h3 className="font-serif text-lg text-stone-100 mb-1">{dish.name}</h3>
                        <p className="text-stone-300 text-sm">{dish.desc}</p>
                      </div>
                    </GlowCard>
                  );
                })}
              </div>
              
              <div className="text-center mt-5 relative z-20">
                <MetalButton variant="gold">
                  View Full Menu
                </MetalButton>
              </div>
            </div>
          </div>
        </ScrollExpandMedia>
      </section>

      {/* Interactive Experience Selector */}
      <section className="relative z-10 py-8 md:py-10">
        <InteractiveSelector
          title="Explore the Experience"
          options={experienceOptions}
        />
      </section>

      {/* Press & Awards */}
      <section className="py-8 md:py-10 relative z-10">
        <div className="container mx-auto px-6">
          <h2 
            className="font-serif text-3xl md:text-4xl text-center mb-2 text-stone-100"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
          >
            Press & Awards
          </h2>
          <p className="text-stone-300 text-center mb-5 max-w-xl mx-auto">
            Recognized for excellence in fine dining.
          </p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-5xl mx-auto relative z-20">
            <AwardBadge
              title="Best of Portland"
              subtitle="Portland Magazine"
              year="2008"
              variant="gold"
              icon="trophy"
            />
            <AwardBadge
              title="Top Restaurant"
              subtitle="Down East Magazine"
              year="2018"
              variant="gold"
              icon="crown"
            />
            <AwardBadge
              title="Best New Chef"
              subtitle="Maine Restaurant Assoc."
              year="2016"
              variant="silver"
              icon="medal"
            />
            <AwardBadge
              title="Eaters Choice"
              subtitle="Portland Press Herald"
              year="2005"
              variant="platinum"
              icon="star"
            />
          </div>
        </div>
      </section>

      {/* Quick Info Bar */}
      <section className="py-4 relative z-10 bg-stone-900/30 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-400" />
              <span className="text-stone-200">Tue–Sun: 5PM–10PM</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-400" />
              <span className="text-stone-200">4.8★ (450+ Reviews)</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-amber-400" />
              <span className="text-stone-200">Old Port, Portland</span>
            </div>
          </div>
        </div>
      </section>

      {/* Reservation CTA */}
      <section className="py-12 bg-gradient-to-br from-amber-600/90 via-amber-500/90 to-yellow-500/90 backdrop-blur-sm relative z-10">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-serif text-4xl mb-2 text-stone-950">Reserve Your Table</h2>
          <p className="text-amber-900 mb-4 max-w-xl mx-auto">
            Join us for an unforgettable evening.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <MetalButton variant="bronze">
              Book Online
            </MetalButton>
            <MetalButton variant="default">
              <Phone className="mr-2 h-5 w-5" />
              (555) 987-6543
            </MetalButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-stone-900/50 backdrop-blur-sm py-8 relative z-10">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-serif text-2xl mb-2 text-stone-100">The Golden Fork</h3>
              <p className="text-stone-300 text-sm">
                An elevated dining experience in the heart of downtown.
              </p>
              <div className="flex gap-4 mt-2">
                <a href="#" className="text-stone-400 hover:text-amber-400 transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="text-stone-400 hover:text-amber-400 transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-stone-100">Hours</h4>
              <div className="space-y-1 text-sm text-stone-300">
                <p>Tue–Thu: 5PM – 10PM</p>
                <p>Fri–Sat: 5PM – 11PM</p>
                <p>Sun: 5PM – 9PM | Mon: Closed</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-stone-100">Location</h4>
              <div className="space-y-1 text-sm text-stone-300">
                <p>123 Fore Street, Old Port</p>
                <p>Portland, ME 04101</p>
                <p className="mt-2">
                  <a href="tel:5559876543" className="text-amber-400 hover:underline">(555) 987-6543</a>
                </p>
              </div>
            </div>
          </div>
          <div className="border-t border-stone-700/50 mt-5 pt-5 text-center text-sm text-stone-400">
            <p>© 2024 The Golden Fork. Demo by <Link to="/" className="text-amber-400 hover:underline">Pleasant Cove Design</Link></p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RestaurantDemo;
