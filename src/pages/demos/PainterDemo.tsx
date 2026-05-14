import { Link } from "react-router-dom";
import { ArrowLeft, Phone, Mail, MapPin, Star, CheckCircle, Clock, Shield, Brush, Facebook, Instagram } from "lucide-react";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { FeatureSteps } from "@/components/ui/feature-section";
import { TextHoverEffect, FooterBackgroundGradient } from "@/components/ui/hover-footer";
import { motion } from "framer-motion";
import painterHero from "@/assets/demos/painter-hero.jpg";
import painterAtWork from "@/assets/demos/painter-at-work.jpg";
import painterInterior from "@/assets/demos/painter-interior.jpg";
import painterCabinets from "@/assets/demos/painter-cabinets.jpg";
import painterDeck from "@/assets/demos/painter-deck.jpg";
import painterCottage from "@/assets/demos/painter-cottage.jpg";
import painterBedroom from "@/assets/demos/painter-bedroom.jpg";

const processSteps = [
  {
    step: "Step 1",
    title: "Free On-Site Estimate",
    content: "We come out, walk the project with you, and write a detailed estimate — colors, prep work, timeline, the whole thing. No pressure, no salespeople.",
    image: painterAtWork,
  },
  {
    step: "Step 2",
    title: "Prep Done Right",
    content: "Pressure wash, scrape, sand, prime, caulk, mask. The boring part nobody sees — but it's why our paint jobs last 10+ years up here on the coast.",
    image: painterInterior,
  },
  {
    step: "Step 3",
    title: "Clean Finish, Clean Site",
    content: "Premium Benjamin Moore and Sherwin-Williams paint, careful cut lines, and we leave your property cleaner than we found it. Final walk-through together.",
    image: painterHero,
  },
];

const services = [
  {
    icon: Brush,
    title: "Exterior House Painting",
    desc: "Clapboard, shingle, trim, doors. Built for Maine winters and salt air.",
    image: painterHero,
  },
  {
    icon: Brush,
    title: "Interior Painting",
    desc: "Walls, ceilings, trim. Low-VOC options for kids and pets. Furniture moved and protected.",
    image: painterInterior,
  },
  {
    icon: Brush,
    title: "Cabinet Refinishing",
    desc: "Spray-finished kitchen and bath cabinets. Looks like new construction, costs a fraction of a remodel.",
    image: painterCabinets,
  },
  {
    icon: Brush,
    title: "Deck Staining & Sealing",
    desc: "Strip, sand, and re-stain decks, railings, and outdoor wood. Annual maintenance plans available.",
    image: painterDeck,
  },
];

const galleryShots = [
  { src: painterCottage, label: "Shingle cottage refresh — Damariscotta" },
  { src: painterBedroom, label: "Sage bedroom repaint — Newcastle" },
  { src: painterCabinets, label: "Navy cabinet refinish — Boothbay" },
  { src: painterDeck, label: "Cedar deck restoration — Bristol" },
];

