import { Link, useParams, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { SEOHead } from "@/components/SEOHead";
import { TOWNS, VERTICALS, NAP } from "@/lib/localPages";
import { GlowCard } from "@/components/ui/spotlight-card";
import { MapPin, CheckCircle } from "lucide-react";

const TownPage = () => {
  const { town: slug } = useParams<{ town: string }>();
  const town = TOWNS.find((t) => t.slug === slug);
  if (!town) return <Navigate to="/midcoast-maine" replace />;

  const title = `Web Design in ${town.name}, Maine`;
  const description = `Website design, fixes, and local SEO for small businesses in ${town.name}, Maine. Free website review with a clear fix plan.`;

  return (
    <div className="min-h-screen flex flex-col bg-page-bg text-foreground">
      <SEOHead
        title={title}
        description={description}
        path={`/web-design/${town.slug}`}
        localBusiness
        areaServed={[`${town.name}, ME`]}
      />
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl font-bold tracking-tight">
            Pleasant Cove Design
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link to="/get-demo?service=review">Free Review</Link>
          </Button>
        </div>
      </header>

      <section className="pt-16 pb-10">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <p className="text-xs uppercase tracking-wider text-accent font-semibold mb-3 flex items-center justify-center gap-1">
            <MapPin className="h-4 w-4" /> Serving {town.name}, Maine
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Web design in {town.name}, Maine
          </h1>
          <p className="text-lg text-muted-foreground mb-2">{town.blurb}</p>
          <p className="text-base text-muted-foreground mb-8">
            We help {town.name} small businesses fix outdated websites, broken contact forms, and
            confusing customer journeys — so the visitors you already have actually become customers.
          </p>
          <Link to={`/get-demo?service=review&town=${town.slug}`}>
            <LiquidButton size="lg">Get a Free Website Review</LiquidButton>
          </Link>
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
              "Set up local SEO so you show up for nearby searches",
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
              <Link key={v.slug} to={`/websites-for/${v.slug}`}>
                <GlowCard customSize glowColor="emerald" className="bg-card/80 p-4 hover:bg-card transition-all h-full">
                  <h3 className="font-semibold text-foreground">{v.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{v.outcome}</p>
                </GlowCard>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 border-t border-border text-center">
        <div className="container mx-auto px-6">
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4">
            Find out what your {town.name} website is costing you.
          </h2>
          <Link to={`/get-demo?service=review&town=${town.slug}`}>
            <LiquidButton size="lg">Get My Free Review</LiquidButton>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p className="mb-1">{NAP.name} · {NAP.city}, {NAP.region} · {NAP.email}</p>
          <p>Serving {town.name} and surrounding Midcoast Maine</p>
          <p className="mt-3">
            <Link to="/midcoast-maine" className="text-accent hover:underline">All Midcoast towns →</Link>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TownPage;
