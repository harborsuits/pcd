import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type DemoType = "website" | "receptionist" | "both" | "recommend";
type WebsiteStyle = "simple" | "full" | "unsure";
type ReceptionistFocus = "answering" | "qualifying" | "everything";

const GetDemo = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    city: "",
    phone: "",
    website: "",
    occupation: "",
    expectations: "",
    demoType: "" as DemoType | "",
    websiteStyle: "" as WebsiteStyle | "",
    receptionistFocus: "" as ReceptionistFocus | "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.businessName.trim() || !formData.city.trim() || !formData.demoType) {
      toast({
        title: "Missing information",
        description: "Please enter your business name, city, and what you'd like to see.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("leads/request-demo", {
        body: {
          business_name: formData.businessName.trim(),
          city: formData.city.trim(),
          phone: formData.phone.trim() || null,
          website: formData.website.trim() || null,
          occupation: formData.occupation.trim() || null,
          expectations: formData.expectations.trim() || null,
          demo_type: formData.demoType,
          website_style: formData.websiteStyle || null,
          receptionist_focus: formData.receptionistFocus || null,
        },
      });

      if (error) throw error;

      if (data?.demo_url) {
        toast({
          title: "Demo ready!",
          description: "Redirecting you to your personalized demo...",
        });
        // Navigate to the demo
        navigate(data.demo_url);
      } else {
        toast({
          title: "Demo created",
          description: "We'll send you a link shortly.",
        });
      }
    } catch (err) {
      console.error("Demo request error:", err);
      toast({
        title: "Something went wrong",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-page-bg text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl font-bold tracking-tight text-foreground">
            Pleasant Cove Design
          </Link>
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center py-16 px-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-accent/10 text-accent rounded-full mb-4">
              <Sparkles className="h-6 w-6" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3">
              Get Your Demo
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              We'll create a personalized preview using public business information.
              <span className="block mt-1 text-sm">No obligation. No spam.</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                type="text"
                placeholder="e.g. Smith Plumbing"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupation">What does your business do? *</Label>
              <Input
                id="occupation"
                type="text"
                placeholder="e.g. Residential plumbing, HVAC repair, Landscaping"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City / Service Area *</Label>
              <Input
                id="city"
                type="text"
                placeholder="e.g. Portland, ME"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(207) 555-1234"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Optional — we'll text you the demo link
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Current Website</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://example.com"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Optional — leave blank if you don't have one
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectations">What are you hoping we can help with?</Label>
              <Textarea
                id="expectations"
                placeholder="e.g. More leads, better online presence, handling calls when I'm busy..."
                value={formData.expectations}
                onChange={(e) => setFormData({ ...formData, expectations: e.target.value })}
                disabled={isLoading}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Demo Type Selection */}
            <div className="space-y-3 pt-2">
              <Label>What would you like to see in your demo? *</Label>
              <RadioGroup
                value={formData.demoType}
                onValueChange={(value: DemoType) => setFormData({ 
                  ...formData, 
                  demoType: value,
                  websiteStyle: "",
                  receptionistFocus: ""
                })}
                className="grid gap-2"
                disabled={isLoading}
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="website" id="website-demo" />
                  <Label htmlFor="website-demo" className="cursor-pointer font-normal flex-1">A website demo</Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="receptionist" id="receptionist-demo" />
                  <Label htmlFor="receptionist-demo" className="cursor-pointer font-normal flex-1">An AI receptionist demo</Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="both" id="both-demo" />
                  <Label htmlFor="both-demo" className="cursor-pointer font-normal flex-1">Both working together</Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="recommend" id="recommend-demo" />
                  <Label htmlFor="recommend-demo" className="cursor-pointer font-normal flex-1">Not sure — show me what you recommend</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Conditional: Website Style */}
            {(formData.demoType === "website" || formData.demoType === "both") && (
              <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label>What kind of website fits you best right now?</Label>
                <RadioGroup
                  value={formData.websiteStyle}
                  onValueChange={(value: WebsiteStyle) => setFormData({ ...formData, websiteStyle: value })}
                  className="grid gap-2"
                  disabled={isLoading}
                >
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="simple" id="simple-site" />
                    <Label htmlFor="simple-site" className="cursor-pointer font-normal flex-1">Simple and clean</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="full" id="full-site" />
                    <Label htmlFor="full-site" className="cursor-pointer font-normal flex-1">Full service website</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="unsure" id="unsure-site" />
                    <Label htmlFor="unsure-site" className="cursor-pointer font-normal flex-1">Not sure yet</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Conditional: Receptionist Focus */}
            {(formData.demoType === "receptionist" || formData.demoType === "both") && (
              <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label>What should the receptionist help with?</Label>
                <RadioGroup
                  value={formData.receptionistFocus}
                  onValueChange={(value: ReceptionistFocus) => setFormData({ ...formData, receptionistFocus: value })}
                  className="grid gap-2"
                  disabled={isLoading}
                >
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="answering" id="answering" />
                    <Label htmlFor="answering" className="cursor-pointer font-normal flex-1">Answering calls & messages</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="qualifying" id="qualifying" />
                    <Label htmlFor="qualifying" className="cursor-pointer font-normal flex-1">Qualifying leads & booking</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="everything" id="everything" />
                    <Label htmlFor="everything" className="cursor-pointer font-normal flex-1">Handling everything automatically</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating your demo...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create My Demo
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            By submitting, you agree to receive a demo link. 
            <br />
            We won't share your info or send unwanted messages.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Pleasant Cove Design
        </div>
      </footer>
    </div>
  );
};

export default GetDemo;
