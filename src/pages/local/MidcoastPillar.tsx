import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { SEOHead } from "@/components/SEOHead";
import { TOWNS, VERTICALS, NAP } from "@/lib/localPages";
import { GlowCard } from "@/components/ui/spotlight-card";
import { MapPin, Briefcase } from "lucide-react";

const MidcoastPillar = () => {
  return (
    <div className="min-h-screen flex flex-col bg-page-bg text-foreground">
      <SEOHead
        title="Web Design in Midcoast Maine"
        description="Local web design and website fixes for small businesses in Midcoast Maine — Newcastle, Damariscotta, Boothbay, Camden, Rockland, and more."
        path="/midcoast-maine"
        localBusiness
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
          <p className="text-xs uppercase tracking-wider text-accent font-semibold mb-3">
            Based in Newcastle, Maine
          </p>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Web design for Midcoast Maine
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            We help small businesses across Midcoast Maine fix outdated websites, broken contact
            forms, and mobile experiences that quietly cost them customers every day.
          </p>
          <Link to="/get-demo?service=review">
            <LiquidButton size="lg">Get a Free Website Review</LiquidButton>
          </Link>
        </div>
      </section>

      <section className="py-12 border-t border-border">
        <div className="container mx-auto px-6">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-center mb-8 flex items-center justify-center gap-2">
            <MapPin className="h-6 w-6 text-accent" /> Towns we serve
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {TOWNS.map((t) => (
              <Link key={t.slug} to={`/web-design/${t.slug}`}>
                <GlowCard customSize glowColor="emerald" className="bg-card/80 p-4 hover:bg-card transition-all h-full">
                  <h3 className="font-semibold text-foreground">{t.name}, ME</h3>
                  <p className="text-xs text-muted-foreground mt-1">{t.blurb}</p>
                </GlowCard>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 border-t border-border">
        <div className="container mx-auto px-6">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-center mb-8 flex items-center justify-center gap-2">
            <Briefcase className="h-6 w-6 text-accent" /> Trades we work with
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {VERTICALS.map((v) => (
              <Link key={v.slug} to={`/websites-for/${v.slug}`}>
                <GlowCard customSize glowColor="teal" className="bg-card/80 p-5 hover:bg-card transition-all h-full">
                  <h3 className="font-semibold text-foreground mb-1">{v.name}</h3>
                  <p className="text-sm text-muted-foreground">{v.outcome}</p>
                </GlowCard>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 mt-8">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p className="mb-1">{NAP.name} · {NAP.city}, {NAP.region} · {NAP.email}</p>
          <p>{NAP.serviceArea}</p>
        </div>
      </footer>
    </div>
  );
};

export default MidcoastPillar;
