import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Globe, Wrench, ShieldCheck, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/ui/footer";
import { SEOHead } from "@/components/SEOHead";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { NAP } from "@/lib/localPages";
import { PROJECT_OFFERINGS, CARE_PLANS, ALACARTE_SERVICES, ALACARTE_NOTE } from "@/lib/pricingMenu";
import pcdLogo from "@/assets/pcd-logo.jpeg";
import pierWebsite from "@/assets/pier-1-website.jpg.asset.json";
import ravenWebsite from "@/assets/raven-rock-homepage.jpg.asset.json";
import roofer from "@/assets/demos/roofer-hero.jpeg";
import restaurant from "@/assets/restaurant/lobster-thermidor-hero.webp";
import salon from "@/assets/salon/salon-hero-model.png";
import gallery from "@/assets/gallery/harbor-quiet.jpg";
import boutique from "@/assets/boutique/store-interior.jpg";

const smallerJobIds = ["content_refresh", "website_cleanup", "booking_integration", "forms_routing"];
const smallerJobs = smallerJobIds.flatMap(id => {
  const service = ALACARTE_SERVICES.find(item => item.id === id);
  return service ? [service] : [];
});
const concepts = [
  { name: "Roofer", image: roofer, path: "/demos/roofer" },
  { name: "Restaurant", image: restaurant, path: "/demos/restaurant" },
  { name: "Salon", image: salon, path: "/demos/salon" },
  { name: "Gallery", image: gallery, path: "/demos/gallery" },
  { name: "Boutique", image: boutique, path: "/demos/boutique" },
];

