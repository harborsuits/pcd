import { Link } from "react-router-dom";
import { ArrowLeft, Phone, Mail, MapPin, ArrowUpRight, Hammer, Ruler, ClipboardCheck, KeyRound, Shield, Award, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import contractorHero from "@/assets/demos/contractor-hero.jpg";
import contractorKitchen from "@/assets/demos/contractor-kitchen.jpg";
import contractorAddition from "@/assets/demos/contractor-addition.jpg";
import contractorRenovation from "@/assets/demos/contractor-renovation.jpg";
import contractorPlans from "@/assets/demos/contractor-plans.jpg";
import contractorOwner from "@/assets/demos/contractor-owner.jpg";

const projects = [
  {
    no: "01",
    name: "Pemaquid Point Residence",
    type: "New Construction",
    location: "Bristol, ME",
    year: "2025",
    sqft: "3,840",
    months: "11",
    image: contractorHero,
    summary: "Cedar-shingle coastal home built to weather Atlantic storms. Granite foundation, standing-seam roof, custom millwork throughout.",
    note: "Finished a week early.",
  },
  {
    no: "02",
    name: "River Road Farmhouse",
    type: "Full Restoration",
    location: "Newcastle, ME",
    year: "2024",
    sqft: "2,650",
    months: "8",
    image: contractorRenovation,
    summary: "1840s colonial returned to working order. New mechanicals, restored trim, structural sistering, period-correct exterior.",
    note: "Original chestnut beams kept.",
  },
  {
    no: "03",
    name: "Damariscotta Lake House",
    type: "Kitchen + Great Room",
    location: "Jefferson, ME",
    year: "2024",
    sqft: "1,120",
    months: "4",
    image: contractorKitchen,
    summary: "Open plan rebuild with reclaimed beams, soapstone counters, and a center island sized for the way the family actually cooks.",
    note: "Hosted Thanksgiving in it.",
  },
  {
    no: "04",
    name: "Boothbay Screened Porch",
    type: "Addition",
    location: "Boothbay Harbor, ME",
    year: "2025",
    sqft: "420",
    months: "3",
    image: contractorAddition,
    summary: "Three-season porch off the main living area with mahogany decking and a clean tie-in to the existing roofline.",
    note: "Best sunset on the lake.",
  },
];

const phases = [
  { icon: Ruler, label: "Design + Estimate", days: "2 — 4 wks", desc: "Site walk, scope, and a fixed-price estimate. No mystery line items." },
  { icon: ClipboardCheck, label: "Permits + Schedule", days: "3 — 6 wks", desc: "We pull the permits, lock in subs, and give you a written timeline." },
  { icon: Hammer, label: "Build", days: "Per project", desc: "One lead carpenter on your job from day one. Weekly written updates." },
  { icon: KeyRound, label: "Walk-through + Punch", days: "1 wk", desc: "We walk the house with you. Punch list closed before final invoice." },
];

const ContractorDemo = () => {
  return (
    <div className="min-h-screen bg-[#1a1612] text-[#ece6dc] font-sans">
      {/* Demo banner */}
      <div className="bg-[#d96a3a] text-[#1a1612] text-center py-2 px-4 text-sm font-medium">
        <Link to="/" className="inline-flex items-center gap-2 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Demo by Pleasant Cove Design — see what your site could look like
        </Link>
      </div>

      {/* Top nav */}
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <div className="text-[10px] tracking-[0.3em] text-[#e89668] uppercase mb-1">Est. 1998 · Damariscotta</div>
            <div className="text-xl font-semibold tracking-tight">
              Damariscotta <span className="font-serif italic font-normal">Custom</span> Builders
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-white/70">
            <a href="#work" className="hover:text-white">Work</a>
            <a href="#process" className="hover:text-white">Process</a>
            <a href="#about" className="hover:text-white">About</a>
            <a href="#contact" className="hover:text-white">Contact</a>
          </nav>
          <a href="tel:+12075551234" className="hidden md:inline-flex items-center gap-2 text-sm border border-white/20 hover:border-white/60 px-4 py-2 rounded-full transition-colors">
            <Phone className="w-4 h-4" /> (207) 555-1234
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-10 grid lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-7">
            <div className="text-[11px] tracking-[0.4em] uppercase text-[#e89668] mb-6">A Midcoast General Contractor</div>
            <h1 className="text-5xl md:text-7xl font-semibold leading-[0.95] tracking-tight">
              Custom homes,<br />additions, and<br />
              <span className="font-serif italic font-normal text-[#f3d9b8]">honest</span> renovations.
            </h1>
            <p className="mt-8 text-lg text-white/65 max-w-xl leading-relaxed">
              Twenty-seven years building on the Midcoast. Fixed-price estimates, one lead carpenter per job, and a written timeline you can actually plan around.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a href="#contact" className="inline-flex items-center gap-2 bg-[#d96a3a] hover:bg-[#c25a2c] text-[#1a1612] px-7 py-4 text-sm font-semibold tracking-wide rounded-full transition-colors">
                Request an estimate <ArrowUpRight className="w-4 h-4" />
              </a>
              <a href="#work" className="inline-flex items-center gap-2 border border-white/30 hover:border-white px-7 py-4 text-sm font-semibold tracking-wide rounded-full transition-colors">
                View our work
              </a>
            </div>
          </div>
          <div className="lg:col-span-5 grid grid-cols-2 gap-6 text-sm">
            {[
              { n: "27", l: "Years building\nin Midcoast Maine" },
              { n: "140+", l: "Homes, additions,\nand renovations" },
              { n: "1", l: "Lead carpenter\non your job" },
              { n: "$0", l: "Surprise change\norders, ever" },
            ].map((s) => (
              <div key={s.l} className="border-t border-white/15 pt-4">
                <div className="text-4xl font-semibold tabular-nums">{s.n}</div>
                <div className="text-white/55 mt-1 whitespace-pre-line">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6">
          <motion.img
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            src={contractorHero}
            alt="Cedar-shingle custom home in coastal Maine at twilight"
            width={1600}
            height={1067}
            className="w-full aspect-[16/10] object-cover rounded-2xl"
          />
          <div className="flex justify-between text-xs text-white/45 mt-3 tracking-wider uppercase">
            <span>Pemaquid Point Residence — Bristol, ME</span>
            <span>Completed 2025</span>
          </div>
        </div>
      </section>

      {/* Now booking strip */}
      <section className="border-y border-white/10 bg-[#221c16] mt-16">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#e89668] animate-pulse" />
            <span className="text-white/80">Currently booking <span className="text-white font-semibold">Spring 2026</span> — additions and full renovations</span>
          </div>
          <div className="flex items-center gap-6 text-white/60">
            <span className="inline-flex items-center gap-2"><Shield className="w-4 h-4" /> Licensed & Insured ME #BLD-0421</span>
            <span className="inline-flex items-center gap-2"><Award className="w-4 h-4" /> EPA RRP Certified</span>
          </div>
        </div>
      </section>

      {/* Selected work */}
      <section id="work" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-16 flex-wrap gap-4">
            <div>
              <div className="text-[11px] tracking-[0.4em] uppercase text-[#e89668] mb-3">Selected Work</div>
              <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
                Recent projects, <span className="font-serif italic font-normal text-[#f3d9b8]">on the record.</span>
              </h2>
            </div>
            <div className="text-white/55 text-sm max-w-sm leading-relaxed">
              Every project below shows real square footage, real timeline, and real location. No stock photos.
            </div>
          </div>

          <div className="space-y-24">
            {projects.map((p, i) => (
              <motion.article
                key={p.no}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className={`grid lg:grid-cols-12 gap-10 items-center ${i % 2 === 1 ? "lg:[&>div:first-child]:order-2" : ""}`}
              >
                <div className="lg:col-span-7 relative">
                  <img
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                    className="w-full aspect-[4/3] object-cover rounded-2xl"
                  />
                  {/* Handwritten field note */}
                  <div
                    className={`hidden md:block absolute -bottom-5 ${i % 2 === 1 ? "-left-4" : "-right-4"} bg-[#f3d9b8] text-[#1a1612] px-5 py-3 rounded-lg shadow-xl ${i % 2 === 1 ? "rotate-2" : "-rotate-2"}`}
                    style={{ fontFamily: "Caveat, 'Bradley Hand', cursive" }}
                  >
                    <span className="text-xl leading-none">"{p.note}"</span>
                  </div>
                </div>
                <div className="lg:col-span-5">
                  <div className="flex items-center gap-4 text-xs tracking-[0.3em] uppercase text-white/40 mb-4">
                    <span>{p.no}</span>
                    <span className="h-px flex-1 bg-white/15" />
                    <span>{p.year}</span>
                  </div>
                  <h3 className="text-3xl font-semibold tracking-tight mb-2">
                    {p.name}
                  </h3>
                  <div className="text-[#e89668] text-sm tracking-wide uppercase mb-5">{p.type} · {p.location}</div>
                  <p className="text-white/70 leading-relaxed mb-8">{p.summary}</p>
                  <div className="grid grid-cols-2 gap-6 border-t border-white/10 pt-5">
                    <div>
                      <div className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-1">Square Feet</div>
                      <div className="text-2xl font-semibold tabular-nums">{p.sqft}</div>
                    </div>
                    <div>
                      <div className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-1">Build Time</div>
                      <div className="text-2xl font-semibold tabular-nums">{p.months} <span className="text-base text-white/55 font-normal">months</span></div>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="process" className="bg-[#221c16] border-y border-white/10 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-12 mb-16">
            <div className="lg:col-span-5">
              <div className="text-[11px] tracking-[0.4em] uppercase text-[#e89668] mb-3">How We Work</div>
              <h2 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
                Four phases.<br />
                <span className="font-serif italic font-normal text-[#f3d9b8]">No surprises.</span>
              </h2>
            </div>
            <div className="lg:col-span-7 text-white/65 text-lg leading-relaxed">
              You'll know what's happening on your house every Friday. We send a written update — what got done this week, what's planned for next week, and any decisions we need from you. That's it.
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {phases.map((phase, i) => (
              <div key={phase.label} className="bg-[#1a1612] rounded-2xl p-8 border border-white/5 hover:border-[#e89668]/40 transition-colors">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-5xl font-serif italic tabular-nums text-[#e89668]">0{i + 1}</div>
                  <phase.icon className="w-6 h-6 text-white/40" />
                </div>
                <div className="text-xs tracking-[0.3em] uppercase text-white/40 mb-2">{phase.days}</div>
                <h3 className="text-xl font-semibold mb-3">{phase.label}</h3>
                <p className="text-sm text-white/65 leading-relaxed">{phase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About / owner */}
      <section id="about" className="py-24">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative -rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="bg-[#f3d9b8] p-3 pb-16 shadow-2xl rounded-sm max-w-sm">
                <img
                  src={contractorOwner}
                  alt="Tom Bishop, owner of Damariscotta Custom Builders"
                  loading="lazy"
                  className="w-full aspect-[3/4] object-cover"
                />
                <div
                  className="text-[#1a1612] text-2xl text-center mt-4"
                  style={{ fontFamily: "Caveat, 'Bradley Hand', cursive" }}
                >
                  Tom — on site, 2025
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="text-[11px] tracking-[0.4em] uppercase text-[#e89668] mb-3">The Builder</div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
              Hi, I'm <span className="font-serif italic font-normal text-[#f3d9b8]">Tom Bishop.</span>
            </h2>
            <p className="text-lg text-white/75 leading-relaxed mb-5">
              I started swinging a hammer on the Midcoast in 1998. Damariscotta Custom Builders is a small crew on purpose — me, three lead carpenters, and the same handful of subcontractors I've used for fifteen years.
            </p>
            <p className="text-lg text-white/75 leading-relaxed mb-8">
              We don't run six jobs at once. We run two. That's how you get a finished house instead of a half-finished one.
            </p>
            <div className="grid sm:grid-cols-3 gap-6 border-t border-white/10 pt-8">
              <div>
                <div className="text-xs tracking-[0.3em] uppercase text-white/40 mb-2">Based In</div>
                <div className="font-medium">Damariscotta, ME</div>
              </div>
              <div>
                <div className="text-xs tracking-[0.3em] uppercase text-white/40 mb-2">Service Area</div>
                <div className="font-medium">Lincoln & Knox Counties</div>
              </div>
              <div>
                <div className="text-xs tracking-[0.3em] uppercase text-white/40 mb-2">Crew Size</div>
                <div className="font-medium">4 lead carpenters</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="bg-[#221c16] border-y border-white/10 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-[11px] tracking-[0.4em] uppercase text-[#e89668] mb-6 text-center">From a Recent Owner</div>
          <blockquote className="text-2xl md:text-3xl leading-relaxed font-serif italic text-[#f3d9b8] text-center">
            "Tom gave us a number on a Tuesday and stuck to it. The house finished a week early. After dealing with two other contractors before him, I almost didn't believe it was possible."
          </blockquote>
          <div className="text-center mt-8 text-white/55 text-sm tracking-wide">
            — Sarah & Mike Holloway · Pemaquid Point Residence
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-24">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <div className="text-[11px] tracking-[0.4em] uppercase text-[#e89668] mb-3">Start a Project</div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
              Tell us about<br />
              <span className="font-serif italic font-normal text-[#f3d9b8]">your project.</span>
            </h2>
            <p className="text-white/70 leading-relaxed mb-10">
              Fill out the form or give us a call. We'll set up a no-charge site walk within two weeks and follow up with a written estimate.
            </p>
            <div className="space-y-5 text-sm">
              <a href="tel:+12075551234" className="flex items-center gap-4 text-white/85 hover:text-white">
                <Phone className="w-5 h-5 text-[#e89668]" />
                <span>(207) 555-1234</span>
              </a>
              <a href="mailto:tom@damariscottabuilders.com" className="flex items-center gap-4 text-white/85 hover:text-white">
                <Mail className="w-5 h-5 text-[#e89668]" />
                <span>tom@damariscottabuilders.com</span>
              </a>
              <div className="flex items-center gap-4 text-white/85">
                <MapPin className="w-5 h-5 text-[#e89668]" />
                <span>22 Main Street, Damariscotta, ME 04543</span>
              </div>
              <div className="flex items-center gap-4 text-white/85">
                <Calendar className="w-5 h-5 text-[#e89668]" />
                <span>Mon — Fri · 7am — 4pm</span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-7">
            <form className="bg-[#221c16] rounded-2xl p-6 border border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input className="bg-[#1a1612] rounded-lg px-5 py-4 text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#e89668]/40 border border-white/5" placeholder="First name" />
              <input className="bg-[#1a1612] rounded-lg px-5 py-4 text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#e89668]/40 border border-white/5" placeholder="Last name" />
              <input className="bg-[#1a1612] rounded-lg px-5 py-4 text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#e89668]/40 border border-white/5" placeholder="Email" type="email" />
              <input className="bg-[#1a1612] rounded-lg px-5 py-4 text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#e89668]/40 border border-white/5" placeholder="Phone" type="tel" />
              <select className="sm:col-span-2 bg-[#1a1612] rounded-lg px-5 py-4 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-[#e89668]/40 border border-white/5">
                <option>Project type — select one</option>
                <option>New custom home</option>
                <option>Full renovation / restoration</option>
                <option>Addition</option>
                <option>Kitchen or bath</option>
                <option>Other</option>
              </select>
              <textarea rows={5} className="sm:col-span-2 bg-[#1a1612] rounded-lg px-5 py-4 text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#e89668]/40 border border-white/5 resize-none" placeholder="Tell us about the project — location, scope, timeline, anything else we should know." />
              <button type="button" className="sm:col-span-2 bg-[#d96a3a] hover:bg-[#c25a2c] text-[#1a1612] py-4 rounded-full text-sm font-semibold tracking-wide transition-colors">
                Send Project Details →
              </button>
            </form>
            <img
              src={contractorPlans}
              alt="Floor plans on a workbench"
              loading="lazy"
              className="mt-6 w-full aspect-[3/1] object-cover opacity-80 rounded-2xl"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4 text-xs text-white/45 tracking-wide uppercase">
          <div>Damariscotta Custom Builders · Est. 1998</div>
          <div>Licensed & Insured · ME #BLD-0421</div>
          <Link to="/" className="hover:text-white">Demo by Pleasant Cove Design</Link>
        </div>
      </footer>
    </div>
  );
};

export default ContractorDemo;
