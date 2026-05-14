import { Link } from "react-router-dom";
import { ArrowLeft, Phone, Mail, MapPin, Star, CheckCircle, Snowflake, Truck, Hammer, Sprout, ArrowRight, Facebook, Instagram } from "lucide-react";
import { motion } from "framer-motion";
import landscaperHero from "@/assets/demos/landscaper-hero.jpg";
import landscaperMowing from "@/assets/demos/landscaper-mowing.jpg";
import landscaperPatio from "@/assets/demos/landscaper-patio.jpg";
import landscaperMulch from "@/assets/demos/landscaper-mulch.jpg";
import landscaperPlowing from "@/assets/demos/landscaper-plowing.jpg";
import landscaperPlanting from "@/assets/demos/landscaper-planting.jpg";
import landscaperProperty from "@/assets/demos/landscaper-property.jpg";

const seasons = [
  {
    icon: Sprout,
    label: "Spring",
    months: "Apr — May",
    title: "Cleanup & Wake-Up",
    desc: "Bed clear, dethatch, edge, mulch, first cut. Property ready for the season.",
    image: landscaperMulch,
  },
  {
    icon: Truck,
    label: "Summer",
    months: "Jun — Aug",
    title: "Weekly Maintenance",
    desc: "Mow, edge, trim, blow. Same day, every week. Text when we're done.",
    image: landscaperMowing,
  },
  {
    icon: Hammer,
    label: "Fall",
    months: "Sep — Nov",
    title: "Leaves & Hardscape",
    desc: "Leaf removal, final cut, stone walls and patio installs before frost.",
    image: landscaperPatio,
  },
  {
    icon: Snowflake,
    label: "Winter",
    months: "Dec — Mar",
    title: "Plow & Salt",
    desc: "Pre-dawn driveway plowing, walkway shoveling, sand and salt as needed.",
    image: landscaperPlowing,
  },
];

const stats = [
  { num: "12", label: "Years on the road" },
  { num: "180+", label: "Properties this season" },
  { num: "6", label: "Towns served" },
  { num: "4.9★", label: "Google rating" },
];

const tiers = [
  {
    name: "Mow Only",
    price: "$55+",
    cadence: "per visit",
    blurb: "Weekly mow, edge, trim, blow. Seasonal contract, May through October.",
    features: ["Same day each week", "Same crew all season", "Text when complete"],
  },
  {
    name: "Full Property",
    price: "$220+",
    cadence: "per month",
    blurb: "Weekly mow plus spring cleanup, mulch refresh, fall leaf removal.",
    features: ["Everything in Mow Only", "Spring + fall cleanup", "Annual mulch refresh", "Pruning & deadheading"],
    featured: true,
  },
  {
    name: "Year-Round",
    price: "Custom",
    cadence: "annual",
    blurb: "Full Property plus winter plowing, salting, and emergency snow callouts.",
    features: ["Everything in Full Property", "Per-storm plowing", "Walkway shoveling", "Priority storm response"],
  },
];

const towns = ["Newcastle", "Damariscotta", "Wiscasset", "Boothbay Harbor", "Bristol", "Edgecomb"];

