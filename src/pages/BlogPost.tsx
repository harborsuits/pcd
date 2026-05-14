import { Link, useParams, Navigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Footer } from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { BLOG_POSTS } from "@/data/blogPosts";

const formatDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-page-bg text-foreground">
      <SEOHead
        title={post.metaTitle}
        description={post.metaDescription}
        path={`/blog/${post.slug}`}
        type="article"
        datePublished={`${post.date}T00:00:00Z`}
        dateModified={`${post.date}T00:00:00Z`}
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ]}
      />

      <MarketingHeader activePage="blog" />

      <article className="pt-10 pb-12 md:pt-16">
        <div className="container mx-auto px-6 max-w-3xl">
          <Link
            to="/blog"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-accent mb-6"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> All posts
          </Link>
          <p className="text-xs uppercase tracking-wider text-accent font-semibold mb-3">
            {formatDate(post.date)} · Pleasant Cove Design
          </p>
          <h1
            data-speakable
            className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6"
          >
            {post.title}
          </h1>
          <p data-speakable className="text-lg text-muted-foreground mb-10">
            {post.excerpt}
          </p>

          <div
            className="prose prose-lg max-w-none text-foreground
              [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:md:text-3xl [&_h2]:font-bold
              [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-foreground
              [&_p]:text-base [&_p]:md:text-lg [&_p]:leading-relaxed
              [&_p]:text-muted-foreground [&_p]:mb-5
              [&_a]:text-accent [&_a]:underline-offset-4 hover:[&_a]:underline"
            dangerouslySetInnerHTML={{ __html: post.body }}
          />

          {/* CTA */}
          <aside className="mt-14 rounded-lg border border-accent/40 bg-accent/5 p-6 md:p-8 text-center">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-3">
              Want a website that actually works for your Maine business?
            </h2>
            <p className="text-muted-foreground mb-6">
              Get a free review of your current site — we'll show you exactly what to fix.
            </p>
            <Button asChild size="lg" className="text-base px-8 py-6">
              <Link to="/get-demo">
                Get a free review <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </aside>
        </div>
      </article>

      <div className="mt-auto">
        <Footer
          logo={<span className="font-serif text-lg font-bold">PCD</span>}
          brandName="Pleasant Cove Design"
          socialLinks={[]}
          mainLinks={[
            { href: "/what-we-build", label: "What We Build" },
            { href: "/pricing", label: "Pricing" },
            { href: "/midcoast-maine", label: "Midcoast Maine" },
            { href: "/blog", label: "Blog" },
            { href: "/get-demo", label: "Get a Demo" },
          ]}
          legalLinks={[
            { href: "/privacy", label: "Privacy" },
            { href: "/terms", label: "Terms" },
            { href: "mailto:hello@pleasantcovedesign.com", label: "Contact" },
          ]}
          locationLinks={{
            label: "Service Area",
            links: [{ href: "/midcoast-maine", label: "Midcoast Maine" }],
          }}
          copyright={{
            text: `© ${new Date().getFullYear()} Pleasant Cove Design. Based in Newcastle, Maine.`,
          }}
        />
      </div>
    </div>
  );
};

export default BlogPost;
