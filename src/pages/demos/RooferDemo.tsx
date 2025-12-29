import { Link } from "react-router-dom";
import { ArrowLeft, Phone, Mail, MapPin, Star, CheckCircle, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeatureSteps } from "@/components/ui/feature-section";
import rooferHero from "@/assets/demos/roofer-hero.jpeg";

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
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/#demos" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <span className="font-bold text-xl">Summit Roofing Co.</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#services" className="text-slate-300 hover:text-white">Services</a>
            <a href="#about" className="text-slate-300 hover:text-white">About</a>
            <a href="#reviews" className="text-slate-300 hover:text-white">Reviews</a>
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
              Get Free Estimate
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero with Feature Steps */}
      <section className="relative py-12 md:py-20 bg-gradient-to-b from-slate-800 to-slate-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-8">
            <p className="text-orange-400 font-medium mb-4">Licensed & Insured Roofing Experts</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Protecting Your Home From the Top Down
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Professional roof repair, replacement, and installation services. 
              Serving the greater metro area for over 20 years.
            </p>
          </div>
          
          <FeatureSteps 
            features={roofingFeatures}
            title="Our Simple Process"
            autoPlayInterval={4000}
            imageHeight="h-[350px] md:h-[400px]"
            className="bg-slate-800/50 rounded-2xl border border-slate-700"
          />
          
          <div className="flex flex-wrap justify-center gap-4 mt-10">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
              <Phone className="mr-2 h-5 w-5" />
              Call Now: (555) 123-4567
            </Button>
            <Button size="lg" variant="outline" className="border-slate-500 text-white hover:bg-slate-800">
              Schedule Inspection
            </Button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm">
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
              <span>4.9★ Rating (200+ Reviews)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 bg-slate-800">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Roof Replacement", desc: "Complete tear-off and installation with premium materials", icon: "🏠" },
              { title: "Roof Repair", desc: "Fix leaks, storm damage, and worn shingles", icon: "🔧" },
              { title: "Inspections", desc: "Comprehensive roof assessments and reports", icon: "🔍" },
            ].map((service) => (
              <div key={service.title} className="bg-slate-700 rounded-xl p-6 hover:bg-slate-600 transition-colors">
                <span className="text-4xl mb-4 block">{service.icon}</span>
                <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                <p className="text-slate-300">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
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
      <footer className="bg-slate-800 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">Summit Roofing Co.</h3>
              <p className="text-slate-400 text-sm">
                Professional roofing services you can trust. Family-owned and operated since 2004.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-4">Contact</h4>
              <div className="space-y-2 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>(555) 123-4567</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>info@summitroofing.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>123 Main St, Anytown USA</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-4">Service Areas</h4>
              <p className="text-sm text-slate-400">
                Metro City, Suburbs, Nearby Towns, and surrounding areas within 50 miles.
              </p>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-sm text-slate-500">
            <p>© 2024 Summit Roofing Co. All rights reserved.</p>
            <p className="mt-2 text-xs">
              Demo site by <Link to="/" className="text-orange-400 hover:underline">Pleasant Cove Design</Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RooferDemo;
