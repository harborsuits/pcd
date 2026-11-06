import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { MarketingHeader } from "@/components/layout/MarketingHeader";

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
    <div className="pcd-shell min-h-screen flex flex-col bg-page-bg text-foreground">
      <SEOHead
        title="Blog"
        description="Practical advice on websites, SEO, and AI tools for Maine small businesses. Written by the team at Pleasant Cove Design in Midcoast Maine."
        path="/blog"
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
        ]}
      />

      <MarketingHeader activePage="blog" />

      <main className="flex-1">
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
                className="rounded-lg border border-border bg-card hover:bg-card transition-colors p-6"
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
                    aria-label={`Read: ${post.title}`}
                    className="inline-flex items-center text-accent font-medium hover:underline underline-offset-4"
                  >
                    Read: {post.title} <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>
      </main>

      <MarketingFooter />
    </div>
  );
};

export default Blog;
