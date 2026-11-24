import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, CheckCircle2, ChevronDown, Loader2 } from "lucide-react";
import { z } from "zod";
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
  website_url: z
    .string()
    .trim()
    .min(3, "Enter your website address.")
    .max(500, "Keep the website address under 500 characters.")
    .refine(
      (value) => !/\s/.test(value) && /\.[a-z]{2,}/i.test(value),
      "Enter a website address like yourbusiness.com.",
    ),
  email: z
    .string()
    .trim()
    .email("Enter the email address where I should send your review.")
    .max(255, "Keep your email under 255 characters."),
  name: z.string().trim().min(1, "Enter your name.").max(100, "Keep your name under 100 characters."),
  business_type: z.string().optional(),
  note: z.string().trim().max(500, "Keep your note under 500 characters.").optional(),
});

type FormState = z.infer<typeof Schema>;

const requiredFields = [
  {
    key: "website_url",
    label: "Website address",
    placeholder: "yourbusiness.com",
    autoComplete: "url",
    inputMode: "url",
  },
  { key: "email", label: "Email address", placeholder: "you@yourbusiness.com", autoComplete: "email", type: "email" },
  { key: "name", label: "Your name", placeholder: "Alex Smith", autoComplete: "name" },
] as const;

const fieldStyle =
  "min-h-11 rounded-lg border-[#879899] bg-[#f8faf9] px-3.5 text-base text-[#172f37] placeholder:text-[#596d71] focus-visible:ring-[#2c645d] aria-invalid:border-destructive";

export function ReviewRequestForm({ contextNote }: { contextNote?: string }) {
  const [form, setForm] = useState<FormState>({ name: "", email: "", website_url: "", business_type: "", note: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<{ name: string; email: string } | null>(null);
  const [submitError, setSubmitError] = useState("");
  const confirmationHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (receipt) confirmationHeading.current?.focus();
  }, [receipt]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitError("");
    const parsed = Schema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        website_url: fieldErrors.website_url?.[0],
        email: fieldErrors.email?.[0],
        name: fieldErrors.name?.[0],
        note: fieldErrors.note?.[0],
      });
      const firstError = requiredFields.find(({ key }) => fieldErrors[key]?.length);
      const field = event.currentTarget.elements.namedItem(firstError?.key ?? "note");
      if (field instanceof HTMLElement) field.focus();
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
      setReceipt({ name: parsed.data.name, email: parsed.data.email });
    } catch {
      setSubmitError("I couldn’t receive your request. Your entries are still here, so you can try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (receipt) {
    return (
      <div className="space-y-4 py-4">
        <CheckCircle2 className="h-10 w-10 text-[#2c645d]" aria-hidden="true" />
        <h2
          id="review-heading"
          ref={confirmationHeading}
          tabIndex={-1}
          className="font-serif text-3xl font-medium tracking-tight"
        >
          Your request is in.
        </h2>
        <p className="break-words leading-relaxed text-[#455f65]">
          Thanks, {receipt.name.split(/\s+/)[0]}. I’ll send your video walkthrough and written notes to{" "}
          <strong className="font-semibold text-[#172f37]">{receipt.email}</strong>, usually within two business days.
        </p>
        <Link
          to="/"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-[#25564e] underline underline-offset-4"
        >
          Back to Pleasant Cove Design
        </Link>
      </div>
    );
  }

  return (
    <>
      <h2 id="review-heading" className="font-serif text-[1.8rem] font-medium leading-tight tracking-tight sm:text-3xl">
        Request your review
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-[#455f65]">Usually emailed within two business days.</p>

      <form onSubmit={onSubmit} className="mt-5 space-y-3.5 sm:space-y-4" noValidate>
        {requiredFields.map(({ key, label, placeholder, autoComplete, ...inputProps }) => (
          <div key={key} className="space-y-1.5">
            <Label htmlFor={`rv-${key}`} className="font-semibold">
              {label} <span aria-hidden="true">*</span>
            </Label>
            <Input
              id={`rv-${key}`}
              name={key}
              className={fieldStyle}
              required
              aria-invalid={!!errors[key]}
              aria-describedby={errors[key] ? `rv-${key}-error` : undefined}
              value={form[key]}
              onChange={(event) => update(key, event.target.value)}
              placeholder={placeholder}
              autoComplete={autoComplete}
              maxLength={key === "website_url" ? 500 : key === "email" ? 255 : 100}
              {...inputProps}
            />
            {errors[key] && (
              <p id={`rv-${key}-error`} className="text-sm text-destructive">
                {errors[key]}
              </p>
            )}
          </div>
        ))}

        <details className="group rounded-lg border border-[#d8e3df]">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3.5 text-sm font-semibold text-[#25564e] hover:bg-[#f1f7f3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2c645d] [&::-webkit-details-marker]:hidden">
            <span>
              Add details <span className="font-normal text-[#455f65]">(optional)</span>
            </span>
            <ChevronDown
              className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
              aria-hidden="true"
            />
          </summary>
          <div className="space-y-3.5 border-t border-[#d8e3df] p-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="rv-note">
                Anything you want me to look at? <span className="text-[#455f65]">(optional)</span>
              </Label>
              <Textarea
                id="rv-note"
                name="note"
                className={fieldStyle}
                aria-invalid={!!errors.note}
                aria-describedby={errors.note ? "rv-note-error" : undefined}
                value={form.note}
                onChange={(event) => update("note", event.target.value)}
                placeholder="For example, customers have trouble finding my hours."
                rows={3}
                maxLength={500}
              />
              {errors.note && (
                <p id="rv-note-error" className="text-sm text-destructive">
                  {errors.note}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rv-type">
                Business type <span className="text-[#455f65]">(optional)</span>
              </Label>
              <Select value={form.business_type} onValueChange={(value) => update("business_type", value)}>
                <SelectTrigger id="rv-type" className={fieldStyle}>
                  <SelectValue placeholder="Choose a business type" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </details>

        <Button
          type="submit"
          disabled={submitting}
          className="h-12 w-full gap-2 rounded-lg bg-[#22534a] text-base font-semibold text-white hover:bg-[#173e37] focus-visible:ring-[#22534a]"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Sending…
            </>
          ) : (
            <>
              Get my free review <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </Button>
        {submitError && (
          <p role="alert" className="text-sm leading-relaxed text-destructive">
            {submitError}
          </p>
        )}
        <p className="flex items-start justify-center gap-1.5 text-center text-xs leading-relaxed text-[#455f65]">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#25564e]" aria-hidden="true" />
          Reviewed by Ben Dickinson in Midcoast Maine. No sales call required.
        </p>
      </form>
    </>
  );
}
