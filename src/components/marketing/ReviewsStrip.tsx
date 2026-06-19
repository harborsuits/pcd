import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { GlowCard } from "@/components/ui/spotlight-card";
import { REVIEWS, type Review } from "@/data/reviews";

interface ReviewsStripProps {
  /** Heading shown above the strip. */
  heading?: string;
  /** Max reviews to display. Defaults to 3. */
  limit?: number;
  /** Filter by substring match in review text (case-insensitive). */
  match?: string;
}

function Stars({ rating }: { rating: Review["rating"] }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={
            i < rating
              ? "h-4 w-4 fill-accent text-accent"
              : "h-4 w-4 text-muted-foreground/30"
          }
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

/**
 * Curated Google reviews strip. Renders nothing if there are no real
 * reviews curated in src/data/reviews.ts yet — so it's safe to drop
 * into pages before reviews exist.
 *
 * Always text + star only (no avatars / photos). No aggregateRating
 * schema is emitted here — the JSON-LD gate lives in SEOHead and is
 * off until REVIEWS_SCHEMA_ENABLED flips.
 */
export function ReviewsStrip({
  heading = "What clients say",
  limit = 3,
  match,
}: ReviewsStripProps) {
  const filtered = match
    ? REVIEWS.filter((r) => r.text.toLowerCase().includes(match.toLowerCase()))
    : REVIEWS;
  const items = filtered.slice(0, limit);

  if (items.length === 0) return null;

  return (
    <section className="py-12 border-t border-border" aria-label="Client reviews">
      <div className="container mx-auto px-6">
        <div className="text-center mb-8">
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2">
            {heading}
          </h2>
          <p className="text-muted-foreground text-sm">
            Real reviews from Google. <Link to="/review" className="text-accent hover:underline">Leave one →</Link>
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {items.map((r, i) => (
            <GlowCard
              key={`${r.author}-${i}`}
              customSize
              glowColor="emerald"
              className="bg-card/80 p-5 h-full"
            >
              <Stars rating={r.rating} />
              <p className="text-sm text-muted-foreground mt-3 mb-4">
                "{r.text}"
              </p>
              <p className="text-xs font-semibold text-foreground">
                {r.author}
                <span className="font-normal text-muted-foreground"> · Google</span>
              </p>
            </GlowCard>
          ))}
        </div>
      </div>
    </section>
  );
}
