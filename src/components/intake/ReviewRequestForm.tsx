import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  name: z.string().trim().min(1, "Name is required").max(100, "Keep your name under 100 characters"),
  email: z.string().trim().email("Enter a valid email").max(255, "Keep your email under 255 characters"),
  website_url: z
    .string()
    .trim()
    .min(3, "Enter your website URL")
    .max(500, "Keep the website address under 500 characters")
    .refine((value) => !/\s/.test(value) && /\.[a-z]{2,}/i.test(value), "That doesn't look like a website URL"),
  business_type: z.string().optional(),
  note: z.string().max(500, "Keep it under 500 characters").optional(),
});

type FormState = z.infer<typeof Schema>;

export function ReviewRequestForm({ contextNote }: { contextNote?: string }) {
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
  const [submitError, setSubmitError] = useState("");

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError("");
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
      const note = [contextNote, parsed.data.note].filter(Boolean).join("\n").slice(0, 500) || null;
      const { data, error } = await supabase.functions.invoke("website-review", {
        body: {
          name: parsed.data.name,
          email: parsed.data.email,
          website_url: parsed.data.website_url,
          business_type: parsed.data.business_type || null,
          note,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(typeof data.error === "string" ? data.error : "Submission failed");
      setSubmitted(true);
    } catch {
      setSubmitError("We couldn’t send your review request. Your entries are still here — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-6" role="status">
        <div className="text-center">
          <CheckCircle2 className="h-10 w-10 text-accent mx-auto mb-4" aria-hidden="true" />
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
              Discuss a new website
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
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="rv-name">Your name *</Label>
        <Input
          id="rv-name"
          required
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "rv-name-error" : undefined}
          value={form.name}
          onChange={(event) => update("name", event.target.value)}
          placeholder="Alex Smith"
          autoComplete="name"
          maxLength={100}
        />
        {errors.name && <p id="rv-name-error" className="text-sm text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="rv-email">Email *</Label>
        <Input
          id="rv-email"
          required
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "rv-email-error" : undefined}
          type="email"
          value={form.email}
          onChange={(event) => update("email", event.target.value)}
          placeholder="you@business.com"
          autoComplete="email"
          maxLength={255}
        />
        {errors.email && <p id="rv-email-error" className="text-sm text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="rv-url">Current website *</Label>
        <Input
          id="rv-url"
          required
          aria-required="true"
          aria-invalid={!!errors.website_url}
          aria-describedby={errors.website_url ? "rv-url-error" : undefined}
          value={form.website_url}
          onChange={(event) => update("website_url", event.target.value)}
          placeholder="yourbusiness.com"
          autoComplete="url"
          inputMode="url"
          maxLength={500}
        />
        {errors.website_url && <p id="rv-url-error" className="text-sm text-destructive">{errors.website_url}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="rv-type">What kind of business is this? <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Select value={form.business_type} onValueChange={(value) => update("business_type", value)}>
          <SelectTrigger id="rv-type">
            <SelectValue placeholder="Select one" />
          </SelectTrigger>
          <SelectContent>
            {BUSINESS_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rv-note">What feels off? <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Textarea
          id="rv-note"
          aria-invalid={!!errors.note}
          aria-describedby={errors.note ? "rv-note-error" : undefined}
          value={form.note}
          onChange={(event) => update("note", event.target.value)}
          placeholder="e.g. slow on mobile, no one calls, looks dated…"
          rows={3}
          maxLength={500}
        />
        {errors.note && <p id="rv-note-error" className="text-sm text-destructive">{errors.note}</p>}
      </div>

      <div className="pt-1">
        <Button type="submit" disabled={submitting} className="w-full h-12 text-base">
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            "Send me my free review"
          )}
        </Button>
        {submitError && <p role="alert" className="mt-3 text-sm text-destructive leading-relaxed">{submitError}</p>}
        <p className="mt-2 text-center text-xs text-muted-foreground">
          No spam. No sales pressure. Just honest feedback.
        </p>
      </div>
    </form>
  );
}
