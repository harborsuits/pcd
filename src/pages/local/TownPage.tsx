import { Button } from "@/components/ui/button";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { Link, useParams, Navigate } from "react-router-dom";

import { SEOHead } from "@/components/SEOHead";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { TOWNS, VERTICALS, TOWN_NEIGHBORS } from "@/lib/localPages";
import { ReviewsStrip } from "@/components/marketing/ReviewsStrip";
import { MapPin, CheckCircle } from "lucide-react";

const TownPage = () => {
  const { town: slug } = useParams<{ town: string }>();
  const town = TOWNS.find((t) => t.slug === slug);
  if (!town) return <Navigate to="/midcoast-maine" replace />;

  const title = `Web Design in ${town.name}, Maine`;
  const description = `Website design, fixes, and local SEO for small businesses in ${town.name}, Maine. Free website review with a clear fix plan.`;

  return (
    <div className="pcd-shell min-h-screen flex flex-col bg-page-bg text-foreground">
      <SEOHead
        title={title}
        description={description}
        path={`/web-design/${town.slug}`}
        localBusiness
        areaServed={[`${town.name}, ME`]}
      />
      <MarketingHeader />

      <main className="flex-1">
      <section className="pt-16 pb-10">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <p className="text-xs uppercase tracking-wider text-accent font-semibold mb-3 flex items-center justify-center gap-1">
            <MapPin className="h-4 w-4" /> Serving {town.name}, Maine
          </p>
          <h1 data-speakable className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Web design in {town.name}, Maine
          </h1>
          <p data-speakable className="text-lg text-muted-foreground mb-2">{town.blurb}</p>
          <p className="text-base text-muted-foreground mb-8">
            Pleasant Cove Design helps {town.name} small businesses fix outdated websites, broken contact forms, and confusing customer journeys — so visitors can find what they need and contact you.
          </p>
          <Button asChild size="lg"><Link to={`/get-demo?service=review&town=${town.slug}`}>Get a Free Website Review</Link></Button>
        </div>
      </section>

      <section className="py-12 border-t border-border">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="font-serif text-2xl font-bold mb-6 text-center">
            What we do for {town.name} businesses
          </h2>
          <ul className="space-y-3 text-muted-foreground">
            {[
              "Fix outdated, mobile-broken websites",
              "Add clear booking, contact, and quote flows",
              "Improve technical SEO and accurate local business information",
              "Keep it maintained — backups, updates, small changes",
            ].map((line) => (
              <li key={line} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-12 border-t border-border">
        <div className="container mx-auto px-6">
          <h2 className="font-serif text-2xl font-bold text-center mb-8">
            Trades we build for in {town.name}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {VERTICALS.map((v) => (
              <Link key={v.slug} to={v.demoPath ?? `/websites-for/${v.slug}`}>
                <article className="rounded-lg border border-border bg-card p-4 hover:bg-card transition-all h-full">
                  <h3 className="font-semibold text-foreground">{v.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{v.outcome}</p>
                  {v.demoPath && <p className="text-xs text-accent mt-2">View demo →</p>}
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ReviewsStrip />

      {(TOWN_NEIGHBORS[town.slug] ?? []).length > 0 && (
        <section className="py-10 border-t border-border">
          <div className="container mx-auto px-6 max-w-3xl text-center">
            <h2 className="font-serif text-xl font-semibold mb-4">
              Nearby towns we also serve
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {TOWN_NEIGHBORS[town.slug].map((slug) => {
                const n = TOWNS.find((t) => t.slug === slug);
                if (!n) return null;
                return (
                  <Link
                    key={slug}
                    to={`/web-design/${slug}`}
                    className="text-sm border border-border rounded-md py-2 px-4 bg-card text-muted-foreground hover:text-accent hover:bg-card transition-colors"
                  >
                    {n.name}, ME
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="py-10 border-t border-border bg-card/30">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="font-serif text-base font-semibold text-center mb-3 text-muted-foreground">
            Web design services in {town.name}
          </h2>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 text-sm">
            {VERTICALS.map((v) => (
              <Link
                key={v.slug}
                to={`/websites-for/${v.slug}`}
                className="text-muted-foreground hover:text-accent underline-offset-4 hover:underline"
              >
                Websites for {v.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 border-t border-border text-center">
        <div className="container mx-auto px-6">
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4">
            Review your {town.name} website’s next steps.
          </h2>
          <Button asChild size="lg"><Link to={`/get-demo?service=review&town=${town.slug}`}>Get My Free Review</Link></Button>
        </div>
      </section>
      </main>

      <MarketingFooter />
    </div>
  );
};

export default TownPage;
