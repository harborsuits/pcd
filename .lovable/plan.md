# Faster inquiries, one consistent sign-in

Two goals: a curious visitor can ask about a project in under a minute, and every sign-in screen looks and behaves the same.

## 1. One short inquiry form

`/get-demo` becomes a single screen for everyone, no matter which button they arrived from:

1. What do you need? (see a demo site, a new website, AI phone answering, help with my current site, something else)
2. Business name
3. Where you serve customers
4. Your name
5. Email
6. Phone (optional)
7. One box: "Anything you want us to know?" (optional)

Required: what you need, business name, email. Everything else is optional, including phone.

Under the form: "Rather just talk? Call (207) 380-5680" and the existing free-site-review link.

The "see a demo site" choice still generates the instant preview exactly as it does now, because it already collects everything the generator needs.

Everything currently asked before submission goes away from this form: package/tier selection, budget, new-site vs existing-site track, content, links, hours, design, features, platform, access, access checklist, and all eight AI receptionist screens.

## 2. Deposit screen removed from inquiries

The "Secure Your Project — 50% deposit" step is taken out of the inquiry flow. Submitting now ends on a short confirmation: what was received, that a written proposal follows, and a link to the portal. Deposits stay exactly as they are today and are requested from the portal once scope is agreed — no payment code changes.

## 3. The detailed questions move, not disappear

All the detail the current form collects is still needed to build a site, so it moves into the client portal as an after-you're-a-customer step, reachable from the project workspace and completed at the customer's own pace with progress saved. Nothing is thrown away.

For this first pass the portal reuses the existing detailed screens rather than redesigning them, so the long questionnaire still exists — just after the relationship starts instead of before it.

## 4. One sign-in experience

Today there are four different sign-in/sign-up screens: the portal hub, the project portal, and two demo-claim popups. Only the hub offers Google.

A single shared sign-in component is built from the hub's version (which already works) and used in all four places, giving everyone:

- Google sign-in and email + password
- The same wording, button order, and error messages
- The same "forgot password" link and the same "this email already has an account — log in instead" handling
- The same password reset behaviour

The popups keep being popups and the pages keep being pages; only the inner form is shared.

Account behaviour, project ownership, verification codes, and access rules are unchanged.

## Technical notes

- `src/pages/IntakeWizard.tsx`: collapse to the single-step form; keep the `?service=` and `?tier=` handling so existing links and the free-review mode keep working, and keep sending the same `request-demo` payload with the now-optional fields omitted. Remove the `deposit` step from `getSteps()`.
- New `src/components/auth/AuthForm.tsx` extracted from `PortalHub.tsx` (including its `signInWithOAuth` Google call and recovery handling); consumed by `PortalHub`, `PortalAuthPage`, `ClaimAuthModal`, and `ClaimDesignModal`.
- Detailed intake screens are relocated into the portal workspace; the wizard's step components are reused as-is.
- No changes to Stripe, deposits, billing, edge-function auth, or RLS.

## Verification

Desktop and 390px mobile: submit an inquiry with only the required fields, submit one with everything filled, run the demo path end to end, then sign in and sign up from all four screens including Google and forgot-password.
