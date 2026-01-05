import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, MessageSquare, Image as ImageIcon } from "lucide-react";

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
          <DialogTitle>What kind of feedback?</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {/* Screenshot feedback - recommended */}
          <button
            onClick={() => {
              onSelectScreenshot();
              onOpenChange(false);
            }}
            className="flex items-start gap-4 p-4 rounded-lg border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-colors text-left"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Camera className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-foreground">Screenshot Feedback</span>
                <span className="text-[10px] font-medium text-primary bg-primary/20 px-1.5 py-0.5 rounded">
                  Recommended
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Capture or upload a screenshot, then click to pin your feedback to a specific spot.
              </p>
            </div>
          </button>

          {/* General comment */}
          <button
            onClick={() => {
              onSelectGeneral();
              onOpenChange(false);
            }}
            className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 hover:border-muted-foreground/30 transition-colors text-left"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-foreground">General Comment</span>
              <p className="text-sm text-muted-foreground mt-1">
                Leave a text comment without pinning to a specific location.
              </p>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