const LandscaperDemo = () => {
  return (
    <div className="min-h-screen bg-[#f4efe6] text-stone-900 font-sans">
      {/* Header — minimal, left-aligned brand */}
      <header className="border-b border-stone-300/60 bg-[#f4efe6]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-stone-500 hover:text-stone-700 transition-colors text-xs"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Pleasant Cove Design</span>
            </Link>
            <div className="font-serif text-2xl tracking-tight">
              Stonewall <span className="italic text-stone-500">&amp;</span> Spruce
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            <a href="#seasons" className="text-stone-600 hover:text-stone-900 transition-colors">Seasons</a>
            <a href="#pricing" className="text-stone-600 hover:text-stone-900 transition-colors">Pricing</a>
            <a href="#work" className="text-stone-600 hover:text-stone-900 transition-colors">Work</a>
            <a
              href="tel:+12075550162"
              className="flex items-center gap-2 bg-stone-900 text-[#f4efe6] px-5 py-2.5 rounded-full hover:bg-stone-800 transition-colors"
            >
              <Phone className="h-3.5 w-3.5" />
              (207) 555-0162
            </a>
          </nav>
        </div>
      </header>

      {/* Hero — split layout, no overlay-on-photo */}
      <section className="container mx-auto px-6 pt-12 md:pt-20 pb-12">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-stone-500 mb-6">
                <span className="h-px w-8 bg-stone-400" />
                Newcastle, Maine · Est. 2013
              </div>
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight mb-6">
                Property care
                <br />
                <span className="italic text-emerald-800">that turns up.</span>
              </h1>
              <p className="text-lg text-stone-600 leading-relaxed max-w-lg mb-8">
                A small Newcastle crew that mows, plants, builds, and plows the same Midcoast properties year after year.
                One bill, one phone number, every season.
              </p>
              <div className="flex flex-wrap gap-3 mb-10">
                <a
                  href="#pricing"
                  className="inline-flex items-center gap-2 bg-emerald-800 text-white px-6 py-3 rounded-full font-medium hover:bg-emerald-900 transition-colors"
                >
                  See pricing <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 bg-transparent border border-stone-400 text-stone-800 px-6 py-3 rounded-full font-medium hover:bg-stone-900 hover:text-[#f4efe6] hover:border-stone-900 transition-colors"
                >
                  Get on the route
                </a>
              </div>
              <div className="flex items-center gap-6 text-sm text-stone-500">
                <div className="flex items-center gap-1.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  ))}
                  <span className="ml-1 text-stone-700 font-medium">4.9</span>
                  <span>· 80+ Google reviews</span>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-6 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="relative"
            >
              <img
                src={landscaperProperty}
                alt="Coastal Maine property maintained by Stonewall & Spruce"
                className="w-full aspect-[4/5] object-cover rounded-[28px] shadow-xl"
              />
              {/* Floating overlay card */}
              <div className="absolute -bottom-8 -left-4 md:-left-10 bg-white rounded-2xl shadow-2xl p-5 max-w-[280px] border border-stone-100">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-emerald-800 flex items-center justify-center text-white">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-stone-500 uppercase tracking-wider">On the route today</div>
                    <div className="font-semibold text-stone-900">Boothbay → Newcastle</div>
                  </div>
                </div>
              </div>
              {/* Floating chip */}
              <div className="hidden md:flex absolute -top-4 -right-4 bg-amber-300 text-stone-900 rounded-full px-4 py-2 text-sm font-medium shadow-lg rotate-3">
                Booking 2026 routes
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-stone-900 text-stone-100 py-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
            {stats.map((s) => (
              <div key={s.label} className="text-center md:text-left">
                <div className="font-serif text-4xl md:text-5xl tracking-tight text-amber-300">{s.num}</div>
                <div className="text-xs uppercase tracking-[0.18em] text-stone-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Four Seasons grid */}
      <section id="seasons" className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mb-14">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-800 font-medium mb-3">What we do</p>
            <h2 className="font-serif text-4xl md:text-5xl tracking-tight mb-4">Four seasons, one crew.</h2>
            <p className="text-stone-600 text-lg">
              Maine has a real winter. Most landscapers vanish in November and rebrand as plow guys. We're the same
              team all twelve months — that's why nothing falls through the cracks.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {seasons.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="bg-white rounded-3xl overflow-hidden border border-stone-200 group hover:shadow-xl transition-shadow"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={s.image}
                    alt={s.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur rounded-full px-3 py-1 flex items-center gap-1.5 text-xs font-medium">
                    <s.icon className="h-3.5 w-3.5 text-emerald-800" />
                    {s.label} · {s.months}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-xl mb-2">{s.title}</h3>
                  <p className="text-sm text-stone-600 leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mosaic gallery — asymmetric */}
      <section id="work" className="py-24 bg-stone-900 text-stone-100">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div className="max-w-xl">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-300 font-medium mb-3">Recent work</p>
              <h2 className="font-serif text-4xl md:text-5xl tracking-tight">From around Midcoast.</h2>
            </div>
            <p className="text-stone-400 max-w-md">
              Real properties. Happy to share references in your town before you sign anything.
            </p>
          </div>

          <div className="grid grid-cols-12 grid-rows-2 gap-4 h-[640px]">
            <div className="col-span-12 md:col-span-7 row-span-2 relative rounded-2xl overflow-hidden group">
              <img src={landscaperPatio} alt="Bluestone patio install" loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <div className="text-xs uppercase tracking-[0.2em] text-amber-300 mb-1">Hardscape</div>
                <div className="text-white font-serif text-2xl">Bluestone patio &amp; fire pit — Damariscotta</div>
              </div>
            </div>
            <div className="col-span-6 md:col-span-5 relative rounded-2xl overflow-hidden group">
              <img src={landscaperMulch} alt="Spring cleanup" loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <div className="text-white text-sm font-medium">Spring cleanup &amp; mulch — Newcastle</div>
              </div>
            </div>
            <div className="col-span-6 md:col-span-5 relative rounded-2xl overflow-hidden group">
              <img src={landscaperPlowing} alt="Snow plowing" loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <div className="text-white text-sm font-medium">Seasonal plow route — Wiscasset</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing tiers */}
      <section id="pricing" className="py-24 bg-[#f4efe6]">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-800 font-medium mb-3">Honest pricing</p>
            <h2 className="font-serif text-4xl md:text-5xl tracking-tight mb-4">Pick a plan, lock the day.</h2>
            <p className="text-stone-600 text-lg">
              Starting prices for an average half-acre Midcoast lot. Final quote after a quick walkthrough — no
              surprise upcharges mid-season.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={`rounded-3xl p-7 border ${
                  t.featured
                    ? "bg-stone-900 text-stone-100 border-stone-900 shadow-2xl md:-translate-y-3"
                    : "bg-white border-stone-200"
                }`}
              >
                {t.featured && (
                  <div className="inline-block bg-amber-300 text-stone-900 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
                    Most popular
                  </div>
                )}
                <div className="font-serif text-2xl mb-1">{t.name}</div>
                <div className="flex items-baseline gap-1.5 mb-3">
                  <span className="font-serif text-4xl">{t.price}</span>
                  <span className={`text-sm ${t.featured ? "text-stone-400" : "text-stone-500"}`}>{t.cadence}</span>
                </div>
                <p className={`text-sm mb-5 ${t.featured ? "text-stone-300" : "text-stone-600"}`}>{t.blurb}</p>
                <div className={`h-px w-full mb-5 ${t.featured ? "bg-stone-700" : "bg-stone-200"}`} />
                <ul className="space-y-3 mb-6">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${t.featured ? "text-amber-300" : "text-emerald-700"}`} />
                      <span className={t.featured ? "text-stone-200" : "text-stone-700"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact"
                  className={`block text-center w-full py-3 rounded-full font-medium transition-colors ${
                    t.featured
                      ? "bg-amber-300 text-stone-900 hover:bg-amber-200"
                      : "bg-stone-900 text-[#f4efe6] hover:bg-stone-800"
                  }`}
                >
                  Get started
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service area + single testimonial */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-800 font-medium mb-3">Service area</p>
              <h2 className="font-serif text-4xl tracking-tight mb-5">Tight routes,<br />close to home.</h2>
              <p className="text-stone-600 mb-6 leading-relaxed">
                We don't drive an hour to a job. Our routes stay tight around Newcastle and the Pemaquid peninsula
                so we're never late, never rushed, and never overbooked.
              </p>
              <div className="flex flex-wrap gap-2">
                {towns.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 bg-stone-100 border border-stone-200 px-4 py-2 rounded-full text-sm text-stone-700"
                  >
                    <MapPin className="h-3 w-3 text-emerald-700" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <motion.figure
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative bg-stone-50 border border-stone-200 rounded-3xl p-8 md:p-10"
            >
              <div className="font-serif text-6xl text-emerald-800 leading-none mb-3">"</div>
              <blockquote className="text-xl md:text-2xl font-serif leading-snug text-stone-800 mb-6">
                Switched last spring after our previous crew started skipping weeks. Same two guys every Tuesday now.
                Lawn looks better than it has in years — and they actually answer the phone.
              </blockquote>
              <figcaption className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-800 text-white font-medium flex items-center justify-center">
                  SB
                </div>
                <div>
                  <div className="font-medium text-stone-900">Susan B.</div>
                  <div className="text-sm text-stone-500">Boothbay Harbor</div>
                </div>
              </figcaption>
            </motion.figure>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="py-24 bg-emerald-900 text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center"
          style={{ backgroundImage: `url(${landscaperPlanting})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/90 to-emerald-950" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-serif text-4xl md:text-5xl tracking-tight mb-5">
              The 2026 route<br />is filling up.
            </h2>
            <p className="text-emerald-100 text-lg mb-8 leading-relaxed">
              Most weekly slots are claimed by April. Get on the schedule now and we'll lock your day for the season —
              mowing through November, plowing through March.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href="tel:+12075550162"
                className="inline-flex items-center gap-2 bg-amber-300 text-stone-900 px-7 py-3.5 rounded-full font-medium hover:bg-amber-200 transition-colors"
              >
                <Phone className="h-4 w-4" />
                (207) 555-0162
              </a>
              <a
                href="mailto:hello@stonewallspruce.com"
                className="inline-flex items-center gap-2 bg-white/10 border border-white/30 text-white px-7 py-3.5 rounded-full font-medium hover:bg-white/20 transition-colors backdrop-blur"
              >
                <Mail className="h-4 w-4" />
                Email us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-950 text-stone-400 py-14">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-10 mb-10">
            <div>
              <div className="font-serif text-2xl text-stone-100 mb-3">
                Stonewall <span className="italic text-stone-500">&amp;</span> Spruce
              </div>
              <p className="text-sm leading-relaxed">
                Year-round property care from a small Newcastle crew. Family-owned since 2013.
              </p>
            </div>
            <div className="text-sm space-y-2">
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-amber-300" /> (207) 555-0162</div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-amber-300" /> hello@stonewallspruce.com</div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-amber-300" /> Newcastle, ME</div>
            </div>
            <div className="flex md:justify-end gap-3">
              {[Facebook, Instagram].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full border border-stone-700 flex items-center justify-center hover:bg-amber-300 hover:text-stone-900 hover:border-amber-300 transition-all">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div className="border-t border-stone-800 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-stone-500">
            <p>© {new Date().getFullYear()} Stonewall &amp; Spruce. All rights reserved.</p>
            <p className="mt-2 md:mt-0">
              Demo site by <Link to="/" className="text-amber-300 hover:underline">Pleasant Cove Design</Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandscaperDemo;