const Index = () => (
  <div className="homepage min-h-screen flex flex-col bg-page-bg text-foreground">
      <SEOHead
        title="Small Business Web Design & Website Fixes | Pleasant Cove Design"
        description="We fix outdated websites, broken contact forms, and weak mobile layouts so small businesses stop losing customers. Free website review. Midcoast Maine."
        path="/"
        localBusiness
        faq={[
          {
            question: "What does Pleasant Cove Design do?",
            answer:
              "Pleasant Cove Design is a Midcoast Maine web design studio that fixes small-business websites which are quietly losing customers — outdated design, broken contact forms, weak mobile layouts, and missing booking flows. Most projects start with a free website review that names the specific issues to fix.",
          },
          {
            question: "Where are you based and who do you work with?",
            answer:
              "Pleasant Cove Design is based in Midcoast Maine and works primarily with owner-operated small businesses in Newcastle, Damariscotta, Wiscasset, Boothbay Harbor, Camden, Rockland, Brunswick, and Bath. We also take on remote clients across the United States.",
          },
          {
            question: "How does pricing work?",
            answer:
              "Pricing is two parts: a one-time build fee to design and launch the site, then a month-to-month website care plan from $150 for hosting, maintenance, backups, and small content changes. A simple one-page online brochure starts at $1,500 and a custom business website starts at $3,500, with the final price set in a written proposal. AI receptionist services are billed as setup, monthly management, and actual usage. Most clients begin with a free website review before committing.",
          },
          {
            question: "How long does a website take?",
            answer:
              "Most small-business websites launch in two to four weeks once content and photos are in hand. Single-page sites and targeted fixes — like a broken contact form or a mobile layout repair — can ship in a few days.",
          },
          {
            question: "Do you offer an AI receptionist or online booking?",
            answer:
              "Yes. Pleasant Cove Design can add a 24/7 AI receptionist that answers calls and texts, captures lead details, and emails you a clean summary, plus online booking that syncs with Google Calendar, Calendly, or Acuity.",
          },
        ]}
      />
    <MarketingHeader activePage="home" />
    <main className="flex-1">
      <section className="px-6 pt-10 pb-12 md:pt-16 md:pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold text-accent mb-5">Websites for Midcoast Maine small businesses</p>
          <h1 data-speakable className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            A better website.<br className="hidden sm:block" /> One less thing to manage.
          </h1>
          <p data-speakable className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mt-6">
            I build, improve, and maintain websites for Maine small businesses. A new site, a focused fix, or someone to keep it running.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 mt-8">
            <Button asChild size="lg"><a href="#work">See Our Work <ArrowRight className="ml-2 h-4 w-4" /></a></Button>
            <Button asChild size="lg" variant="outline"><Link to="/get-demo?service=review">Get a Free Website Review</Link></Button>
          </div>
          <p className="text-sm text-muted-foreground mt-5">Have a quick question? <a className="underline underline-offset-4 hover:text-foreground" href={`tel:${NAP.phoneE164}`}>{NAP.phone}</a></p>
        </div>
      </section>

      <section className="py-12 md:py-16 border-t border-border">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-sm text-accent font-semibold mb-3">Start where you are</p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-8">What does your website need?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <article className="border border-border bg-card rounded-lg p-6 flex flex-col">
              <Globe className="h-6 w-6 text-accent mb-5" aria-hidden="true" />
              <h3 className="font-serif text-2xl font-bold mb-3">Build a website</h3>
              <p className="text-muted-foreground leading-relaxed mb-5">A professional first website or a more complete home for your business.</p>
              <div className="space-y-4 mb-6">{PROJECT_OFFERINGS.slice(0, 2).map(offer => <div key={offer.id}><p className="font-semibold">{offer.label} · {offer.price}</p><p className="text-sm text-muted-foreground mt-1 leading-relaxed">{offer.scopeNote}</p></div>)}</div>
              <Button asChild variant="outline" className="mt-auto justify-between"><Link to="/get-demo?service=website">Discuss a new website <ArrowRight className="h-4 w-4" /></Link></Button>
            </article>
            <article className="border border-border bg-card rounded-lg p-6 flex flex-col">
              <Wrench className="h-6 w-6 text-accent mb-5" aria-hidden="true" />
              <h3 className="font-serif text-2xl font-bold mb-3">Improve an existing site</h3>
              <p className="text-muted-foreground leading-relaxed mb-5">Keep what works. Fix what doesn’t. Content updates, contact forms, booking connections, and mobile layout improvements.</p>
              <p className="font-semibold mb-2">Focused work, agreed scope</p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">Start with the issue you want solved. I’ll review the site and confirm the work and price before you commit.</p>
              <Button asChild variant="outline" className="mt-auto justify-between"><Link to="/get-demo?service=existing">Discuss an improvement <ArrowRight className="h-4 w-4" /></Link></Button>
            </article>
            <article className="border border-border bg-card rounded-lg p-6 flex flex-col">
              <ShieldCheck className="h-6 w-6 text-accent mb-5" aria-hidden="true" />
              <h3 className="font-serif text-2xl font-bold mb-3">Ongoing website care</h3>
              <p className="text-muted-foreground leading-relaxed mb-5">Hosting, maintenance, backups, and a reliable place to turn when your website needs attention.</p>
              <div className="space-y-4 mb-4">{CARE_PLANS.map(plan => <div key={plan.id}><p className="font-semibold">{plan.label} · {plan.price}</p><p className="text-sm text-muted-foreground mt-1">{plan.features.find(feature => feature.startsWith("Up to"))}</p></div>)}</div>
              <p className="text-sm text-muted-foreground mb-6">No editing-time rollover. Larger work is separately scoped; allowances and terms are set in your proposal.</p>
              <Button asChild variant="outline" className="mt-auto justify-between"><Link to="/get-demo?service=existing">Discuss website care <ArrowRight className="h-4 w-4" /></Link></Button>
            </article>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-background py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8"><div><p className="text-sm text-accent font-semibold mb-3">Smaller jobs welcome</p><h2 className="font-serif text-3xl md:text-4xl font-bold">You don’t always need a new website.</h2></div><Button asChild variant="ghost"><Link to="/pricing">Full pricing & scope <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">{smallerJobs.map(service => <article key={service.id} className="border border-border rounded-lg p-5 flex flex-col bg-card"><h3 className="font-semibold text-lg mb-2">{service.label}</h3><p className="font-serif text-2xl font-bold mb-4">{service.price}</p><p className="text-sm text-muted-foreground leading-relaxed mb-5">{service.description}</p><Button asChild variant="link" className="mt-auto self-start p-0 h-auto"><Link to="/pricing">View scope <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></article>)}</div>
          <p className="text-muted-foreground text-sm leading-relaxed mt-7 max-w-3xl">{ALACARTE_NOTE}</p>
        </div>
      </section>

      <section id="work" className="border-t border-border bg-background scroll-mt-28 py-10 md:py-12">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-sm text-accent font-semibold mb-2">Live client websites</p>
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-6">Recent work</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
            {[
              { name: "Pier 1 Pizza", image: pierWebsite.url, href: "https://pier1pizza207.com/", alt: "The live Pier 1 Pizza homepage", description: "A clear home for Pier 1’s menu, weekly events, and visitor information. Direct online-ordering links, contact details, and directions help guests find their next step." },
              { name: "Raven Rock Construction", image: ravenWebsite.url, href: "https://www.ravenrockconstruction.com/", alt: "The current live Raven Rock Construction homepage, showing Built strong. Built for Maine. and a stone-and-timber building", description: "A construction website with clear service pages, project photos, and a direct quote-inquiry path." },
            ].map(project => <article key={project.name} className="border border-border rounded-lg overflow-hidden bg-card flex flex-col">
              <a href={project.href} target="_blank" rel="noopener noreferrer" aria-label={`Visit the live ${project.name} website`} className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4">
                <img src={project.image} alt={project.alt} width="1440" height="810" loading="lazy" className="w-full aspect-video max-h-[180px] md:max-h-none object-cover object-top" />
              </a>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-serif text-xl font-bold mb-3">{project.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{project.description}</p>
                <Button asChild variant="link" className="mt-auto self-start p-0 h-auto"><a href={project.href} target="_blank" rel="noopener noreferrer">Visit live website <ArrowUpRight className="ml-2 h-4 w-4" /></a></Button>
              </div>
            </article>)}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 border-t border-border">
        <div className="max-w-6xl mx-auto px-6"><h2 className="font-serif text-3xl md:text-4xl font-bold mb-9">A straightforward way forward.</h2>
          <ol className="grid md:grid-cols-3 gap-8">{[
            { title: "Talk & review", description: "Tell me what you need, or start with a free website review. We’ll identify the right next step." },
            { title: "Agree on scope", description: "You receive a written proposal outlining the work, price, and payment terms. Projects begin with the existing deposit process once the scope is agreed." },
            { title: "Build, check & launch", description: "Review the work together, check the website on phones and desktop, and approve the launch." },
          ].map((step, i) => <li key={step.title} className="border-t border-border pt-5"><span className="text-accent font-semibold">0{i + 1}</span><h3 className="text-xl font-semibold mt-3 mb-3">{step.title}</h3><p className="text-muted-foreground leading-relaxed">{step.description}</p></li>)}</ol>
        </div>
      </section>

      <section className="border-t border-border bg-background py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-[1fr_2fr] gap-6 md:gap-16"><h2 className="font-serif text-3xl md:text-4xl font-bold">Meet Ben</h2><p className="text-xl md:text-2xl leading-relaxed">I’m Ben Dickinson, the person behind Pleasant Cove Design. I build, improve, and maintain websites for small businesses in Midcoast Maine.</p></div>
      </section>

      <section id="demos" className="border-t border-border py-10 scroll-mt-28">
        <div className="max-w-6xl mx-auto px-6">
          <details className="group"><summary className="cursor-pointer py-3 text-xl font-serif font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">Sample industry concepts</summary>
            <p className="text-sm text-muted-foreground mt-2 mb-6">Sample designs, not completed client projects. Explore an example for your industry.</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">{concepts.map(concept => <article key={concept.name} className="rounded-lg overflow-hidden border border-border bg-card"><img src={concept.image} alt={`${concept.name} sample concept imagery`} loading="lazy" width="400" height="300" className="aspect-[4/3] w-full object-cover" /><div className="p-3"><h3 className="font-semibold">{concept.name}</h3><Button asChild variant="link" className="p-0 h-auto mt-2 text-sm"><Link to={concept.path}>Explore sample <ArrowUpRight className="ml-1 h-3 w-3" /></Link></Button></div></article>)}</div>
          </details>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground border-t border-border py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-6 text-center"><h2 className="font-serif text-3xl md:text-4xl font-bold mb-5">What would make your website work better?</h2><p className="text-lg leading-relaxed mb-7">A new website, a small fix, or ongoing help. Tell me what’s on your mind.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3"><Button asChild size="lg" variant="secondary"><Link to="/get-demo">Discuss your project <ArrowRight className="ml-2 h-4 w-4" /></Link></Button><Button asChild size="lg" variant="secondary"><Link to="/get-demo?service=review">Get a Free Website Review</Link></Button></div>
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-7 mt-7 text-sm"><a href={`tel:${NAP.phoneE164}`} className="inline-flex items-center justify-center gap-2 underline underline-offset-4"><Phone className="h-4 w-4" />{NAP.phone}</a><a href={`mailto:${NAP.email}`} className="inline-flex items-center justify-center gap-2 underline underline-offset-4 break-all"><Mail className="h-4 w-4 shrink-0" />{NAP.email}</a></div>
        </div>
      </section>
      <section className="py-7 px-6 text-center"><p className="text-sm text-muted-foreground">Already a client? <Link to="/portal" className="underline underline-offset-4 hover:text-foreground">Open your client portal</Link></p></section>
    </main>
    <Footer logo={<img src={pcdLogo} alt="Pleasant Cove Design sailboat" className="h-12 w-12 rounded" />} brandName="Pleasant Cove Design" socialLinks={[]} mainLinks={[
      { href: "/what-we-build", label: "Services" }, { href: "/pricing", label: "Pricing" }, { href: "/portal", label: "Client Portal" }, { href: `mailto:${NAP.email}`, label: "Contact" }, { href: "/blog", label: "Blog" }, { href: "/ai-receptionist", label: "AI Receptionist" }, { href: "/operator", label: "Operator" },
    ]} legalLinks={[{ href: "/privacy", label: "Privacy" }, { href: "/terms", label: "Terms" }]} locationLinks={{ label: "Service Area", links: [{ href: "/midcoast-maine", label: "Midcoast Maine" }] }} copyright={{ text: `© ${new Date().getFullYear()} Pleasant Cove Design`, license: "All rights reserved" }} />
  </div>
);
export default Index;
