import { Link } from "react-router-dom";
import { ArrowRight, FileSearch, PenSquare, Accessibility, KeyRound, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { NAP } from "@/lib/localPages";
import pierWebsite from "@/assets/pier-1-website.jpg.asset.json";
import ravenWebsite from "@/assets/raven-rock-homepage.jpg.asset.json";

const INQUIRY = "/get-demo?service=website&audience=organization";
const focusLink = "inline-flex items-center gap-2 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4";

const capabilities = [
  { icon: FileSearch, title: "Records people can find", example: "A resident finds the latest planning board packet by date, on a phone.", text: "Meeting minutes, agendas, packets, and forms organized into a clear, searchable archive, with older documents moved over and categorized." },
  { icon: PenSquare, title: "Publishing your staff can manage", example: "A clerk posts a public notice and attaches the agenda without editing the page layout.", text: "Editors update announcements, documents, and pages through a straightforward workflow, with roles for multiple staff members." },
  { icon: Accessibility, title: "Accessibility built into the project", example: "Pages and workflows checked against WCAG 2.1 AA before launch.", text: "We design and test the pages and workflows in your project against WCAG 2.1 AA. During discovery, we identify which existing PDFs and third-party tools need attention." },
  { icon: KeyRound, title: "A clear handoff", example: "Your team holds the accounts and knows how to use them.", text: "Account access, staff training, written documentation, and clearly defined hosting and support." },
];

const steps = [
  ["Discovery & content review", "We catalog your existing pages, documents, and staff workflows, and decide what stays, what's combined, and what's archived."],
  ["Structure & sample workflows", "We map how visitors find information and how staff publish it before building."],
  ["Migration & testing", "Content and documents are moved over and the agreed pages are tested for accessibility."],
  ["Training & launch", "Hands-on training for your editors, documentation, and ongoing support after launch."],
];

const work = [
  { name: "Raven Rock Construction", href: "https://www.ravenrockconstruction.com/", image: ravenWebsite.url, alt: "The live Raven Rock Construction homepage", role: "Redesigned and managed by Pleasant Cove Design.", text: "Dedicated service pages, project galleries, and quote intake that give visitors a clear next step." },
  { name: "Pier 1 Pizza", href: "https://pier1pizza207.com/", image: pierWebsite.url, alt: "The live Pier 1 Pizza homepage", role: "Website build and ongoing hosting by Pleasant Cove Design.", text: "A restaurant website with menu and online ordering links, events, and visitor information." },
];

const Organizations = () => (
  <div className="pcd-shell min-h-screen flex flex-col bg-page-bg text-foreground">
    <SEOHead
      title="Websites for Towns & Organizations | Pleasant Cove Design"
      description="Website builds and rebuilds for Maine towns, nonprofits, and multi-service organizations: document archives, staff publishing, and WCAG 2.1 AA testing."
      path="/organizations"
      breadcrumbs={[{ name: "Home", path: "/" }, { name: "Organizations", path: "/organizations" }]}
    />
    <MarketingHeader activePage="organizations" />
    <main className="flex-1">
      <section className="px-5 sm:px-6 py-10 md:py-16">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm font-semibold mb-4">Towns · Nonprofits · Multi-service organizations</p>
          <h1 className="font-serif font-bold text-3xl md:text-5xl leading-tight">Websites your community can use and your staff can manage.</h1>
          <p className="text-base md:text-lg leading-relaxed mt-6 max-w-2xl mx-auto">Pleasant Cove Design builds and rebuilds websites for towns, nonprofits, and multi-service organizations. We make it easier for people to find information and for your team to publish updates, manage documents, and keep the site current.</p>
          <Button asChild size="lg" className="mt-7"><Link to={INQUIRY}>Discuss a website project <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link></Button>
          <p className="mt-5 text-sm"><a href="#work" className={focusLink}>See our client work <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></a></p>
        </div>
      </section>

      <section id="work" className="border-t border-border bg-background py-10 md:py-12 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <p className="text-sm font-semibold mb-3">Live client work</p>
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-8">How we organize a multi-service website.</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {work.map(p => (
              <article key={p.name} className="pcd-soft-card rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
                <a href={p.href} target="_blank" rel="noopener noreferrer" className="block aspect-[16/10] overflow-hidden bg-muted">
                  <img src={p.image} alt={p.alt} loading="lazy" className="w-full h-full object-cover object-top" />
                </a>
                <div className="p-6 flex flex-col gap-3 flex-1">
                  <h3 className="font-serif text-xl font-bold">{p.name}</h3>
                  <p className="text-sm font-semibold">{p.role}</p>
                  <p className="leading-relaxed">{p.text}</p>
                  <a href={p.href} target="_blank" rel="noopener noreferrer" className={`${focusLink} text-sm mt-auto pt-2`}>Visit the live site <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border py-10 md:py-12">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <p className="text-sm font-semibold mb-3">For larger organizations</p>
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-3">More pages, more editors, years of documents.</h2>
          <p className="leading-relaxed max-w-2xl mb-8">The same approach scales to sites with hundreds of pages, several staff editors, and records that need to move.</p>
          <div className="grid sm:grid-cols-2 gap-6">
            {capabilities.map(c => (
              <article key={c.title} className="pcd-soft-card rounded-2xl border border-border bg-card p-6">
                <c.icon className="h-5 w-5 text-primary mb-3" aria-hidden="true" />
                <h3 className="font-serif text-xl font-bold mb-2">{c.title}</h3>
                <p className="text-sm italic text-muted-foreground mb-3">{c.example}</p>
                <p className="leading-relaxed">{c.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-background py-10 md:py-12">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <p className="text-sm font-semibold mb-3">How we work</p>
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-6">A clear process from first review to launch.</h2>
          <ol>
            {steps.map(([title, text], i) => (
              <li key={title} className="grid md:grid-cols-[3rem_16rem_1fr] gap-2 md:gap-7 py-5 border-t border-border">
                <span className="font-serif text-2xl text-primary" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-serif text-lg font-bold">{title}</h3>
                <p className="leading-relaxed">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-border py-10 md:py-14 px-5 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-bold">Have an upcoming RFP or website transition?</h2>
          <p className="leading-relaxed mt-4">Tell us about your organization and what the site needs to do. Include your RFP link or deadline if you have one; scope and pricing are set out in each proposal.</p>
          <Button asChild size="lg" className="mt-6"><Link to={INQUIRY}>Discuss a website project <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link></Button>
          <p className="mt-5 text-sm">Or reach Ben directly: <a href={`tel:${NAP.phoneE164}`} className="underline underline-offset-4">{NAP.phone}</a> · <a href={`mailto:${NAP.email}`} className="underline underline-offset-4 [overflow-wrap:anywhere]">{NAP.email}</a></p>
        </div>
      </section>
    </main>
    <MarketingFooter />
  </div>
);

export default Organizations;
