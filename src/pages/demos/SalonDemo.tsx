import { Link } from "react-router-dom";
import { ArrowLeft, Phone, MapPin, Clock, Star, Instagram, Scissors, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShaderAnimation } from "@/components/ui/shader-animation";
import { ImageAutoSlider } from "@/components/ui/image-auto-slider";
import { GlowCard } from "@/components/ui/spotlight-card";
import salonHeroModel from "@/assets/salon/salon-hero-model.png";
import salonServicesModel from "@/assets/salon/salon-services-model.png";
import salonMakeup from "@/assets/salon/makeup.jpg";
import salonHair1 from "@/assets/salon/hair1.jpg";
import salonHair2 from "@/assets/salon/hair2.jpeg";
import salonNails from "@/assets/salon/nails.jpeg";
import salonWaxing from "@/assets/salon/waxing.jpeg";
import salonOwner from "@/assets/salon/salon-owner.jpeg";

const SalonDemo = () => {
  return (
    <div className="min-h-screen bg-rose-50 text-stone-800">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-rose-100 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-rose-400 hover:text-rose-600 transition-colors text-sm font-medium flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Pleasant Cove Design
            </Link>
          </div>
          <span className="font-serif text-2xl text-rose-900">Blush & Bloom</span>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#services" className="text-stone-600 hover:text-rose-700">Services</a>
            <a href="#team" className="text-stone-600 hover:text-rose-700">Team</a>
            <a href="#gallery" className="text-stone-600 hover:text-rose-700">Gallery</a>
            <Button size="sm" className="bg-rose-500 hover:bg-rose-600">
              Book Now
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero with Shader Animation */}
      <section className="relative min-h-[80vh] overflow-hidden flex items-center justify-center">
        {/* Hero Image Background */}
        <div className="absolute inset-0 z-0 flex justify-end items-end pointer-events-none">
          <img 
            src={salonHeroModel} 
            alt="" 
            className="h-full w-auto max-w-none object-contain object-right-bottom opacity-40"
          />
        </div>
        
        {/* Shader Background on top of image */}
        <div className="absolute inset-0 z-[5]">
          <ShaderAnimation className="opacity-25" />
        </div>
        
        {/* Gradient Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-rose-50/70 via-rose-50/50 to-rose-50 z-10" />
        
        <div className="relative z-20 container mx-auto px-6 text-center py-24">
          <Sparkles className="h-12 w-12 text-rose-400 mx-auto mb-6 animate-pulse" />
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl mb-6 text-rose-900" style={{ textShadow: "0 2px 20px rgba(255,255,255,0.8)" }}>
            Blush & Bloom
          </h1>
          <p className="text-xl text-stone-600 mb-8 max-w-2xl mx-auto">
            A modern beauty studio specializing in hair, nails, and self-care. 
            Where you come to relax, refresh, and leave feeling your best.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/30">
              Book an Appointment
            </Button>
            <Button size="lg" variant="outline" className="border-rose-300 text-rose-700 hover:bg-rose-100 bg-white/50 backdrop-blur-sm">
              View Services
            </Button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 mt-12 text-sm text-stone-600">
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full">
              <Clock className="h-5 w-5 text-rose-400" />
              <span>Tue–Sat: 9AM–7PM</span>
            </div>
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full">
              <Star className="h-5 w-5 text-rose-400" />
              <span>4.9★ (320+ Reviews)</span>
            </div>
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full">
              <MapPin className="h-5 w-5 text-rose-400" />
              <span>Uptown Village</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 bg-white relative overflow-hidden">
        {/* Decorative background image */}
        <div className="absolute right-0 top-0 h-full w-1/2 pointer-events-none">
          <img 
            src={salonServicesModel} 
            alt="" 
            className="h-full w-auto object-contain object-right opacity-10"
          />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <h2 className="font-serif text-4xl text-center mb-4 text-rose-900">Our Services</h2>
          <p className="text-stone-500 text-center mb-12 max-w-xl mx-auto">
            Expert stylists. Premium products. Personalized care for every client.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { 
                title: "Hair", 
                services: ["Cuts & Styling", "Color & Highlights", "Treatments", "Blowouts"],
                icon: Scissors,
                from: "$45"
              },
              { 
                title: "Nails", 
                services: ["Manicures", "Pedicures", "Gel & Acrylics", "Nail Art"],
                icon: Sparkles,
                from: "$35"
              },
              { 
                title: "Beauty", 
                services: ["Facials", "Waxing", "Lash Extensions", "Makeup"],
                icon: Star,
                from: "$55"
              },
            ].map((category) => (
              <GlowCard 
                key={category.title} 
                glowColor="rose" 
                customSize 
                className="bg-rose-50/80 p-8 text-center"
              >
                <div className="relative z-10">
                  <category.icon className="h-10 w-10 text-rose-400 mx-auto mb-4" />
                  <h3 className="font-serif text-2xl text-rose-900 mb-2">{category.title}</h3>
                  <p className="text-rose-400 text-sm mb-4">Starting from {category.from}</p>
                  <ul className="space-y-2 text-stone-600 text-sm">
                    {category.services.map((service) => (
                      <li key={service}>{service}</li>
                    ))}
                  </ul>
                </div>
              </GlowCard>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button className="bg-rose-500 hover:bg-rose-600">
              View Full Menu & Pricing
            </Button>
          </div>
        </div>
      </section>

      {/* Team */}
      <section id="team" className="py-20 bg-rose-50">
        <div className="container mx-auto px-6">
          <h2 className="font-serif text-4xl text-center mb-4 text-rose-900">Meet Our Team</h2>
          <p className="text-stone-500 text-center mb-12 max-w-xl mx-auto">
            Passionate professionals dedicated to making you look and feel amazing.
          </p>
          
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { name: "Sarah", role: "Owner & Senior Stylist", image: salonOwner },
              { name: "Maya", role: "Color Specialist", image: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=300&auto=format&fit=crop" },
              { name: "Jessica", role: "Nail Technician", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop" },
              { name: "Emma", role: "Esthetician", image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop" },
            ].map((member) => (
              <div key={member.name} className="text-center group">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <h3 className="font-medium text-rose-900">{member.name}</h3>
                <p className="text-stone-500 text-sm">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery" className="py-20 bg-rose-50/50 overflow-hidden">
        <div className="container mx-auto px-6">
          <h2 className="font-serif text-5xl text-center mb-16 text-rose-800">Our Work</h2>
        </div>
        
        <ImageAutoSlider 
          images={[
            { src: salonHair1, alt: "Balayage hair styling" },
            { src: salonNails, alt: "Pink nail art" },
            { src: salonMakeup, alt: "Bridal makeup" },
            { src: salonHair2, alt: "Ombre highlights" },
            { src: salonWaxing, alt: "Waxing service" },
          ]}
        />
        
        <div className="text-center mt-12">
          <a href="#" className="inline-flex items-center gap-3 text-rose-500 hover:text-rose-600 font-medium text-lg transition-colors">
            <Instagram className="h-6 w-6" />
            Follow us @blushandbloom
          </a>
        </div>
      </section>

      {/* Combined CTA + Footer Section with Shader */}
      <section className="relative overflow-hidden">
        {/* Shader Background */}
        <div className="absolute inset-0 z-0">
          <ShaderAnimation className="opacity-60" />
        </div>
        
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-rose-500/80 via-rose-600/85 to-rose-900/95" />
        
        {/* CTA Content */}
        <div className="relative z-10 py-20">
          <div className="container mx-auto px-6 text-center">
            <h2 className="font-serif text-5xl mb-4 text-white">Ready to Glow?</h2>
            <p className="text-rose-100 mb-8 max-w-xl mx-auto text-lg">
              Book your appointment online or give us a call. New clients always welcome!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-white text-rose-600 hover:bg-rose-50 px-8">
                Book Online
              </Button>
              <Button size="lg" variant="outline" className="border-white/50 text-white/80 hover:bg-white/10 px-8">
                <Phone className="mr-2 h-5 w-5" />
                (555) 456-7890
              </Button>
            </div>
          </div>
        </div>
        
        {/* Footer Content */}
        <div className="relative z-10 py-12">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-serif text-2xl mb-4 text-white">Blush & Bloom</h3>
                <p className="text-rose-200 text-sm">
                  Your neighborhood destination for hair, nails, and self-care.
                </p>
                <div className="flex gap-4 mt-4">
                  <a href="#" className="text-rose-300 hover:text-white transition-colors">
                    <Instagram className="h-6 w-6" />
                  </a>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-4 text-white">Hours</h4>
                <div className="space-y-2 text-sm text-rose-200">
                  <p>Tuesday – Friday: 9AM – 7PM</p>
                  <p>Saturday: 9AM – 5PM</p>
                  <p>Sunday – Monday: Closed</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-4 text-white">Location</h4>
                <div className="space-y-2 text-sm text-rose-200">
                  <p>789 Uptown Boulevard</p>
                  <p>Suite 101</p>
                  <p>Anytown, USA 12345</p>
                  <p className="mt-4">
                    <a href="tel:5554567890" className="text-white hover:underline">(555) 456-7890</a>
                  </p>
                </div>
              </div>
            </div>
            <div className="border-t border-rose-700/50 mt-8 pt-8 text-center text-sm text-rose-300">
              <p>© 2024 Blush & Bloom. All rights reserved.</p>
              <p className="mt-2 text-xs">
                Demo site by <Link to="/" className="text-white hover:underline">Pleasant Cove Design</Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SalonDemo;
