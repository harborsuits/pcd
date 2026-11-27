import { useEffect } from "react";

/**
 * Minimal document-head manager. react-helmet-async 2.x does not update the head
 * under React 19, so route metadata is applied directly here. Every managed node
 * carries data-rh so static fallbacks in index.html are replaced, never duplicated.
 */
export interface HeadSpec {
  title?: string;
  meta?: { name?: string; property?: string; content: string }[];
  canonical?: string | null;
  robots?: string | null;
  jsonLd?: unknown;
}

const MANAGED = "data-rh";

function upsertMeta(key: "name" | "property", value: string, content: string) {
  const nodes = Array.from(document.head.querySelectorAll<HTMLMetaElement>(`meta[${key}="${value}"]`));
  const [first, ...dupes] = nodes;
  dupes.forEach((n) => n.remove());
  const el = first ?? document.head.appendChild(document.createElement("meta"));
  el.setAttribute(key, value);
  el.setAttribute("content", content);
  el.setAttribute(MANAGED, "true");
}

export function applyHead(spec: HeadSpec) {
  if (spec.title !== undefined) document.title = spec.title;
  spec.meta?.forEach((m) => {
    if (m.name) upsertMeta("name", m.name, m.content);
    else if (m.property) upsertMeta("property", m.property, m.content);
  });
  if (spec.canonical === null) {
    document.head.querySelectorAll('link[rel="canonical"]').forEach((n) => n.remove());
  } else if (spec.canonical !== undefined) {
    const links = Array.from(document.head.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]'));
    links.slice(1).forEach((n) => n.remove());
    const link = links[0] ?? document.head.appendChild(document.createElement("link"));
    link.rel = "canonical";
    link.href = spec.canonical;
    link.setAttribute(MANAGED, "true");
  }
  if (spec.robots !== undefined) {
    document.head.querySelectorAll('meta[name="robots"]').forEach((n) => n.remove());
    if (spec.robots) upsertMeta("name", "robots", spec.robots);
  }
  if (spec.jsonLd !== undefined) {
    document.head.querySelectorAll('script[type="application/ld+json"]').forEach((n) => n.remove());
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute(MANAGED, "true");
    script.textContent = JSON.stringify(spec.jsonLd);
    document.head.appendChild(script);
  }
}

export function useHead(spec: HeadSpec, key: string) {
  useEffect(() => {
    applyHead(spec);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

/** Marks a private/utility screen noindex for as long as it is mounted. */
export function NoIndex() {
  useEffect(() => {
    applyHead({ robots: "noindex, nofollow" });
    return () => applyHead({ robots: null });
  }, []);
  return null;
}
