import { Link } from "react-router-dom";
import { Search, MapPin, LineChart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { MARKETING_ADS } from "@/lib/pricingMenu";

const CTA_HREF = "/get-demo?service=marketing";

const scope = [
  { icon: Search, title: "Google Search Ads", body: "Campaign planning, setup, and ongoing management. Ads are built around the services you most want to sell and the towns you actually serve, with keyword targeting, regular search term review, and negative keywords to cut wasted clicks." },
  { icon: MapPin, title: "Getting found locally", body: "Google Business Profile setup and cleanup, plus on-site local SEO: clear service pages, accurate business details, and page titles that match what local customers search for." },
  { icon: LineChart, title: "Tracking and reporting", body: "Google Analytics 4 with call and form conversion tracking where your setup supports it, so you can see which actions came from ads. Reports are written in plain English, not dashboards full of jargon." },
];

const steps = [
  { title: "Start with your priorities", body: "Tell us which services matter most, where your customers are, and what you’re comfortable spending each month. That shapes everything else." },
  { title: "Fix the landing spot", body: "Ads only help if the page they lead to makes it easy to call or ask for a quote. We review the landing page and forms and fix what gets in the way." },
  { title: "Launch, review, adjust", body: "Once the campaign is running, we review search terms, tracked calls and form requests, and adjust targeting and budget with you." },
];

const faq = [
  { question: "Can you run Google Ads if I already have a website?", answer: "Yes. We review the pages your ads would send people to and recommend focused fixes to the landing page or forms where they would help. A new website is not required." },
  { question: "How do ad spend and management fees work?", answer: "They are separate. Ad spend is paid to Google directly from your own account. Campaign management is scoped by proposal, and both are agreed in writing before anything goes live." },
  { question: "Which actions are tracked?", answer: "Where your setup supports it, we track phone calls and form or quote requests using Google Analytics 4 and Google Ads conversion tracking, so reports show which actions came from your campaigns." },
];

const MarketingAndAds = () => (
  <div className="pcd-shell min-h-screen flex flex-col bg-page-bg text-foreground">
    <SEOHead
      title="Marketing & Google Ads for Maine Small Businesses"
      description="Google Search Ads, local SEO, and call and form tracking for Maine small businesses. Planned around your services, service area, and budget, scoped by proposal."
      path="/marketing-and-ads"
      faq={faq}
      service={{ slug: "marketing-and-ads", name: MARKETING_ADS.label, description: MARKETING_ADS.description, serviceType: "Search engine marketing", areaServed: ["Maine"] }}
      breadcrumbs={[{ name: "Home", path: "/" }, { name: "Marketing & Ads", path: "/marketing-and-ads" }]}
    />
    <MarketingHeader activePage="marketing-and-ads" />
    <main className="flex-1">
      <section className="px-5 sm:px-6 py-10 md:py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 data-speakable className="font-serif text-3xl md:text-5xl font-bold leading-tight">
            Marketing & Google Ads for Maine small businesses
          </h1>
          <p data-speakable className="text-base md:text-lg text-muted-foreground leading-relaxed mt-6 max-w-2xl mx-auto">
            Get found by people searching nearby, and get more of the right calls and quote requests. We start with
            your priority services, your service area, and your budget.
          </p>
          <Button asChild size="lg" className="mt-7">
            <Link to={CTA_HREF}>
              Discuss a campaign <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="border-t border-border bg-background py-10 md:py-12">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-8">What’s included.</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {scope.map((item) => (
              <article key={item.title} className="bg-card border border-border rounded-lg p-6">
                <item.icon className="h-6 w-6 text-accent mb-4" aria-hidden="true" />
                <h3 className="font-serif text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.body}</p>
              </article>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-6 max-w-3xl">
            Need a better page for ads to land on?{" "}
            <Link to="/what-we-build" className="underline underline-offset-4">
              See website builds and focused improvements.
            </Link>{" "}
            Want to see the kind of sites we build?{" "}
            <Link to="/#work" className="underline underline-offset-4">
              View recent client website work.
            </Link>
          </p>
        </div>
      </section>

      <section className="border-t border-border py-10 md:py-12">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-8">How a campaign comes together.</h2>
          <ol className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <li key={step.title} className="border-t-2 border-accent pt-5">
                <h3 className="font-serif text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-border bg-background py-10 md:py-12">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4">Campaign pricing.</h2>
          <p className="text-muted-foreground leading-relaxed max-w-3xl">
            {MARKETING_ADS.price}. {MARKETING_ADS.scopeNote}
          </p>
          <p className="text-sm text-muted-foreground mt-5">
            Serving businesses across{" "}
            <Link to="/midcoast-maine" className="underline underline-offset-4">
              Midcoast Maine and the rest of the state
            </Link>
            .{" "}
            <Link to="/pricing" className="underline underline-offset-4">
              See website pricing and care plans.
            </Link>
          </p>
        </div>
      </section>

      <section className="border-t border-border py-10 md:py-12">
        <div className="max-w-3xl mx-auto px-5 sm:px-6">
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-6">Common questions</h2>
          <dl className="space-y-6">
            {faq.map((item) => (
              <div key={item.question}>
                <dt className="font-semibold mb-2">{item.question}</dt>
                <dd className="text-muted-foreground leading-relaxed">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground py-10 md:py-12">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4">Start with what you want more of.</h2>
          <p className="text-base md:text-lg mb-7">
            Tell Ben which services you want more calls for, where you work, and your rough monthly budget. We’ll
            explain the scope and fees before you commit.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link to={CTA_HREF}>
              Discuss a campaign <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
    <MarketingFooter />
  </div>
);
export default MarketingAndAds;
