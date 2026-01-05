import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Camera, MessageSquare, Upload, ImageIcon } from "lucide-react";

interface AddFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectScreenshot: () => void;
  onSelectGeneral: () => void;
}

export function AddFeedbackModal({
  open,
  onOpenChange,
  onSelectScreenshot,
  onSelectGeneral,
}: AddFeedbackModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Feedback</DialogTitle>
          <DialogDescription>
            How would you like to share your feedback?
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {/* Screenshot feedback - recommended */}
          <button
            onClick={() => {
              onSelectScreenshot();
              onOpenChange(false);
            }}
            className="group flex items-start gap-4 p-4 rounded-xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all text-left"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Camera className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-semibold text-foreground">Screenshot Feedback</span>
                <span className="text-[10px] font-semibold text-primary-foreground bg-primary px-2 py-0.5 rounded-full">
                  Recommended
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Upload a screenshot, click to place a pin, then describe what you'd like changed.
              </p>
              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Upload className="h-3 w-3" />
                  Upload
                </span>
                <span>→</span>
                <span className="flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  Pin
                </span>
                <span>→</span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  Describe
                </span>
              </div>
            </div>
          </button>

          {/* General comment */}
          <button
            onClick={() => {
              onSelectGeneral();
              onOpenChange(false);
            }}
            className="flex items-start gap-4 p-4 rounded-xl border border-border hover:bg-muted/50 hover:border-muted-foreground/30 transition-all text-left"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-foreground">General Comment</span>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Leave a text comment without pinning to a specific location on the page.
              </p>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
