import { Link, useParams, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { SEOHead } from "@/components/SEOHead";
import { VERTICALS, TOWNS, NAP } from "@/lib/localPages";
import { GlowCard } from "@/components/ui/spotlight-card";
import { AlertCircle, ArrowRight } from "lucide-react";

const VerticalPage = () => {
  const { vertical: slug } = useParams<{ vertical: string }>();
  const v = VERTICALS.find((x) => x.slug === slug);
  if (!v) return <Navigate to="/midcoast-maine" replace />;

  const title = `Websites for ${v.name} in Midcoast Maine`;
  const description = `Web design and website fixes built for ${v.name.toLowerCase()} in Midcoast Maine. Designed to drive ${v.outcome}.`;

  return (
    <div className="min-h-screen flex flex-col bg-page-bg text-foreground">
      <SEOHead title={title} description={description} path={`/websites-for/${v.slug}`} localBusiness />
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl font-bold tracking-tight">
            Pleasant Cove Design
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link to={`/get-demo?service=${v.service ?? "review"}`}>Free Review</Link>
          </Button>
        </div>
      </header>

      <section className="pt-16 pb-10">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <p className="text-xs uppercase tracking-wider text-accent font-semibold mb-3">
            Midcoast Maine · {v.name}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Websites for {v.name}
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Built to drive {v.outcome} — not just look pretty.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to={`/get-demo?service=${v.service ?? "review"}`}>
              <LiquidButton size="lg">Get a Free Review</LiquidButton>
            </Link>
            {v.demoPath && (
              <Link to={v.demoPath}>
                <Button variant="outline" size="lg">
                  See a sample {v.singular.toLowerCase()} site <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="py-12 border-t border-border">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="font-serif text-2xl font-bold mb-6 text-center">
            What we usually find on {v.singular.toLowerCase()} websites
          </h2>
          <div className="space-y-3">
            {v.pains.map((p) => (
              <GlowCard key={p} customSize glowColor="teal" className="bg-card/80 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{p}</span>
                </div>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 border-t border-border">
        <div className="container mx-auto px-6">
          <h2 className="font-serif text-2xl font-bold text-center mb-8">
            Serving {v.name.toLowerCase()} across Midcoast Maine
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {TOWNS.map((t) => (
              <Link
                key={t.slug}
                to={`/web-design/${t.slug}`}
                className="text-center text-sm text-muted-foreground hover:text-accent border border-border rounded-md py-2 px-3 bg-card/60 transition-colors"
              >
                {t.name}, ME
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 border-t border-border text-center">
        <div className="container mx-auto px-6">
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4">
            Ready to see what we'd build for you?
          </h2>
          <Link to={`/get-demo?service=${v.service ?? "review"}`}>
            <LiquidButton size="lg">Get My Free Review</LiquidButton>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p className="mb-1">{NAP.name} · {NAP.city}, {NAP.region} · <a href={`tel:${NAP.phoneE164}`} className="hover:text-accent">{NAP.phone}</a> · {NAP.email}</p>
          <p>{NAP.serviceArea}</p>
          <p className="mt-3">
            <Link to="/midcoast-maine" className="text-accent hover:underline">All Midcoast services →</Link>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default VerticalPage;
