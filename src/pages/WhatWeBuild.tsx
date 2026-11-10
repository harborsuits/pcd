import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarCheck, FolderOpen, Phone, Workflow, Globe, ShieldCheck, Wrench, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { PROJECT_OFFERINGS, CARE_PLANS, OWN_PLATFORM_NOTE, ALACARTE_SERVICES, ALACARTE_NOTE, AI_TIERS } from "@/lib/pricingMenu";

const smallerJobs = ["content_refresh", "website_cleanup", "booking_integration", "forms_routing"].flatMap(id => {
  const service = ALACARTE_SERVICES.find(item => item.id === id);
  return service ? [service] : [];
});
const tools = [
  { icon: CalendarCheck, title: "Booking & intake", from: "Choose a time", to: "Share the details", description: "Connect an existing scheduler and collect the information you need before an appointment." },
  { icon: Phone, title: "AI call answering", from: "Incoming call", to: "Agreed next step", description: "Define answers to common questions and how calls or requests should be handed to you." },
  { icon: FolderOpen, title: "Client portals", from: "Share a file", to: "Review together", description: "A private place for clients to exchange messages, files, and project approvals." },
  { icon: Workflow, title: "Automation & connections", from: "New inquiry", to: "Your existing tools", description: "Connect a defined customer action to your calendar, records, or an internal notification." },
];
const focusLink = "inline-flex items-center gap-2 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4";

