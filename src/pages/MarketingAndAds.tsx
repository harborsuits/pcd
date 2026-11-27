import { Link } from "react-router-dom";
import { Search, Images, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { MARKETING_ADS } from "@/lib/pricingMenu";

const CTA_HREF = "/get-demo?service=marketing";

const channels = [
  {
    icon: Search,
    title: "Google Search Ads",
    body: "Reach people actively looking for a specific service nearby. For example, a homeowner might search for “chimney repair near me” or “deck builder in Damariscotta.” We plan around relevant search terms and the towns you serve.",
    scope: "We handle campaign planning, keyword and location targeting, ad copy, setup and ongoing management. Regular search term review and negative keywords help keep targeting relevant, with improvements as the campaign runs.",
  },
  {
    icon: Images,
    title: "Facebook & Instagram Ads",
    body: "Get in front of local people with a project photo, seasonal offer or event. For example, a deck builder could show a completed project to nearby homeowners. Campaigns can focus on awareness or inquiries through a lead form or your website.",
    scope: "We handle campaign planning, audience and location targeting, ad copy, preparing ads from your available photos or graphics, setup and ongoing management. We review the response and make improvements as the campaign runs.",
  },
];

const support = [
  { title: "Local visibility", body: "Google Business Profile setup and cleanup, plus local search visibility through clear service pages and accurate business details." },
  { title: "Landing pages and forms", body: "Focused improvements to the pages and forms your ads lead to, so people can call or request a quote." },
  { title: "Conversion tracking", body: "Tracking for calls, forms and quote requests where your website and chosen platform support it." },
  { title: "Plain-English reporting", body: "Clear reporting on ad spend, calls and quote requests, including what can be attributed to campaigns where tracking supports it." },
];

const steps = [
  { title: "Choose the right starting point", body: "Tell us what you want to promote, where you serve and your monthly budget. We recommend Google Search or Facebook and Instagram based on those goals, then put the scope and fees in writing." },
  { title: "Prepare the campaign", body: "We plan targeting, write the ads and prepare any social ads from available photos or graphics. We review the landing page or lead form and agree any focused improvements and supported tracking." },
  { title: "Launch, review, adjust", body: "Once the agreed campaign is running, we review search terms or audience response, spend and tracked inquiries. We improve ads and targeting and discuss budget adjustments with you." },
];

const faq = [
  { question: "Should we start with Google Search or Facebook and Instagram?", answer: "Google Search is a useful starting point when people already search for your service nearby. Facebook and Instagram can put a project photo, seasonal offer or event in front of local audiences, for awareness or inquiries. We choose a starting channel around your goals, budget and service area; a new business does not need to start with both." },
  { question: "Can we use our existing website?", answer: "Yes. A new website is not required. We review the pages your ads would send people to and recommend focused landing page or form improvements where useful. Facebook and Instagram campaigns can also use a platform lead form when that fits your goals." },
  { question: "How do management fees and ad spend work?", answer: "They are separate. Campaign management is priced by proposal. Ad spend is paid to the applicable platform through your own ad account. We agree the scope, management fees and ad budget in writing before anything goes live." },
];

const MarketingAndAds = () => (
  <div className="pcd-shell min-h-screen flex flex-col bg-page-bg text-foreground">
    <SEOHead
      title="Google & Social Media Ads in Maine | Pleasant Cove Design"
      description="Google Search, Facebook and Instagram ads for Maine small businesses. Campaign planning and management, with fees by proposal and ad spend separate."
      path="/marketing-and-ads"
      faq={faq}
      service={{ slug: "marketing-and-ads", name: MARKETING_ADS.label, description: MARKETING_ADS.description, serviceType: "Search and social media advertising", areaServed: ["Maine"] }}
      breadcrumbs={[{ name: "Home", path: "/" }, { name: "Marketing & Ads", path: "/marketing-and-ads" }]}
    />
    <MarketingHeader activePage="marketing-and-ads" />
    <main className="flex-1">
      <section className="px-5 sm:px-6 py-10 md:py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 data-speakable className="font-serif text-3xl md:text-5xl font-bold leading-tight">
            Marketing & advertising for Maine small businesses
          </h1>
          <p data-speakable className="text-base md:text-lg text-muted-foreground leading-relaxed mt-6 max-w-2xl mx-auto">
            Pleasant Cove Design plans and manages Google Search, Facebook and Instagram ads. We start with
            what you want to promote, your service area and your budget.
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
          <div className="grid md:grid-cols-2 gap-6">
            {channels.map((item) => (
              <article key={item.title} className="bg-card border border-border rounded-lg p-6">
                <item.icon className="h-6 w-6 text-accent mb-4" aria-hidden="true" />
                <h2 className="font-serif text-xl font-bold mb-3">{item.title}</h2>
                <p className="text-muted-foreground leading-relaxed">{item.body}</p>
                <p className="text-muted-foreground leading-relaxed mt-4">{item.scope}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 border-t border-border pt-6">
            <h2 className="font-serif text-2xl font-bold mb-5">What we handle</h2>
            <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
              {support.map((item) => (
                <div key={item.title}>
                  <dt className="font-semibold mb-1">{item.title}</dt>
                  <dd className="text-muted-foreground leading-relaxed">{item.body}</dd>
                </div>
              ))}
            </dl>
            <p className="text-muted-foreground leading-relaxed mt-5">
              A new business can start with one channel based on its goals, budget and service area.
            </p>
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
            Tell Ben what you want to promote, where you serve and your rough monthly budget. We’ll
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
