import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { Link, useParams, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { VERTICALS, TOWNS } from "@/lib/localPages";
import { AlertCircle, ArrowRight } from "lucide-react";

const VerticalPage = () => {
  const { vertical: slug } = useParams<{ vertical: string }>();
  const v = VERTICALS.find((x) => x.slug === slug);
  if (!v) return <Navigate to="/midcoast-maine" replace />;

  const title = `Websites for ${v.name} in Midcoast Maine`;
  const description = `Web design and website fixes built for ${v.name.toLowerCase()} in Midcoast Maine. Designed to drive ${v.outcome}.`;
  const serviceDescription = `Pleasant Cove Design builds and fixes websites for ${v.name.toLowerCase()} across Midcoast Maine — designed to drive ${v.outcome}, with mobile-first layouts, clear contact and quote flows, and local SEO included.`;

  return (
    <div className="pcd-shell min-h-screen flex flex-col bg-page-bg text-foreground">
      <SEOHead
        title={title}
        description={description}
        path={`/websites-for/${v.slug}`}
        localBusiness
        service={{
          slug: v.slug,
          name: `Web Design for ${v.name}`,
          description: serviceDescription,
          serviceType: `Web design for ${v.name.toLowerCase()}`,
        }}
      />
      <MarketingHeader />

      <main className="flex-1">
      <section className="pt-16 pb-10">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <p className="text-xs uppercase tracking-wider text-accent font-semibold mb-3">
            Midcoast Maine · {v.name}
          </p>
          <h1 data-speakable className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Websites for {v.name}
          </h1>
          <p data-speakable className="text-lg text-muted-foreground mb-8">
            Pleasant Cove Design builds {v.name.toLowerCase()} websites in Midcoast Maine with clear services, useful information, and straightforward contact options.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg"><Link to={`/get-demo?service=${v.service ?? "review"}`}>Get a Free Review</Link></Button>
            {v.demoPath && (
              <Button asChild variant="outline" size="lg"><Link to={v.demoPath}>
                  See a sample {v.singular.toLowerCase()} site <ArrowRight className="ml-2 h-4 w-4" />
                </Link></Button>
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
              <article key={p} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{p}</span>
                </div>
              </article>
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
                className="text-center text-sm text-muted-foreground hover:text-accent border border-border rounded-md py-2 px-3 bg-card transition-colors"
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
          <Button asChild size="lg"><Link to={`/get-demo?service=${v.service ?? "review"}`}>Get My Free Review</Link></Button>
        </div>
      </section>
      </main>

      <MarketingFooter />
    </div>
  );
};

export default VerticalPage;
