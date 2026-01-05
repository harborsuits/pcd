import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapPin, Loader2 } from "lucide-react";

interface ScreenshotViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screenshotUrl: string;
  pinX: number;
  pinY: number;
  commentBody: string;
  commentIndex: number;
}

export function ScreenshotViewer({
  open,
  onOpenChange,
  screenshotUrl,
  pinX,
  pinY,
  commentBody,
  commentIndex,
}: ScreenshotViewerProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
              {commentIndex + 1}
            </span>
            Screenshot Feedback
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto min-h-0">
          <div className="relative">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            
            <img
              src={screenshotUrl}
              alt="Screenshot with feedback"
              className={`w-full h-auto rounded-lg border border-border transition-opacity ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setImageLoaded(true)}
            />
            
            {/* Pin marker */}
            {imageLoaded && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: `${pinX}%`,
                  top: `${pinY}%`,
                  transform: "translate(-50%, -100%)",
                }}
              >
                <div className="relative">
                  <MapPin className="h-8 w-8 text-primary drop-shadow-lg" fill="currentColor" />
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary-foreground rounded-full" />
                </div>
              </div>
            )}
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
