import { BrandMark } from "./BrandMark";

export function RouteLoading() {
  return <div className="pcd-shell min-h-screen bg-page-bg text-foreground flex flex-col items-center justify-center gap-4 px-6" role="status" aria-live="polite"><BrandMark /><p>Loading page…</p></div>;
}