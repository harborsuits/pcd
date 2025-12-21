import { Star, Quote } from "lucide-react";

interface ReviewsPreviewProps {
  rating: number | null;
  reviewCount: number | null;
  businessName: string;
  templateType: string;
}

// Industry-specific sample reviews
const sampleReviews: Record<string, { text: string; author: string }[]> = {
  plumber: [
    { text: "Came out same day and fixed our leak quickly. Very professional.", author: "Recent Customer" },
    { text: "Fair pricing and quality work. Would definitely use again.", author: "Homeowner" },
    { text: "Responded fast to our emergency. Really appreciate it.", author: "Local Client" },
  ],
  roofer: [
    { text: "Did a great job on our roof repair after the storm.", author: "Recent Customer" },
    { text: "Professional crew, cleaned up after themselves.", author: "Homeowner" },
    { text: "Honest assessment and fair quote. Highly recommend.", author: "Local Client" },
  ],
  electrician: [
    { text: "Fixed our panel issue quickly and safely.", author: "Recent Customer" },
    { text: "Very knowledgeable and explained everything clearly.", author: "Homeowner" },
    { text: "Showed up on time and got the job done right.", author: "Local Client" },
  ],
  default: [
    { text: "Great service and very professional. Highly recommend.", author: "Recent Customer" },
    { text: "On time, fair pricing, and quality work.", author: "Local Client" },
    { text: "Would definitely use again. Very satisfied.", author: "Homeowner" },
  ],
};

export function ReviewsPreview({ rating, reviewCount, businessName, templateType }: ReviewsPreviewProps) {
  const reviews = sampleReviews[templateType] || sampleReviews.default;
  
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header with rating */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              What Customers Say
            </h2>
            {rating && (
              <div className="inline-flex items-center gap-2 bg-card border border-border px-4 py-2 rounded-full">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
                {reviewCount && (
                  <span className="text-muted-foreground text-sm">
                    based on {reviewCount} reviews
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Review cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {reviews.map((review, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-xl p-6 relative"
              >
                <Quote className="w-8 h-8 text-accent/20 absolute top-4 right-4" />
                <p className="text-foreground/80 text-sm mb-4 leading-relaxed">
                  "{review.text}"
                </p>
                <p className="text-xs text-muted-foreground">— {review.author}</p>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <p className="text-center text-xs text-muted-foreground/60 mt-6">
            {rating 
              ? `Rating from Google for ${businessName}. Sample reviews shown for preview.`
              : `Sample reviews shown for preview. Connect to import your actual reviews.`
            }
          </p>
        </div>
      </div>
    </section>
  );
}
