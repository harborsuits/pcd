import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { MARKETING_ADS } from "@/lib/pricingMenu";
import additionPhoto from "@/assets/demos/contractor-addition.jpg";
import ravenWebsite from "@/assets/raven-rock-homepage.jpg.asset.json";

const CTA_HREF = "/get-demo?service=marketing";

const channels = [
  {
    title: "Google Search Ads",
    body: "Reach people already looking for your service.",
  },
  {
    title: "Facebook & Instagram Ads",
    body: "Put your work or a seasonal offer in front of nearby customers.",
  },
];

const faq = [
  {
    question: "Which channel should we start with?",
    answer: "Google Search reaches people looking for your service. Facebook and Instagram introduce your work to nearby customers. We recommend a starting channel around your goals and budget.",
  },
  {
    question: "Can we use our existing website?",
    answer: "Yes. We can improve the page or form your ads lead to; a new website is not required.",
  },
  {
    question: "How is ad spend paid?",
    answer: "You pay the platform directly through your own ad account. Management is by proposal; we agree scope, fees and budget in writing before launch.",
  },
];

const MarketingAndAds = () => (
  <div className="pcd-shell min-h-screen flex flex-col bg-page-bg text-foreground">
    <SEOHead
      title="Google & Social Media Ads in Maine | Pleasant Cove Design"
      description="Google Search, Facebook and Instagram ads for Maine small businesses. Campaign planning and management, with fees by proposal and ad spend separate."
      path="/marketing-and-ads"
      faq={faq}
      service={{
        slug: "marketing-and-ads",
        name: MARKETING_ADS.label,
        description: MARKETING_ADS.description,
        serviceType: "Search and social media advertising",
        areaServed: ["Maine"],
      }}
      breadcrumbs={[
        { name: "Home", path: "/" },
        { name: "Marketing & Ads", path: "/marketing-and-ads" },
      ]}
    />
    <MarketingHeader activePage="marketing-and-ads" />
    <main className="flex-1">
      <section className="px-5 sm:px-6 pt-8 pb-10 md:py-16">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <h1 data-speakable className="font-serif text-3xl md:text-5xl font-bold leading-tight max-w-md">
              Get more of the right calls.
            </h1>
            <p data-speakable className="text-lg text-muted-foreground leading-relaxed mt-5 max-w-sm">
              Google, Facebook and Instagram ads for Maine small businesses.
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link to={CTA_HREF}>
                Discuss a campaign <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <figure className="min-w-0">
            <img
              src={additionPhoto}
              alt="An illuminated glass-fronted home addition overlooking the water at dusk"
              width={1200}
              height={900}
              fetchPriority="high"
              loading="eager"
              className="w-full aspect-[4/3] object-cover"
            />
            <div className="bg-primary text-primary-foreground px-5 py-5 sm:px-6">
              <p className="font-serif text-xl sm:text-2xl font-bold leading-snug">More room. Same address.</p>
              <p className="text-sm mt-2">Home additions in Midcoast Maine.</p>
            </div>
            <figcaption className="text-sm text-muted-foreground mt-2">Sample social ad</figcaption>
          </figure>
        </div>
      </section>

      <section className="border-t border-border bg-background py-10 md:py-12">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <h2 className="font-serif text-2xl md:text-3xl font-bold">Where your ads run</h2>
          <div className="grid md:grid-cols-2 gap-6 md:gap-12 mt-7">
            {channels.map((channel) => (
              <div key={channel.title} className="border-t border-border pt-5">
                <h3 className="font-serif text-xl font-bold">{channel.title}</h3>
                <p className="text-muted-foreground leading-relaxed mt-3 max-w-md">{channel.body}</p>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground leading-relaxed mt-7 max-w-2xl">
            We write the ads, manage the campaign, and track calls and quote requests where supported.
          </p>
        </div>
      </section>

      <section className="border-t border-border py-10 md:py-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold leading-snug">Give people a clear path to a quote.</h2>
            <p className="text-muted-foreground leading-relaxed mt-4 max-w-md">
              We can improve your landing page, forms, and local SEO so people know what to do next.
            </p>
            <p className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground mt-5 leading-relaxed">
              <Link to="/what-we-build" className="underline underline-offset-4">Website services</Link>
              <Link to="/#work" className="underline underline-offset-4">Recent work</Link>
            </p>
          </div>
          <figure className="min-w-0">
            <img
              src={ravenWebsite.url}
              alt="Raven Rock Construction’s redesigned homepage with its Built strong. Built for Maine. headline and stone-and-timber building"
              width={1440}
              height={810}
              loading="lazy"
              className="w-full aspect-video object-cover object-top border border-border"
            />
            <figcaption className="text-sm text-muted-foreground mt-3 leading-relaxed">
              <a href="https://www.ravenrockconstruction.com/" target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-4">
                View Raven Rock’s website
              </a>
              <span className="block mt-1">Redesigned and managed by Pleasant Cove Design.</span>
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="border-t border-border bg-background py-10 md:py-12">
        <div className="max-w-3xl mx-auto px-5 sm:px-6">
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-6">Common questions</h2>
          <div className="border-t border-border">
            {faq.map((item) => (
              <details key={item.question} className="border-b border-border py-4">
                <summary className="cursor-pointer font-semibold leading-relaxed focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4">
                  {item.question}
                </summary>
                <p className="text-muted-foreground leading-relaxed mt-3">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground py-10 md:py-12">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <h2 className="font-serif text-2xl md:text-3xl font-bold">Plan your first campaign.</h2>
          <p className="text-base md:text-lg mt-4">You set the ad budget. We quote management separately.</p>
          <Button asChild size="lg" variant="secondary" className="mt-6">
            <Link to={CTA_HREF}>
              Discuss a campaign <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <p className="flex flex-wrap gap-x-5 gap-y-2 text-sm mt-6 leading-relaxed">
            <Link to="/midcoast-maine" className="underline underline-offset-4">Serving Midcoast Maine</Link>
            <Link to="/pricing" className="underline underline-offset-4">Website pricing</Link>
          </p>
        </div>
      </section>
    </main>
    <MarketingFooter />
  </div>
);

export default MarketingAndAds;
