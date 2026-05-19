import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Loader2, CheckCircle2, ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const BUSINESS_TYPES = [
  { value: "contractor", label: "Contractor" },
  { value: "medical", label: "Dentist / Medical" },
  { value: "restaurant", label: "Restaurant" },
  { value: "retail", label: "Retail" },
  { value: "service", label: "Service Business" },
  { value: "other", label: "Other" },
];

const Schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  website_url: z
    .string()
    .trim()
    .min(3, "Enter your website URL")
    .max(500)
    .refine((v) => /\.[a-z]{2,}/i.test(v), "That doesn't look like a website URL"),
  business_type: z.string().optional(),
  note: z.string().max(500, "Keep it under 500 characters").optional(),
});

type FormState = z.infer<typeof Schema>;

export function ReviewRequestForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    website_url: "",
    business_type: "",
    note: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Schema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        name: fieldErrors.name?.[0],
        email: fieldErrors.email?.[0],
        website_url: fieldErrors.website_url?.[0],
        note: fieldErrors.note?.[0],
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("website-review", {
        body: {
          name: parsed.data.name,
          email: parsed.data.email,
          website_url: parsed.data.website_url,
          business_type: parsed.data.business_type || null,
          note: parsed.data.note || null,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(typeof data.error === "string" ? data.error : "Submission failed");
      setSubmitted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast({ title: "Couldn't send your request", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 text-green-600 mb-4">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="font-serif text-2xl font-bold mb-2">
            Thanks {form.name.split(" ")[0]} — your review is on the way.
          </h2>
          <p className="text-muted-foreground">
            We'll email you a short Loom walkthrough and written notes showing what may be hurting trust,
            clarity, or conversions — plus the highest-impact fixes first. Usually within 2 business days.
          </p>
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-3">
          <h3 className="font-serif text-lg font-semibold">Want a full rebuild plan + live demo?</h3>
          <p className="text-sm text-muted-foreground">
            Tell us a bit more about your business and we'll build a working demo you can click through —
            free, no deposit.
          </p>
          <div className="flex flex-col gap-2 pt-1">
            <Button onClick={() => navigate("/get-demo?service=website")} className="w-full">
              Continue to full intake
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
            >
              No thanks, just the review is fine
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="text-center mb-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
          <Search className="h-6 w-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold mb-2">Free Website Review</h2>
        <p className="text-muted-foreground text-sm">
          Drop your URL and we'll send back honest, specific feedback on what's likely costing you
          conversions — and what to fix first.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rv-name">Your name</Label>
        <Input
          id="rv-name"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Alex Smith"
          autoComplete="name"
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rv-email">Email</Label>
        <Input
          id="rv-email"
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="you@business.com"
          autoComplete="email"
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rv-url">Current website URL</Label>
        <Input
          id="rv-url"
          value={form.website_url}
          onChange={(e) => update("website_url", e.target.value)}
          placeholder="yourbusiness.com"
          autoComplete="url"
        />
        {errors.website_url && <p className="text-xs text-destructive">{errors.website_url}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rv-type">What kind of business is this? <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Select value={form.business_type} onValueChange={(v) => update("business_type", v)}>
          <SelectTrigger id="rv-type">
            <SelectValue placeholder="Select one" />
          </SelectTrigger>
          <SelectContent>
            {BUSINESS_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rv-note">What feels off? <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Textarea
          id="rv-note"
          value={form.note}
          onChange={(e) => update("note", e.target.value)}
          placeholder="e.g. slow on mobile, no one calls, looks dated…"
          rows={3}
          maxLength={500}
        />
        {errors.note && <p className="text-xs text-destructive">{errors.note}</p>}
      </div>

      <div className="pt-1">
        <Button type="submit" disabled={submitting} className="w-full h-11">
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            "Send me my free review"
          )}
        </Button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          No spam. No sales pressure. Just honest feedback.
        </p>
      </div>
    </form>
  );
}
