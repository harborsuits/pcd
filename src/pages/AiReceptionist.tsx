import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { Footer } from "@/components/ui/footer";
import { Phone, CalendarCheck, Bell, Wrench, Smile, Scissors, UtensilsCrossed, Home, Bed, ArrowRight, Clock, Voicemail, TrendingUp } from "lucide-react";

const AiReceptionist = () => {
  return (
    <div className="min-h-screen flex flex-col bg-page-bg text-foreground">
      <SEOHead
        title="AI Receptionist for Maine Businesses"
        description="Never miss a customer call again. Pleasant Cove Design installs a 24/7 AI phone receptionist that answers calls, books appointments, and qualifies leads — starting the same week."
        path="/ai-receptionist"
        service={{
          slug: "ai-receptionist",
          name: "AI Phone Receptionist",
          description:
            "A 24/7 AI phone receptionist that answers business calls, handles common questions, books appointments, and routes urgent calls — installed and trained for your Maine small business.",
          serviceType: "AI Phone Receptionist",
          areaServed: ["Maine"],
        }}
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "AI Receptionist", path: "/ai-receptionist" },
        ]}
        faq={[
          {
            question: "What is an AI phone receptionist?",
            answer:
              "An AI receptionist answers your business calls 24/7, handles common questions, books appointments, and routes urgent calls — all without a human on staff.",
          },
          {
            question: "How quickly can it be set up?",
            answer: "Most businesses are live within the same week.",
          },
          {
            question: "What kinds of businesses use this?",
            answer:
              "Contractors, dental offices, salons, restaurants, and any Maine small business that misses calls during busy hours or after hours.",
          },
          {
            question: "Do I need to change my phone number?",
            answer: "No. We forward calls from your existing number.",
          },
        ]}
      />

      <MarketingHeader activePage="ai-receptionist" />

      {/* Hero */}
      <section className="pt-12 pb-16 md:pt-20 md:pb-24 relative overflow-hidden">
        <div className="relative container mx-auto px-6 text-center max-w-4xl">
          <h1
            data-speakable
            className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
          >
            AI Phone Receptionist for Maine Small Businesses
          </h1>
          <p
            data-speakable
            className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-8 max-w-2xl mx-auto"
          >
            Your customers call. Paige answers.
          </p>
          <Button asChild size="lg" className="text-base px-8 py-6">
            <Link to="/get-demo">
              Book a Free Demo <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 md:py-20 bg-card/40 border-y border-border">
        <div className="container mx-auto px-6 max-w-5xl">
          <h2 data-speakable className="font-serif text-3xl md:text-4xl font-bold text-center mb-12">
            Every missed call is a missed customer.
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg border border-border bg-card/60">
              <Voicemail className="mx-auto h-10 w-10 text-accent mb-4" />
              <p className="text-4xl font-bold font-serif mb-2">62%</p>
              <p className="text-muted-foreground">of small-business calls go to voicemail during busy hours</p>
            </div>
            <div className="text-center p-6 rounded-lg border border-border bg-card/60">
              <Phone className="mx-auto h-10 w-10 text-accent mb-4" />
              <p className="text-4xl font-bold font-serif mb-2">85%</p>
              <p className="text-muted-foreground">of people who reach voicemail will not call back</p>
            </div>
            <div className="text-center p-6 rounded-lg border border-border bg-card/60">
              <TrendingUp className="mx-auto h-10 w-10 text-accent mb-4" />
              <p className="text-4xl font-bold font-serif mb-2">After hours</p>
              <p className="text-muted-foreground">calls are often your most motivated leads — and they go unanswered</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-6 max-w-5xl">
          <h2 data-speakable className="font-serif text-3xl md:text-4xl font-bold text-center mb-12">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative p-6 rounded-lg border border-border bg-card/40">
              <div className="absolute -top-4 left-6 inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                1
              </div>
              <h3 className="font-serif text-xl font-semibold mt-3 mb-3">We set up your AI receptionist</h3>
              <p className="text-muted-foreground">
                We configure your AI phone assistant, connect it to your existing number, and tailor it to your business hours and services.
              </p>
            </div>
            <div className="relative p-6 rounded-lg border border-border bg-card/40">
              <div className="absolute -top-4 left-6 inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                2
              </div>
              <h3 className="font-serif text-xl font-semibold mt-3 mb-3">It learns your business</h3>
              <p className="text-muted-foreground">
                We train it on your services, pricing, scheduling policies, and common questions so every caller gets accurate, helpful answers.
              </p>
            </div>
            <div className="relative p-6 rounded-lg border border-border bg-card/40">
              <div className="absolute -top-4 left-6 inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                3
              </div>
              <h3 className="font-serif text-xl font-semibold mt-3 mb-3">It answers, books, and notifies you</h3>
              <p className="text-muted-foreground">
                The AI handles calls 24/7, books appointments directly into your calendar, and sends you instant summaries of every conversation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-16 md:py-20 bg-card/40 border-y border-border">
        <div className="container mx-auto px-6 max-w-5xl">
          <h2 data-speakable className="font-serif text-3xl md:text-4xl font-bold text-center mb-12">
            Who it's for
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { icon: Wrench, label: "Contractors" },
              { icon: Smile, label: "Dental Offices" },
              { icon: Scissors, label: "Salons" },
              { icon: UtensilsCrossed, label: "Restaurants" },
              { icon: Home, label: "Real Estate" },
              { icon: Bed, label: "Inns & Lodging" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center justify-center p-6 rounded-lg border border-border bg-card/60 hover:bg-card transition-colors"
              >
                <item.icon className="h-10 w-10 text-accent mb-3" />
                <span className="font-medium text-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <h2 data-speakable className="font-serif text-3xl md:text-4xl font-bold mb-6">
            Ready to stop missing calls?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Get your AI receptionist live this week. Book a free demo and see how it works for your business.
          </p>
          <Button asChild size="lg" className="text-base px-8 py-6">
            <Link to="/get-demo">
              Book a Free Demo <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <div className="mt-auto">
        <Footer
          logo={<span className="font-serif text-lg font-bold">PCD</span>}
          brandName="Pleasant Cove Design"
          socialLinks={[]}
          mainLinks={[
            { href: "/what-we-build", label: "What We Build" },
            { href: "/pricing", label: "Pricing" },
            { href: "/midcoast-maine", label: "Midcoast Maine" },
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

export default AiReceptionist;
