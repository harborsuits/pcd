import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Footer } from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { BLOG_POSTS } from "@/data/blogPosts";

const formatDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const Blog = () => {
  const posts = [...BLOG_POSTS].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="min-h-screen flex flex-col bg-page-bg text-foreground">
      <SEOHead
        title="Blog"
        description="Practical advice on websites, SEO, and AI tools for Maine small businesses. Written by the team at Pleasant Cove Design in Midcoast Maine."
        path="/blog"
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
        ]}
      />

      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl font-bold tracking-tight text-foreground">
            Pleasant Cove Design
          </Link>
          <nav className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link to="/midcoast-maine">Midcoast Maine</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link to="/ai-receptionist">AI Receptionist</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link to="/blog">Blog</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link to="/what-we-build">What We Build</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link to="/pricing">Pricing</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/portal">Client Portal</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="pt-12 pb-10 md:pt-20 md:pb-14">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <h1 data-speakable className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
            Web Design Tips for Maine Small Businesses
          </h1>
          <p data-speakable className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            Practical, no-fluff advice on websites, SEO, and AI tools — from the team at Pleasant Cove Design in Midcoast Maine.
          </p>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto px-6 max-w-3xl">
          <ul className="space-y-6">
            {posts.map((post) => (
              <li
                key={post.slug}
                className="rounded-lg border border-border bg-card/60 hover:bg-card transition-colors p-6"
              >
                <article>
                  <p className="text-xs uppercase tracking-wider text-accent font-semibold mb-2">
                    {formatDate(post.date)}
                  </p>
                  <h2 className="font-serif text-2xl md:text-3xl font-bold mb-3">
                    <Link to={`/blog/${post.slug}`} className="hover:text-accent transition-colors">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                  <Link
                    to={`/blog/${post.slug}`}
                    className="inline-flex items-center text-accent font-medium hover:underline underline-offset-4"
                  >
                    Read more <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>

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

export default Blog;
