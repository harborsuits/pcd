import { Link } from "react-router-dom";
import { ArrowLeft, Phone, Mail, MapPin, Star, CheckCircle, Clock, Shield, Leaf, Facebook, Instagram } from "lucide-react";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { FeatureSteps } from "@/components/ui/feature-section";
import { TextHoverEffect, FooterBackgroundGradient } from "@/components/ui/hover-footer";
import { motion } from "framer-motion";
import landscaperHero from "@/assets/demos/landscaper-hero.jpg";
import landscaperMowing from "@/assets/demos/landscaper-mowing.jpg";
import landscaperPatio from "@/assets/demos/landscaper-patio.jpg";
import landscaperMulch from "@/assets/demos/landscaper-mulch.jpg";
import landscaperPlowing from "@/assets/demos/landscaper-plowing.jpg";
import landscaperPlanting from "@/assets/demos/landscaper-planting.jpg";
import landscaperProperty from "@/assets/demos/landscaper-property.jpg";

const processSteps = [
  {
    step: "Step 1",
    title: "Walk the Property",
    content: "We meet you on-site, talk through what you want, and look at sun, drainage, and soil. Honest conversation, no high-pressure quote.",
    image: landscaperPlanting,
  },
  {
    step: "Step 2",
    title: "Written Plan & Quote",
    content: "Detailed scope and pricing — what plants, what stone, what schedule. You'll know exactly what you're paying for before we start.",
    image: landscaperMulch,
  },
  {
    step: "Step 3",
    title: "Show Up Every Week",
    content: "Mowing, edging, blowing — same crew, same day. We text when we're done. No surprise invoices, no skipped weeks.",
    image: landscaperHero,
  },
];

const services = [
  {
    icon: Leaf,
    title: "Weekly Lawn Care",
    desc: "Mow, edge, trim, blow. Same day every week, May through October. Seasonal contracts only.",
    image: landscaperMowing,
  },
  {
    icon: Leaf,
    title: "Spring & Fall Cleanups",
    desc: "Leaf removal, bed prep, mulching, pruning. Get the property reset twice a year.",
    image: landscaperMulch,
  },
  {
    icon: Leaf,
    title: "Patios & Walkways",
    desc: "Natural granite, fieldstone, and bluestone hardscaping. Built to handle Maine frost heaves.",
    image: landscaperPatio,
  },
  {
    icon: Leaf,
    title: "Snow Plowing",
    desc: "Per-storm and seasonal driveway plowing across Midcoast. Reliable predawn service all winter.",
    image: landscaperPlowing,
  },
];

const galleryShots = [
  { src: landscaperProperty, label: "Full property maintenance — Boothbay" },
  { src: landscaperPatio, label: "Bluestone patio & fire pit — Damariscotta" },
  { src: landscaperMulch, label: "Spring cleanup & mulch — Newcastle" },
  { src: landscaperPlowing, label: "Seasonal plowing route — Wiscasset" },
];