const PainterDemo = () => {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-stone-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-stone-400 hover:text-stone-600 transition-colors text-xs opacity-70 hover:opacity-100"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Pleasant Cove Design</span>
            </Link>
            <span className="font-bold text-xl tracking-tight">Coastal Coat Painters</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#services" className="text-stone-600 hover:text-stone-900 transition-colors">Services</a>
            <a href="#work" className="text-stone-600 hover:text-stone-900 transition-colors">Recent Work</a>
            <a href="#reviews" className="text-stone-600 hover:text-stone-900 transition-colors">Reviews</a>
            <ShimmerButton
              shimmerColor="#ffffff"
              background="rgb(15, 23, 42)"
              className="text-sm font-medium px-6 py-2"
            >
              Free Estimate
            </ShimmerButton>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden [transform:translateZ(0)]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${painterHero})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/65 to-slate-900/80" />

        <div className="relative z-10 min-h-[640px] flex items-center justify-center px-6 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-center max-w-4xl"
          >
            <p className="text-white/90 font-medium mb-4 tracking-wider uppercase text-sm">
              Licensed &amp; Insured · Damariscotta, Maine
            </p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight bg-gradient-to-b from-white to-stone-300 bg-clip-text text-transparent">
              Paint That Lasts
              <br />
              Through Maine Winters
            </h1>
            <p className="text-lg md:text-xl text-stone-200 max-w-2xl mx-auto mb-8">
              Honest exterior and interior painting for Midcoast Maine homes.
              No subcontractors, no surprises — just careful prep and a finish you'll be proud of.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <ShimmerButton
                shimmerColor="#ffffff"
                background="rgb(15, 23, 42)"
                className="text-base font-medium px-6 py-3"
              >
                <Phone className="mr-2 h-5 w-5" />
                Call: (207) 555-0148
              </ShimmerButton>
              <ShimmerButton
                shimmerColor="#ffffff"
                background="rgba(255,255,255,0.15)"
                className="backdrop-blur text-base font-medium border border-white/30"
              >
                Get a Free Estimate
              </ShimmerButton>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-stone-200">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-300" />
                <span>Fully Insured</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-300" />
                <span>Estimates Within 48 Hours</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-300" />
                <span>4.9★ on Google (60+ Reviews)</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Process */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-6">
          <FeatureSteps
            features={processSteps}
            title="How We Work"
            autoPlayInterval={4500}
            imageHeight="h-[350px] md:h-[400px]"
            className="bg-stone-100 rounded-2xl border border-stone-200"
          />
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 bg-stone-100">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <p className="text-amber-700 font-medium uppercase tracking-wider text-sm mb-3">What We Paint</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Services</h2>
            <p className="text-stone-600">
              Residential work across Damariscotta, Newcastle, Boothbay, Wiscasset, and the rest of Midcoast Maine.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-44 overflow-hidden">
                  <img
                    src={s.image}
                    alt={s.title}
                    loading="lazy"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                  <p className="text-sm text-stone-600 leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Work Gallery */}
      <section id="work" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <p className="text-amber-700 font-medium uppercase tracking-wider text-sm mb-3">Recent Work</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">From Around Midcoast</h2>
            <p className="text-stone-600">
              A few jobs from the last season. Real homes, real customers — happy to put you in touch with any of them.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {galleryShots.map((g) => (
              <motion.div
                key={g.label}
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative rounded-2xl overflow-hidden group"
              >
                <img
                  src={g.src}
                  alt={g.label}
                  loading="lazy"
                  className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5">
                  <p className="text-white text-sm font-medium">{g.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="py-20 bg-stone-100">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8 tracking-tight">Why Coastal Coat?</h2>
            <div className="grid sm:grid-cols-2 gap-6 text-left">
              {[
                "Owner on every job site — no subs you've never met",
                "Premium paints rated for coastal weather (Aura, Emerald)",
                "Detailed written estimates, no vague verbal quotes",
                "We move and re-cover your furniture ourselves",
                "Color consultation included with every interior job",
                "2-year workmanship warranty in writing",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span className="text-stone-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-amber-700 font-medium uppercase tracking-wider text-sm mb-3">What Neighbors Say</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">From Real Midcoast Customers</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                name: "Linda H.",
                town: "Damariscotta",
                quote:
                  "Coastal Coat repainted our 1890 farmhouse last summer. They prepped everything properly — scraped, primed, the works. A year later it still looks brand new through a Maine winter. Worth every penny.",
              },
              {
                name: "Mike R.",
                town: "Boothbay Harbor",
                quote:
                  "Got three estimates for our cabinets. Coastal Coat wasn't the cheapest but they were the only ones who explained the prep process. The finish is honestly indistinguishable from new cabinets. Couldn't be happier.",
              },
            ].map((r) => (
              <div
                key={r.name}
                className="bg-stone-50 rounded-2xl p-6 border border-stone-200"
              >
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <p className="text-stone-700 leading-relaxed mb-4">"{r.quote}"</p>
                <p className="text-sm font-medium text-stone-900">
                  {r.name} <span className="text-stone-500 font-normal">· {r.town}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-6 text-center max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Ready for a Free Estimate?</h2>
          <p className="text-stone-300 mb-8">
            Tell us a bit about the project. We'll come out, walk through it with you, and have a written estimate
            in your inbox within two business days.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <ShimmerButton
              shimmerColor="#ffffff"
              background="rgb(217, 119, 6)"
              className="text-base font-medium px-6 py-3"
            >
              <Phone className="mr-2 h-5 w-5" />
              (207) 555-0148
            </ShimmerButton>
            <ShimmerButton
              shimmerColor="#ffffff"
              background="rgba(255,255,255,0.1)"
              className="text-base font-medium border border-white/30"
            >
              Request Online
            </ShimmerButton>
          </div>
          <div className="flex justify-center items-center gap-2 text-stone-400 text-sm mt-8">
            <MapPin className="h-4 w-4" />
            <span>Serving Damariscotta, Newcastle, Boothbay, Wiscasset, Bristol &amp; nearby</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-950 relative overflow-hidden text-stone-300">
        <FooterBackgroundGradient />
        <div className="container mx-auto px-6 py-12 relative z-10">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-xl mb-4 text-white flex items-center gap-2">
                <Brush className="h-5 w-5 text-amber-400" /> Coastal Coat
              </h3>
              <p className="text-stone-400 text-sm leading-relaxed">
                Family-owned house painting based in Damariscotta. Honest work for Midcoast Maine homes.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Services</h4>
              <ul className="space-y-2 text-sm">
                {["Exterior Painting", "Interior Painting", "Cabinet Refinishing", "Deck Staining"].map((link) => (
                  <li key={link}>
                    <a href="#services" className="text-stone-400 hover:text-amber-400 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <div className="space-y-3 text-sm">
                <a href="tel:+12075550148" className="flex items-center gap-2 text-stone-400 hover:text-amber-400 transition-colors">
                  <Phone className="h-4 w-4 text-amber-400" />
                  <span>(207) 555-0148</span>
                </a>
                <a href="mailto:hello@coastalcoatme.com" className="flex items-center gap-2 text-stone-400 hover:text-amber-400 transition-colors">
                  <Mail className="h-4 w-4 text-amber-400" />
                  <span>hello@coastalcoatme.com</span>
                </a>
                <div className="flex items-center gap-2 text-stone-400">
                  <MapPin className="h-4 w-4 text-amber-400" />
                  <span>Damariscotta, ME</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Follow</h4>
              <div className="flex gap-3">
                {[Facebook, Instagram].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center text-stone-400 hover:bg-amber-500 hover:text-white transition-all"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-stone-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-stone-500">
            <p>© {new Date().getFullYear()} Coastal Coat Painters. All rights reserved.</p>
            <p className="mt-2 md:mt-0 text-xs">
              Demo site by <Link to="/" className="text-amber-400 hover:underline">Pleasant Cove Design</Link>
            </p>
          </div>
        </div>

        <div className="h-40 flex items-center justify-center">
          <TextHoverEffect text="COASTAL" />
        </div>
      </footer>
    </div>
  );
};

export default PainterDemo;
