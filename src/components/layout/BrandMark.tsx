import wordmark from "@/assets/pcd-wave-wordmark.svg.asset.json";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return <img src={wordmark.url} alt="Pleasant Cove Design" width={680} height={280} className={`${compact ? "w-32 sm:w-40" : "w-40 sm:w-48"} aspect-[17/7] object-contain shrink-0`} />;
}