const WhatWeBuild = () => (
  <div className="pcd-shell min-h-screen flex flex-col bg-page-bg text-foreground">
    <SEOHead
      title="Website Services | Pleasant Cove Design"
      description="Website builds, focused improvements, ongoing care, and optional connected tools for small businesses in Midcoast Maine. Explore scope and starting prices."
      path="/what-we-build"
      breadcrumbs={[{ name: "Home", path: "/" }, { name: "What We Build", path: "/what-we-build" }]}
    />
    <MarketingHeader activePage="what-we-build" />
    <main className="flex-1">
      <section className="px-5 sm:px-6 py-10 md:py-16">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm font-semibold mb-4">Pleasant Cove Design / Services</p>
          <h1 data-speakable className="font-serif font-bold text-3xl md:text-5xl leading-tight">A website that fits your business.</h1>
          <p data-speakable className="text-base md:text-lg leading-relaxed mt-6 max-w-xl mx-auto">New websites, focused improvements, and ongoing care for small businesses in Midcoast Maine. Start with what you need; agree on the work and price before we begin.</p>
          <Button asChild size="lg" className="mt-7"><Link to="/get-demo">Discuss your project <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link></Button>
          <p className="mt-5 text-sm"><Link to="/#work" className={focusLink}>See recent client work <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link></p>
        </div>
      </section>

      <section className="border-t border-border bg-background py-10 md:py-12">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <p className="text-sm font-semibold mb-3">Three ways to start</p>
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-8">Find the right starting point.</h2>
          <article className="grid md:grid-cols-[3rem_1fr_20rem] gap-4 md:gap-7 py-7 border-t border-border">
            <span className="font-serif text-2xl text-primary" aria-hidden="true">01</span>
            <div><Globe className="h-5 w-5 text-primary mb-3" aria-hidden="true" /><h3 className="font-serif text-2xl font-bold mb-3">Build a website</h3><p className="leading-relaxed max-w-xl">A straightforward first website or a tailored home for your services, work, and customer inquiries.</p></div>
            <div className="space-y-5">{PROJECT_OFFERINGS.slice(0, 2).map(offer => <div key={offer.id}><p className="font-semibold">{offer.label}</p><p className="font-serif text-xl font-bold mt-1">{offer.price}</p><p className="text-sm leading-relaxed mt-2">{offer.scopeNote}</p></div>)}<Button asChild variant="outline" className="w-full justify-between"><Link to="/get-demo?service=website">Discuss a website <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></Button></div>
          </article>
          <article className="grid md:grid-cols-[3rem_1fr_20rem] gap-4 md:gap-7 py-7 border-t border-border">
            <span className="font-serif text-2xl text-primary" aria-hidden="true">02</span>
            <div><Wrench className="h-5 w-5 text-primary mb-3" aria-hidden="true" /><h3 className="font-serif text-2xl font-bold mb-3">Improve an existing site</h3><p className="leading-relaxed max-w-xl">Keep what works and address what needs attention: content, mobile layouts, broken links, contact forms, or booking connections.</p></div>
            <div><p className="font-semibold mb-3">Focused work, agreed scope</p><p className="text-sm leading-relaxed mb-5">Start with the issue you want solved. I’ll review your website and confirm the work and price before you commit.</p><Button asChild variant="outline" className="w-full justify-between"><Link to="/get-demo?service=existing">Discuss an improvement <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></Button></div>
          </article>
          <article className="grid md:grid-cols-[3rem_1fr_20rem] gap-4 md:gap-7 py-7 border-t border-border">
            <span className="font-serif text-2xl text-primary" aria-hidden="true">03</span>
            <div><ShieldCheck className="h-5 w-5 text-primary mb-3" aria-hidden="true" /><h3 className="font-serif text-2xl font-bold mb-3">Ongoing website care</h3><p className="leading-relaxed max-w-xl">Keep your website hosted, checked, and up to date, with minor monthly updates if you need them.</p><p className="text-sm leading-relaxed mt-4">{OWN_PLATFORM_NOTE}</p></div>
            <div className="space-y-5">{CARE_PLANS.map(plan => <div key={plan.id}><p className="font-semibold">{plan.label}</p><p className="font-serif text-xl font-bold mt-1">{plan.price}</p><p className="text-sm leading-relaxed mt-2">{plan.description}</p></div>)}<Button asChild variant="outline" className="w-full justify-between"><Link to="/get-demo?product=care_plan&tier=care_website">Discuss website care <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></Button></div>
          </article>
          <Link to="/pricing" className={`${focusLink} mt-4 font-semibold`}>All options, pricing & care terms <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
      </section>

      <section className="py-10 md:py-12 border-t border-border">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="max-w-2xl mb-7"><p className="text-sm font-semibold mb-3">Smaller jobs welcome</p><h2 className="font-serif text-2xl md:text-3xl font-bold">Not every change needs a new website.</h2></div>
          <div className="grid md:grid-cols-2 gap-x-10">{smallerJobs.map(service => <article key={service.id} className="py-5 border-t border-border"><div className="flex flex-col sm:flex-row sm:justify-between gap-2 mb-3"><h3 className="font-semibold text-lg">{service.label}</h3><p className="font-semibold shrink-0">{service.price}</p></div><p className="text-sm leading-relaxed">{service.description}</p></article>)}</div>
          <p className="text-sm leading-relaxed max-w-3xl mt-5">{ALACARTE_NOTE}</p>
          <Link to="/pricing" className={`${focusLink} mt-5 font-semibold`}>See full pricing & scope <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
      </section>

      <section className="bg-background border-t border-border py-10 md:py-12">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="max-w-2xl mb-8"><p className="text-sm font-semibold mb-3">Optional connected tools</p><h2 className="font-serif text-2xl md:text-3xl font-bold mb-4">Beyond the website, only where it helps.</h2><p className="leading-relaxed">These features are scoped for your business, not universally bundled into a website build. Implementation and ongoing management are quoted separately.</p></div>
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">{tools.map(tool => <article key={tool.title} className="border-t border-border pt-5"><tool.icon className="h-6 w-6 text-primary mb-4" aria-hidden="true" /><h3 className="font-serif text-xl font-bold mb-3">{tool.title}</h3><p className="text-sm leading-relaxed">{tool.description}</p><div className="flex items-center gap-3 mt-4 text-xs font-semibold"><span className="border-l-2 border-accent pl-2">{tool.from}</span><ArrowRight className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /><span>{tool.to}</span></div></article>)}</div>
          <div className="border-l-2 border-accent pl-5 mt-9 max-w-3xl"><p className="font-semibold mb-2 flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />AI: setup + management + measured usage</p><p className="text-sm leading-relaxed">{AI_TIERS[0]?.description} {AI_TIERS[0]?.scopeNote}</p></div>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground py-10 md:py-12">
        <div className="max-w-6xl mx-auto px-5 sm:px-6"><h2 className="font-serif text-2xl md:text-3xl font-bold mb-4">Start with a conversation.</h2><p className="text-base md:text-lg mb-7 max-w-xl">Tell me what your business needs, or ask for a free review of your existing website.</p><div className="flex flex-col sm:flex-row gap-3"><Button asChild size="lg" variant="secondary"><Link to="/get-demo">Discuss your project <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link></Button><Button asChild size="lg" variant="secondary"><Link to="/get-demo?service=review">Get a free website review</Link></Button></div></div>
      </section>
    </main>
    <MarketingFooter />
  </div>
);
export default WhatWeBuild;
