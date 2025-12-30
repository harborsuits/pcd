import { Link } from "react-router-dom";
import { Phone, MapPin, Clock, Star, Instagram, Facebook, Home, UtensilsCrossed, Info, PhoneCall, Wine, ChefHat, Leaf, Sparkles } from "lucide-react";
import { MetalButton } from "@/components/ui/liquid-glass-button";
import ScrollExpandMedia from "@/components/ui/scroll-expansion-hero";
import { NavBar } from "@/components/ui/tubelight-navbar";
import InteractiveSelector from "@/components/ui/interactive-selector";
import { GlowCard } from "@/components/ui/spotlight-card";
import { AwardBadge } from "@/components/ui/award-badge";

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
    description: "Experience culinary artistry in our elegant main dining room. Each dish is crafted with locally-sourced ingredients and presented with meticulous attention to detail. Our tasting menu offers a journey through seasonal flavors curated by Chef Maria.",
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
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop",
  },
  {
    id: "chef",
    label: "Chef's Table",
    icon: ChefHat,
    description: "The ultimate culinary experience. Sit just steps from the kitchen and watch Chef Maria and her team create your personalized multi-course tasting menu. Limited to 6 guests per evening, this intimate experience includes wine pairings and behind-the-scenes stories.",
    image: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800&auto=format&fit=crop",
  },
];

const RestaurantDemo = () => {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Tubelight Navigation */}
      <NavBar 
        items={navItems} 
        activeColor="hsl(45 93% 47%)"
      />

      {/* Scroll Expansion Hero */}
      <section id="hero">
        <ScrollExpandMedia
          mediaType="image"
          mediaSrc="https://images.unsplash.com/photo-1600891964092-4316c288032e?w=1920&auto=format&fit=crop"
          bgImageSrc="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&auto=format&fit=crop"
          title="The Golden Fork"
          date="EST. 2015"
          scrollToExpand="Scroll to explore"
        >
          {/* About Section - inside hero expansion */}
          <div id="about" className="container mx-auto px-6 py-16">
            <div className="max-w-4xl mx-auto text-center mb-20">
              <p className="text-amber-400 font-medium mb-4 tracking-widest uppercase text-sm">Our Story</p>
              <h2 className="font-serif text-4xl md:text-5xl mb-8">A Passion for Excellence</h2>
              <p className="text-stone-300 text-lg leading-relaxed mb-6">
                Founded by Chef Maria Chen after two decades of culinary exploration across Europe and Asia, 
                The Golden Fork represents the culmination of a lifelong dream: to create a dining experience 
                that honors tradition while embracing innovation.
              </p>
              <p className="text-stone-400 leading-relaxed">
                Every dish tells a story. From our hand-selected local farmers to our carefully curated wine list, 
                every detail is thoughtfully considered to create moments worth savoring. We believe that exceptional 
                dining is about more than just food—it's about connection, celebration, and creating memories.
              </p>
            </div>

            {/* Signature Dishes with GlowCards */}
            <div id="menu" className="mb-20">
              <h2 className="font-serif text-3xl md:text-4xl text-center mb-4">Signature Dishes</h2>
              <p className="text-stone-400 text-center mb-12 max-w-xl mx-auto">
                Seasonal favorites crafted by Chef Maria. All dishes made with locally-sourced ingredients.
              </p>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {signatureDishes.map((dish) => {
                  const Icon = dish.icon;
                  return (
                    <GlowCard
                      key={dish.name}
                      glowColor="orange"
                      customSize
                      className="p-6"
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <Icon className="h-6 w-6 text-amber-400" />
                          </div>
                          <span className="text-amber-400 font-bold text-lg">{dish.price}</span>
                        </div>
                        <h3 className="font-serif text-xl text-stone-100 mb-2">{dish.name}</h3>
                        <p className="text-stone-400 text-sm flex-grow">{dish.desc}</p>
                      </div>
                    </GlowCard>
                  );
                })}
              </div>
              
              <div className="text-center mt-12">
                <MetalButton variant="gold">
                  View Full Menu
                </MetalButton>
              </div>
            </div>
          </div>
        </ScrollExpandMedia>
      </section>

      {/* Interactive Experience Selector */}
      <section className="bg-stone-900 border-t border-stone-800">
        <InteractiveSelector
          title="Explore the Experience"
          options={experienceOptions}
        />
      </section>

      {/* Press & Awards Section */}
      <section className="py-20 bg-stone-950 border-t border-stone-800">
        <div className="container mx-auto px-6">
          <h2 className="font-serif text-3xl md:text-4xl text-center mb-4">Press & Awards</h2>
          <p className="text-stone-400 text-center mb-12 max-w-xl mx-auto">
            Recognized for excellence in fine dining and hospitality.
          </p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <AwardBadge
              title="Best Fine Dining"
              subtitle="City Dining Awards"
              year="2024"
              variant="gold"
              icon="trophy"
            />
            <AwardBadge
              title="Golden Kitty"
              subtitle="Restaurant Excellence"
              year="2023"
              variant="gold"
              icon="crown"
            />
            <AwardBadge
              title="Chef of the Year"
              subtitle="Culinary Institute"
              year="2023"
              variant="silver"
              icon="medal"
            />
            <AwardBadge
              title="Michelin Recognized"
              subtitle="Bib Gourmand"
              year="2022"
              variant="platinum"
              icon="star"
            />
          </div>
        </div>
      </section>

      {/* Quick Info Bar */}
      <section className="py-8 bg-stone-900 border-t border-stone-800">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-400" />
              <span>Tue–Sun: 5PM–10PM</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-400" />
              <span>4.8★ (450+ Reviews)</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-amber-400" />
              <span>Downtown District</span>
            </div>
          </div>
        </div>
      </section>

      {/* Reservation CTA */}
      <section className="py-20 bg-gradient-to-br from-amber-600 via-amber-500 to-yellow-500">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-serif text-4xl mb-4 text-stone-950">Reserve Your Table</h2>
          <p className="text-amber-900 mb-8 max-w-xl mx-auto">
            Join us for an unforgettable evening. Reservations recommended for weekend dining.
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
      <footer id="contact" className="bg-stone-900 py-12 border-t border-stone-800">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-serif text-2xl mb-4">The Golden Fork</h3>
              <p className="text-stone-400 text-sm">
                An elevated dining experience in the heart of downtown.
              </p>
              <div className="flex gap-4 mt-4">
                <a href="#" className="text-stone-400 hover:text-amber-400 transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="text-stone-400 hover:text-amber-400 transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-4">Hours</h4>
              <div className="space-y-2 text-sm text-stone-400">
                <p>Tuesday – Thursday: 5PM – 10PM</p>
                <p>Friday – Saturday: 5PM – 11PM</p>
                <p>Sunday: 5PM – 9PM</p>
                <p>Monday: Closed</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-4">Location</h4>
              <div className="space-y-2 text-sm text-stone-400">
                <p>456 Main Street</p>
                <p>Downtown District</p>
                <p>Anytown, USA 12345</p>
                <p className="mt-4">
                  <a href="tel:5559876543" className="text-amber-400 hover:underline">(555) 987-6543</a>
                </p>
              </div>
            </div>
          </div>
          <div className="border-t border-stone-800 mt-8 pt-8 text-center text-sm text-stone-500">
            <p>© 2024 The Golden Fork. All rights reserved.</p>
            <p className="mt-2 text-xs">
              Demo site by <Link to="/" className="text-amber-400 hover:underline">Pleasant Cove Design</Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RestaurantDemo;
