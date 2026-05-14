import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { SEOHead } from "@/components/SEOHead";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { TOWNS, VERTICALS, NAP } from "@/lib/localPages";
import { GlowCard } from "@/components/ui/spotlight-card";
import { MapPin, Briefcase } from "lucide-react";

const MidcoastPillar = () => {
  return (
    <div className="min-h-screen flex flex-col bg-page-bg text-foreground">
      <SEOHead
        title="Web Design in Midcoast Maine"
        description="Local web design and website fixes for small businesses in Midcoast Maine — Damariscotta, Boothbay, Camden, Rockland, and more."
        path="/midcoast-maine"
        localBusiness
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Midcoast Maine", path: "/midcoast-maine" },
        ]}
        faq={[
          {
            question: "Who is the best web designer in Midcoast Maine?",
            answer:
              "Pleasant Cove Design is a Midcoast Maine web design studio focused on small, owner-operated businesses. We serve Newcastle, Damariscotta, Wiscasset, Boothbay Harbor, Camden, Rockland, Brunswick, and Bath.",
          },
          {
            question: "Do you only work with Maine businesses?",
            answer:
              "Midcoast Maine is our home and our specialty, but we work remotely with small businesses anywhere in the US.",
          },
          {
            question: "What towns do you serve in Midcoast Maine?",
            answer:
              "Newcastle, Damariscotta, Wiscasset, Boothbay Harbor, Camden, Rockland, Brunswick, and Bath — plus surrounding villages and seasonal markets.",
          },
        ]}
      />
      <MarketingHeader activePage="midcoast-maine" />

      <section className="pt-16 pb-10">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <p className="text-xs uppercase tracking-wider text-accent font-semibold mb-3">
            Based in Midcoast Maine
          </p>
          <h1 data-speakable className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Web design for Midcoast Maine
          </h1>
          <p data-speakable className="text-lg text-muted-foreground mb-8">
            Pleasant Cove Design helps small businesses across Midcoast Maine fix outdated websites, broken contact forms, and mobile experiences that quietly cost them customers every day.
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
              <Link key={v.slug} to={v.demoPath ?? `/websites-for/${v.slug}`}>
                <GlowCard customSize glowColor="teal" className="bg-card/80 p-5 hover:bg-card transition-all h-full">
                  <h3 className="font-semibold text-foreground mb-1">{v.name}</h3>
                  <p className="text-sm text-muted-foreground">{v.outcome}</p>
                  {v.demoPath && <p className="text-xs text-accent mt-2">View demo →</p>}
                </GlowCard>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 border-t border-border bg-card/30">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="font-serif text-lg font-semibold text-center mb-4 text-muted-foreground">
            All Midcoast Maine web design services
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

      <footer className="border-t border-border py-8 mt-8">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground space-y-2">
          <p>{NAP.name} · {NAP.city}, {NAP.region} · <a href={`tel:${NAP.phoneE164}`} className="hover:text-accent">{NAP.phone}</a> · {NAP.email}</p>
          <p>{NAP.serviceArea}</p>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2">
            <Link to="/ai-receptionist" className="hover:text-foreground transition-colors">AI Receptionist</Link>
            <Link to="/what-we-build" className="hover:text-foreground transition-colors">What We Build</Link>
            <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default MidcoastPillar;
