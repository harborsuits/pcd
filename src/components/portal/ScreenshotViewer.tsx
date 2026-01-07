import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Maximize2 } from "lucide-react";

interface ScreenshotViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The cropped screenshot URL (what shows in the card) */
  screenshotUrl: string;
  /** The full screenshot URL (if available, for context view) */
  fullScreenshotUrl?: string;
  /** Crop region as percentages (0-1) */
  cropX?: number | null;
  cropY?: number | null;
  cropW?: number | null;
  cropH?: number | null;
  /** Legacy pin coordinates (for old pin-based comments) */
  pinX?: number | null;
  pinY?: number | null;
  commentBody: string;
  commentIndex: number;
}

export function ScreenshotViewer({
  open,
  onOpenChange,
  screenshotUrl,
  fullScreenshotUrl,
  cropX,
  cropY,
  cropW,
  cropH,
  pinX,
  pinY,
  commentBody,
  commentIndex,
}: ScreenshotViewerProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showFull, setShowFull] = useState(false);

  const hasCrop = cropW != null && cropH != null && cropW > 0 && cropH > 0;
  const hasPin = pinX != null && pinY != null;
  const hasFullScreenshot = !!fullScreenshotUrl;

  // Reset state when modal closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setShowFull(false);
      setImageLoaded(false);
    }
    onOpenChange(isOpen);
  };

  // Decide which image to show
  const displayUrl = showFull && hasFullScreenshot ? fullScreenshotUrl : screenshotUrl;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                {commentIndex + 1}
              </span>
              <span>
                {hasCrop ? "Snip Feedback" : hasPin ? "Pinned Feedback" : "Screenshot Feedback"}
              </span>
            </div>
            
            {/* Toggle between cropped and full view */}
            {hasFullScreenshot && hasCrop && (
              <button
                onClick={() => setShowFull(!showFull)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                {showFull ? "Show Snip" : "Show Full Context"}
              </button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto min-h-0">
          <div className="relative">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            
            <div className="relative inline-block w-full">
              <img
                src={displayUrl}
                alt="Screenshot with feedback"
                className={`w-full h-auto rounded-lg border border-border transition-opacity ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setImageLoaded(true)}
              />
              
              {/* Show crop region overlay when viewing full screenshot */}
              {imageLoaded && showFull && hasCrop && (
                <>
                  {/* Darken area outside the crop */}
                  <div 
                    className="absolute inset-0 pointer-events-none rounded-lg"
                    style={{
                      background: `
                        linear-gradient(to right, rgba(0,0,0,0.5) ${(cropX || 0) * 100}%, transparent ${(cropX || 0) * 100}%),
                        linear-gradient(to left, rgba(0,0,0,0.5) ${100 - ((cropX || 0) + (cropW || 0)) * 100}%, transparent ${100 - ((cropX || 0) + (cropW || 0)) * 100}%),
                        linear-gradient(to bottom, rgba(0,0,0,0.5) ${(cropY || 0) * 100}%, transparent ${(cropY || 0) * 100}%),
                        linear-gradient(to top, rgba(0,0,0,0.5) ${100 - ((cropY || 0) + (cropH || 0)) * 100}%, transparent ${100 - ((cropY || 0) + (cropH || 0)) * 100}%)
                      `
                    }}
                  />
                  
                  {/* Crop region highlight border */}
                  <div
                    className="absolute border-2 border-primary pointer-events-none"
                    style={{
                      left: `${(cropX || 0) * 100}%`,
                      top: `${(cropY || 0) * 100}%`,
                      width: `${(cropW || 0) * 100}%`,
                      height: `${(cropH || 0) * 100}%`,
                    }}
                  >
                    {/* Corner dots */}
                    <div className="absolute -top-1 -left-1 w-2 h-2 bg-primary rounded-full" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary rounded-full" />
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                  </div>
                </>
              )}
              
              {/* Legacy pin marker (for old pin-based comments without crop) */}
              {imageLoaded && !showFull && !hasCrop && hasPin && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: `${pinX}%`,
                    top: `${pinY}%`,
                    transform: "translate(-50%, -100%)",
                  }}
                >
                  <div className="relative">
                    <div className="w-6 h-6 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                      <span className="text-primary-foreground text-xs font-bold">{commentIndex + 1}</span>
                    </div>
                    {/* Pin tail */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-primary" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comment preview */}
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm">{commentBody}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}