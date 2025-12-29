import { Link } from "react-router-dom";
import { ArrowLeft, Phone, MapPin, Clock, Star, Instagram, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";

const RestaurantDemo = () => {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Header */}
      <header className="bg-stone-900/80 backdrop-blur-sm border-b border-stone-800 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/#demos" className="text-stone-400 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <span className="font-serif text-2xl">The Golden Fork</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#menu" className="text-stone-300 hover:text-white">Menu</a>
            <a href="#about" className="text-stone-300 hover:text-white">About</a>
            <a href="#contact" className="text-stone-300 hover:text-white">Contact</a>
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
              Reserve a Table
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&auto=format&fit=crop"
            alt="Restaurant interior"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-transparent" />
        </div>
        
        <div className="relative container mx-auto px-6 text-center">
          <p className="text-amber-400 font-medium mb-4 tracking-widest uppercase text-sm">Est. 2015</p>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl mb-6">
            The Golden Fork
          </h1>
          <p className="text-xl text-stone-300 mb-8 max-w-2xl mx-auto">
            Farm-to-table cuisine crafted with passion. Experience the finest seasonal ingredients 
            in an unforgettable atmosphere.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-amber-600 hover:bg-amber-700">
              Reserve a Table
            </Button>
            <Button size="lg" variant="outline" className="border-stone-600 text-white hover:bg-stone-800">
              View Menu
            </Button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 mt-12 text-sm">
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

      {/* Featured Dishes */}
      <section id="menu" className="py-20 bg-stone-900">
        <div className="container mx-auto px-6">
          <h2 className="font-serif text-4xl text-center mb-4">Signature Dishes</h2>
          <p className="text-stone-400 text-center mb-12 max-w-xl mx-auto">
            Seasonal favorites crafted by Chef Maria. All dishes made with locally-sourced ingredients.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                name: "Pan-Seared Duck Breast", 
                desc: "Cherry gastrique, roasted root vegetables, wild rice",
                price: "$42",
                image: "https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=400&auto=format&fit=crop"
              },
              { 
                name: "Herb-Crusted Lamb", 
                desc: "Rosemary jus, pomme purée, seasonal greens",
                price: "$48",
                image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop"
              },
              { 
                name: "Wild Mushroom Risotto", 
                desc: "Truffle oil, aged parmesan, micro herbs",
                price: "$32",
                image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&auto=format&fit=crop"
              },
            ].map((dish) => (
              <div key={dish.name} className="group">
                <div className="aspect-[4/3] rounded-xl overflow-hidden mb-4">
                  <img 
                    src={dish.image} 
                    alt={dish.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-serif text-xl">{dish.name}</h3>
                  <span className="text-amber-400 font-medium">{dish.price}</span>
                </div>
                <p className="text-stone-400 text-sm">{dish.desc}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button variant="outline" className="border-stone-600 text-white hover:bg-stone-800">
              View Full Menu
            </Button>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 bg-stone-950">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div className="aspect-square rounded-xl overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=600&auto=format&fit=crop"
                alt="Chef at work"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-amber-400 font-medium mb-4 tracking-widest uppercase text-sm">Our Story</p>
              <h2 className="font-serif text-4xl mb-6">A Passion for Excellence</h2>
              <p className="text-stone-300 mb-6 leading-relaxed">
                Founded by Chef Maria Chen after two decades of culinary exploration across Europe and Asia, 
                The Golden Fork represents the culmination of a lifelong dream: to create a dining experience 
                that honors tradition while embracing innovation.
              </p>
              <p className="text-stone-400 leading-relaxed">
                Every dish tells a story. From our hand-selected local farmers to our carefully curated wine list, 
                every detail is thoughtfully considered to create moments worth savoring.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Reservation CTA */}
      <section className="py-20 bg-amber-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-serif text-4xl mb-4 text-stone-950">Reserve Your Table</h2>
          <p className="text-amber-900 mb-8 max-w-xl mx-auto">
            Join us for an unforgettable evening. Reservations recommended for weekend dining.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-stone-950 hover:bg-stone-900 text-white">
              Book Online
            </Button>
            <Button size="lg" variant="outline" className="border-stone-950 text-stone-950 hover:bg-amber-700">
              <Phone className="mr-2 h-5 w-5" />
              (555) 987-6543
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-stone-900 py-12">
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