const LandscaperDemo = () => {
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
            <span className="font-bold text-xl tracking-tight">Stonewall &amp; Spruce</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#services" className="text-stone-600 hover:text-stone-900 transition-colors">Services</a>
            <a href="#work" className="text-stone-600 hover:text-stone-900 transition-colors">Recent Work</a>
            <a href="#reviews" className="text-stone-600 hover:text-stone-900 transition-colors">Reviews</a>
            <ShimmerButton
              shimmerColor="#ffffff"
              background="rgb(20, 83, 45)"
              className="text-sm font-medium px-6 py-2"
            >
              Get a Quote
            </ShimmerButton>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden [transform:translateZ(0)]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${landscaperHero})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/80 via-emerald-950/65 to-emerald-950/80" />

        <div className="relative z-10 min-h-[640px] flex items-center justify-center px-6 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-center max-w-4xl"
          >
            <p className="text-white/90 font-medium mb-4 tracking-wider uppercase text-sm">
              Year-Round Property Care · Newcastle, Maine
            </p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight bg-gradient-to-b from-white to-stone-300 bg-clip-text text-transparent">
              The Crew That
              <br />
              Actually Shows Up
            </h1>
            <p className="text-lg md:text-xl text-stone-200 max-w-2xl mx-auto mb-8">
              Lawn care, hardscaping, and snow plowing across Midcoast Maine.
              Reliable weekly service from a small local crew you'll recognize.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <ShimmerButton
                shimmerColor="#ffffff"
                background="rgb(20, 83, 45)"
                className="text-base font-medium px-6 py-3"
              >
                <Phone className="mr-2 h-5 w-5" />
                Call: (207) 555-0162
              </ShimmerButton>
              <ShimmerButton
                shimmerColor="#ffffff"
                background="rgba(255,255,255,0.15)"
                className="backdrop-blur text-base font-medium border border-white/30"
              >
                Request a Quote
              </ShimmerButton>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-stone-200">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-lime-300" />
                <span>Fully Insured</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-lime-300" />
                <span>Same Day Each Week</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-lime-300" />
                <span>4.9★ on Google</span>
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
            <p className="text-emerald-700 font-medium uppercase tracking-wider text-sm mb-3">What We Do</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Services</h2>
            <p className="text-stone-600">
              Year-round care for residential and small commercial properties across Midcoast Maine.
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
            <p className="text-emerald-700 font-medium uppercase tracking-wider text-sm mb-3">Recent Work</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">From Around Midcoast</h2>
            <p className="text-stone-600">
              A handful of properties from this season. Happy to share references in your town.
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
            <h2 className="text-3xl font-bold mb-8 tracking-tight">Why Stonewall &amp; Spruce?</h2>
            <div className="grid sm:grid-cols-2 gap-6 text-left">
              {[
                "Same crew on your property all season",
                "Routes built tight — we don't overbook",
                "Fully insured for residential and commercial",
                "Text updates after every visit",
                "Year-round contracts include snow plowing",
                "Locally owned — based in Newcastle, ME",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
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
            <p className="text-emerald-700 font-medium uppercase tracking-wider text-sm mb-3">What Neighbors Say</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">From Real Midcoast Customers</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                name: "Susan B.",
                town: "Boothbay Harbor",
                quote:
                  "Switched to Stonewall last spring after our previous crew started skipping weeks. Same two guys every Tuesday, lawn looks better than it has in years, and they actually answer the phone.",
              },
              {
                name: "Tom & Janet K.",
                town: "Newcastle",
                quote:
                  "They built our bluestone patio and now plow our driveway all winter. One crew, one bill, no chasing people down. Worth every penny for the peace of mind.",
              },
            ].map((r) => (
              <div
                key={r.name}
                className="bg-stone-50 rounded-2xl p-6 border border-stone-200"
              >
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-emerald-600 text-emerald-600" />
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
      <section className="relative py-20 bg-emerald-950 text-white">
        <div className="container mx-auto px-6 text-center max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Booking the 2026 Season</h2>
          <p className="text-stone-300 mb-8">
            Weekly routes fill up by April. Get on the schedule now and we'll lock in your day for the season —
            mowing through November, plowing through March.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <ShimmerButton
              shimmerColor="#ffffff"
              background="rgb(132, 204, 22)"
              className="text-base font-medium px-6 py-3"
            >
              <Phone className="mr-2 h-5 w-5" />
              (207) 555-0162
            </ShimmerButton>
            <ShimmerButton
              shimmerColor="#ffffff"
              background="rgba(255,255,255,0.1)"
              className="text-base font-medium border border-white/30"
            >
              Request a Quote
            </ShimmerButton>
          </div>
          <div className="flex justify-center items-center gap-2 text-stone-400 text-sm mt-8">
            <MapPin className="h-4 w-4" />
            <span>Routes in Newcastle, Damariscotta, Wiscasset, Boothbay, Bristol &amp; Edgecomb</span>
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
                <Leaf className="h-5 w-5 text-lime-400" /> Stonewall &amp; Spruce
              </h3>
              <p className="text-stone-400 text-sm leading-relaxed">
                Year-round property care based in Newcastle. Family-owned crew serving Midcoast Maine.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Services</h4>
              <ul className="space-y-2 text-sm">
                {["Lawn Care", "Hardscaping", "Spring/Fall Cleanups", "Snow Plowing"].map((link) => (
                  <li key={link}>
                    <a href="#services" className="text-stone-400 hover:text-lime-400 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <div className="space-y-3 text-sm">
                <a href="tel:+12075550162" className="flex items-center gap-2 text-stone-400 hover:text-lime-400 transition-colors">
                  <Phone className="h-4 w-4 text-lime-400" />
                  <span>(207) 555-0162</span>
                </a>
                <a href="mailto:hello@stonewallspruce.com" className="flex items-center gap-2 text-stone-400 hover:text-lime-400 transition-colors">
                  <Mail className="h-4 w-4 text-lime-400" />
                  <span>hello@stonewallspruce.com</span>
                </a>
                <div className="flex items-center gap-2 text-stone-400">
                  <MapPin className="h-4 w-4 text-lime-400" />
                  <span>Newcastle, ME</span>
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
                    className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center text-stone-400 hover:bg-emerald-600 hover:text-white transition-all"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-stone-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-stone-500">
            <p>© {new Date().getFullYear()} Stonewall &amp; Spruce. All rights reserved.</p>
            <p className="mt-2 md:mt-0 text-xs">
              Demo site by <Link to="/" className="text-lime-400 hover:underline">Pleasant Cove Design</Link>
            </p>
          </div>
        </div>

        <div className="h-40 flex items-center justify-center">
          <TextHoverEffect text="STONEWALL" />
        </div>
      </footer>
    </div>
  );
};

export default LandscaperDemo;
