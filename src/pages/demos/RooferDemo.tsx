import { Link } from "react-router-dom";
import { ArrowLeft, Phone, Mail, MapPin, Star, CheckCircle, Clock, Shield, Facebook, Instagram, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeatureSteps } from "@/components/ui/feature-section";
import { FeaturesSectionWithHoverEffects } from "@/components/ui/feature-section-with-hover-effects";
import { LampContainer } from "@/components/ui/lamp";
import { TextHoverEffect, FooterBackgroundGradient } from "@/components/ui/hover-footer";
import { motion } from "framer-motion";
import rooferHero from "@/assets/demos/roofer-hero.jpeg";
import rooferBg from "@/assets/demos/roofer-bg.jpeg";

const roofingFeatures = [
  { 
    step: 'Step 1', 
    title: 'Free Inspection',
    content: 'Our certified experts assess your roof condition with a comprehensive no-obligation inspection.', 
    image: rooferHero
  },
  { 
    step: 'Step 2',
    title: 'Detailed Estimate',
    content: 'Receive a transparent quote with all materials, labor, and timeline clearly outlined.',
    image: 'https://images.unsplash.com/photo-1632759145351-1d592919f522?w=800&auto=format&fit=crop'
  },
  { 
    step: 'Step 3',
    title: 'Expert Installation',
    content: 'Our licensed team completes your project on time with premium materials and a 25-year warranty.',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop'
  },
];

const RooferDemo = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/#demos" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <span className="font-bold text-xl">Summit Roofing Co.</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#services" className="text-slate-300 hover:text-white transition-colors">Services</a>
            <a href="#about" className="text-slate-300 hover:text-white transition-colors">About</a>
            <a href="#reviews" className="text-slate-300 hover:text-white transition-colors">Reviews</a>
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/25">
              Get Free Estimate
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero with Lamp Effect */}
      <div 
        className="relative"
        style={{
          backgroundImage: `url(${rooferBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}
      >
        {/* Dark overlay to blend with lamp */}
        <div className="absolute inset-0 bg-slate-950/60" />
        
        <LampContainer className="min-h-[700px] relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-center"
        >
          <p className="text-orange-400 font-medium mb-4 tracking-wider uppercase text-sm">
            Licensed & Insured Roofing Experts
          </p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
            Protecting Your Home
            <br />
            From the Top Down
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-8">
            Professional roof repair, replacement, and installation services. 
            Serving the greater metro area for over 20 years.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/30 text-base">
              <Phone className="mr-2 h-5 w-5" />
              Call: (555) 123-4567
            </Button>
            <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800/50 backdrop-blur text-base">
              Schedule Inspection
            </Button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-400" />
              <span>25-Year Warranty</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-400" />
              <span>Same-Day Estimates</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-orange-400" />
              <span>4.9★ (200+ Reviews)</span>
            </div>
          </div>
        </motion.div>
      </LampContainer>
      </div>

      {/* Feature Steps Section */}
      <section className="py-16 bg-slate-900">
        <div className="container mx-auto px-6">
          <FeatureSteps 
            features={roofingFeatures}
            title="Our Simple Process"
            autoPlayInterval={4000}
            imageHeight="h-[350px] md:h-[400px]"
            className="bg-slate-800/50 rounded-2xl border border-slate-700/50"
          />
        </div>
      </section>

      {/* Services */}
      <section id="services">
        <FeaturesSectionWithHoverEffects 
          title="Our Services"
          className="bg-slate-800"
        />
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-slate-900">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Why Choose Summit Roofing?</h2>
            <div className="grid sm:grid-cols-2 gap-6 text-left">
              {[
                "Licensed, bonded, and fully insured",
                "Free, no-obligation estimates",
                "Premium materials from trusted brands",
                "Clean job sites — we respect your property",
                "Financing options available",
                "24/7 emergency repair services",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-orange-500">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-orange-100 mb-8 max-w-xl mx-auto">
            Get a free roof inspection and estimate. No pressure, just honest advice.
          </p>
          <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white">
            Schedule Your Free Estimate
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 relative overflow-hidden">
        <FooterBackgroundGradient />
        
        <div className="container mx-auto px-6 py-12 relative z-10">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand */}
            <div>
              <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                <span className="text-orange-400">🏠</span> Summit Roofing
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Professional roofing services you can trust. Family-owned and operated since 2004.
              </p>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-semibold text-white mb-4">Services</h4>
              <ul className="space-y-2 text-sm">
                {["Roof Replacement", "Roof Repair", "Inspections", "Storm Damage"].map((link) => (
                  <li key={link}>
                    <a href="#services" className="text-slate-400 hover:text-orange-400 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-white mb-4">Contact Us</h4>
              <div className="space-y-3 text-sm">
                <a href="tel:+15551234567" className="flex items-center gap-2 text-slate-400 hover:text-orange-400 transition-colors">
                  <Phone className="h-4 w-4 text-orange-400" />
                  <span>(555) 123-4567</span>
                </a>
                <a href="mailto:info@summitroofing.com" className="flex items-center gap-2 text-slate-400 hover:text-orange-400 transition-colors">
                  <Mail className="h-4 w-4 text-orange-400" />
                  <span>info@summitroofing.com</span>
                </a>
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin className="h-4 w-4 text-orange-400" />
                  <span>123 Main St, Anytown USA</span>
                </div>
              </div>
            </div>

            {/* Social */}
            <div>
              <h4 className="font-semibold text-white mb-4">Follow Us</h4>
              <div className="flex gap-3">
                {[Facebook, Instagram, Twitter].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-orange-500 hover:text-white transition-all"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Divider & Copyright */}
          <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
            <p>© {new Date().getFullYear()} Summit Roofing Co. All rights reserved.</p>
            <p className="mt-2 md:mt-0 text-xs">
              Demo site by <Link to="/" className="text-orange-400 hover:underline">Pleasant Cove Design</Link>
            </p>
          </div>
        </div>

        {/* Text Hover Effect Background */}
        <div className="h-40 flex items-center justify-center">
          <TextHoverEffect text="SUMMIT" />
        </div>
      </footer>
    </div>
  );
};

export default RooferDemo;
