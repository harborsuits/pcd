import { useState } from "react";
import { ChevronDown, ChevronUp, Bug } from "lucide-react";
import type { VisualKey } from "@/lib/visualTaxonomy";

interface VisualDebugInfo {
  visualKey: VisualKey;
  confidence: "exact" | "keyword" | "fallback";
  matchedOn?: string;
  usedFallback: boolean;
  heroImage: string;
  galleryImages: string[];
  inputs: {
    templateType?: string;
    category?: string;
    occupation?: string;
    businessName?: string;
    city?: string;
  };
}

interface VisualDebugBadgeProps {
  debugInfo: VisualDebugInfo;
}

/**
 * Dev-only debug badge that shows visual matching info
 * Enable via URL param: ?debugVisual=1
 */
export function VisualDebugBadge({ debugInfo }: VisualDebugBadgeProps) {
  const [expanded, setExpanded] = useState(false);

  // Only show in dev mode AND with URL param
  const urlParams = new URLSearchParams(window.location.search);
  const debugEnabled = import.meta.env.DEV || urlParams.get("debugVisual") === "1";
  
  if (!debugEnabled) return null;

  const confidenceColor = {
    exact: "bg-green-500",
    keyword: "bg-yellow-500",
    fallback: "bg-red-500",
  }[debugInfo.confidence];

  const getFileName = (path: string) => {
    const parts = path.split("/");
    return parts[parts.length - 1];
  };

  return (
    <div className="fixed bottom-3 left-3 z-[9999] rounded-lg border border-border bg-background/95 backdrop-blur-sm shadow-lg max-w-[360px] text-xs font-mono">
      {/* Collapsed header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 p-2 hover:bg-muted/50 rounded-lg transition-colors"
      >
        <Bug className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="font-semibold text-foreground">Visual Debug</span>
        <span className={`px-1.5 py-0.5 rounded text-white text-[10px] ${confidenceColor}`}>
          {debugInfo.confidence}
        </span>
        <span className="text-muted-foreground flex-1 text-left truncate">
          → {debugInfo.visualKey}
        </span>
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="p-3 pt-0 space-y-3 border-t border-border">
          {/* Key info */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <div className="text-muted-foreground">visualKey:</div>
            <div className="text-foreground font-medium">{debugInfo.visualKey}</div>
            
            <div className="text-muted-foreground">confidence:</div>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${confidenceColor}`} />
              <span className="text-foreground">{debugInfo.confidence}</span>
            </div>
            
            <div className="text-muted-foreground">matchedOn:</div>
            <div className="text-foreground">{debugInfo.matchedOn || "—"}</div>
            
            <div className="text-muted-foreground">usedFallback:</div>
            <div className={debugInfo.usedFallback ? "text-yellow-600" : "text-green-600"}>
              {debugInfo.usedFallback ? "yes" : "no"}
            </div>
          </div>

          {/* Inputs */}
          <div>
            <div className="text-muted-foreground mb-1 font-semibold">Inputs:</div>
            <div className="bg-muted/50 rounded p-2 space-y-0.5">
              {debugInfo.inputs.templateType && (
                <div><span className="text-muted-foreground">templateType:</span> {debugInfo.inputs.templateType}</div>
              )}
              {debugInfo.inputs.category && (
                <div><span className="text-muted-foreground">category:</span> {debugInfo.inputs.category}</div>
              )}
              {debugInfo.inputs.occupation && (
                <div><span className="text-muted-foreground">occupation:</span> {debugInfo.inputs.occupation}</div>
              )}
              {debugInfo.inputs.businessName && (
                <div><span className="text-muted-foreground">businessName:</span> {debugInfo.inputs.businessName}</div>
              )}
              {debugInfo.inputs.city && (
                <div><span className="text-muted-foreground">city:</span> {debugInfo.inputs.city}</div>
              )}
            </div>
          </div>

          {/* Hero */}
          <div>
            <div className="text-muted-foreground mb-1 font-semibold">Hero:</div>
            <div className="text-foreground break-all bg-muted/50 rounded p-2">
              {getFileName(debugInfo.heroImage)}
            </div>
          </div>

          {/* Gallery */}
          <div>
            <div className="text-muted-foreground mb-1 font-semibold">Gallery ({debugInfo.galleryImages.length}):</div>
            <div className="bg-muted/50 rounded p-2 space-y-0.5">
              {debugInfo.galleryImages.map((img, i) => (
                <div key={i} className="text-foreground break-all">• {getFileName(img)}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
