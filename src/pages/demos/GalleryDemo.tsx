import { GalleryHero } from "@/components/gallery/GalleryHero"
import { motion } from "framer-motion"
import { Palette, Brush, Droplets } from "lucide-react"
import DisplayCards from "@/components/ui/display-cards"
import harborQuietImage from "@/assets/gallery/harbor-quiet.jpg"
import saltMarshImage from "@/assets/gallery/salt-marsh-light.jpg"
import graniteTideImage from "@/assets/gallery/granite-tide.jpg"
import lighthouseImage from "@/assets/gallery/lighthouse-study.jpg"
import winterWharfImage from "@/assets/gallery/winter-wharf.jpg"

const galleryCards = [
  {
    title: "Fog & Pines",
    pseudonym: "E. Maris",
    tags: "Maine • Mist • Evergreens",
    image: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1600&q=80",
  },
  {
    title: "Harbor Quiet",
    pseudonym: "C. Thayer",
    tags: "Working Waterfront • Dawn • Still",
    image: harborQuietImage,
  },
  {
    title: "Salt Marsh Light",
    pseudonym: "N. Winslow",
    tags: "New England • Marsh • Golden Hour",
    image: saltMarshImage,
  },
  {
    title: "Granite & Tide",
    pseudonym: "S. Calder",
    tags: "Rocky Coast • Atlantic • Texture",
    image: graniteTideImage,
  },
  {
    title: "Lighthouse Study",
    pseudonym: "R. Aster",
    tags: "Beacon • Overcast • Coastal",
    image: lighthouseImage,
  },
  {
    title: "Winter Wharf",
    pseudonym: "J. Alder",
    tags: "Cold Harbor • Quiet • Blue Hour",
    image: winterWharfImage,
  },
];

const artistCards = [
  {
    icon: <Palette className="size-4" />,
    title: "Sarah Whitmore",
    description: "Oil on Canvas • Coastal Moods",
    date: "15 years experience",
    iconClassName: "text-amber-600 border-amber-200 bg-amber-50",
    titleClassName: "text-slate-900",
    className:
      "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-slate-200 before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-white/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
  },
  {
    icon: <Brush className="size-4" />,
    title: "Thomas Eldridge",
    description: "Watercolor • Working Waterfront",
    date: "3rd generation Mainer",
    iconClassName: "text-blue-600 border-blue-200 bg-blue-50",
    titleClassName: "text-slate-900",
    className:
      "[grid-area:stack] translate-x-12 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-slate-200 before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-white/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
  },
  {
    icon: <Droplets className="size-4" />,
    title: "Rebecca Marston",
    description: "Mixed Media • Fog & Light",
    date: "Award-winning artist",
    iconClassName: "text-teal-600 border-teal-200 bg-teal-50",
    titleClassName: "text-slate-900",
    className:
      "[grid-area:stack] translate-x-24 translate-y-20 hover:translate-y-10",
  },
];

export default function GalleryDemo() {
  return (
    <div className="bg-white">
      <GalleryHero />

      {/* Gallery Section */}
      <section id="gallery" className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="font-serif text-4xl font-light text-slate-900 sm:text-5xl">
              Featured Collections
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              A curated selection of original works celebrating Maine's rugged beauty and timeless spirit.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {galleryCards.map((card, i) => (
              <motion.div
                key={`${card.title}-${card.pseudonym}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-semibold text-slate-900">{card.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">by {card.pseudonym}</p>
                  <p className="mt-2 text-sm text-slate-400">{card.tags}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Artists Section */}
      <section id="artists" className="bg-slate-50 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="font-serif text-4xl font-light text-slate-900 sm:text-5xl">
              Featured Artists
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              Meet the talented creators whose work graces our walls.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 flex justify-center"
          >
            <DisplayCards cards={artistCards} />
          </motion.div>
        </div>
      </section>

      {/* Visit Section */}
      <section id="visit" className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-serif text-4xl font-light text-slate-900 sm:text-5xl">
                Visit Us
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                We're located in the heart of Boothbay Harbor, just steps from the waterfront.
              </p>

              <div className="mt-8 space-y-4 text-slate-700">
                <div>
                  <h4 className="font-medium text-slate-900">Hours</h4>
                  <p>Thursday – Sunday: 11am – 5pm</p>
                  <p>Monday – Wednesday: By appointment</p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">Address</h4>
                  <p>123 Harbor Street</p>
                  <p>Boothbay Harbor, ME 04538</p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">Contact</h4>
                  <p>Phone: (207) 555-1234</p>
                  <p>Email: hello@harborlight.gallery</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="aspect-video overflow-hidden rounded-2xl bg-slate-200"
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2900.5!2d-69.6285!3d43.8485!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDPCsDUwJzU0LjYiTiA2OcKwMzcnNDIuNiJX!5e0!3m2!1sen!2sus!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Gallery Location"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="bg-amber-50 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="font-serif text-4xl font-light text-slate-900 sm:text-5xl">
              Upcoming Events
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              Join us for openings, workshops, and community gatherings.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div className="text-sm font-medium text-amber-600">First Friday</div>
              <h3 className="mt-2 text-xl font-medium text-slate-900">January Art Walk</h3>
              <p className="mt-2 text-slate-600">
                Join us for extended hours, wine, and live music as we showcase new winter arrivals.
              </p>
              <p className="mt-4 text-sm text-slate-500">January 3, 2025 • 5–8pm</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div className="text-sm font-medium text-amber-600">Workshop</div>
              <h3 className="mt-2 text-xl font-medium text-slate-900">Watercolor Basics</h3>
              <p className="mt-2 text-slate-600">
                Learn foundational techniques with artist Thomas Eldridge. All materials provided.
              </p>
              <p className="mt-4 text-sm text-slate-500">January 11, 2025 • 10am–1pm</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div className="text-sm font-medium text-amber-600">Opening</div>
              <h3 className="mt-2 text-xl font-medium text-slate-900">Winter Solstice Show</h3>
              <p className="mt-2 text-slate-600">
                A special exhibition celebrating the beauty of Maine winters through local eyes.
              </p>
              <p className="mt-4 text-sm text-slate-500">January 18, 2025 • 4–7pm</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-4xl font-light text-slate-900 sm:text-5xl">
              Get in Touch
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Interested in a piece? Have questions? We'd love to hear from you.
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-12 space-y-6 text-left"
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-slate-700">
                Message
              </label>
              <textarea
                id="message"
                rows={4}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                placeholder="Tell us about your inquiry..."
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-slate-900 px-8 py-4 font-medium text-white transition hover:bg-slate-800"
            >
              Send Inquiry
            </button>
          </motion.form>

          <p className="mt-8 text-sm text-slate-500">
            (Demo) This form connects to the smart lead handling system.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-7xl text-center">
          <p className="font-serif text-xl text-slate-900">Harborlight Gallery</p>
          <p className="mt-2 text-sm text-slate-500">
            Boothbay Harbor, Maine • Coastal art for modern living
          </p>
          <p className="mt-6 text-xs text-slate-400">
            Demo site by Pleasant Cove Design
          </p>
        </div>
      </footer>
    </div>
  )
}
