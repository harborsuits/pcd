# Homepage presentation
- Homepage prices and service scopes come from the shared pricing menu, never from a separate display catalog, so inquiries and public pricing stay aligned.
- PCD public and compact entry shells share the authentic wave wordmark and marketing footer; sample wrappers remain separate from business-specific and tokenized workspaces to preserve their identity.
- Uploaded brand media and captured public-client screenshots use CDN asset pointers; preserve original logo geometry rather than redrawing it.
- Keep contact-form wrapper components at module scope so state updates preserve DOM identity, focus, and disclosure state.
- Lazy-load OperatorLayout and static samples behind a module-scope branded Suspense fallback; leave auth providers, guards and token workspace routing eager to avoid session behavior changes.
- Route head metadata (title, description, canonical, robots, JSON-LD) is applied by `src/lib/headManager.ts` via SEOHead, not react-helmet-async, because Helmet 2.x does not update the head under React 19.
- Marketing & Ads inquiries submit as service_type "other" with a fixed "Inquiry type: Marketing & Ads campaign" line in custom_request, because the leads backend has no marketing enum.
