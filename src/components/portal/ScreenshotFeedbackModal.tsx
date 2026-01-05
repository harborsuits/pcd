import { useState, useRef, useCallback } from "react";
import html2canvas from "html2canvas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Upload, X, Loader2, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ScreenshotFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prototypeId: string;
  token: string;
  pageUrl?: string;
  onSubmit: (data: {
    body: string;
    screenshotPath: string;
    pinX: number;
    pinY: number;
    screenshotW: number;
    screenshotH: number;
  }) => Promise<void>;
  captureTarget?: HTMLElement | null;
}

export function ScreenshotFeedbackModal({
  open,
  onOpenChange,
  prototypeId,
  token,
  pageUrl,
  onSubmit,
  captureTarget,
}: ScreenshotFeedbackModalProps) {
  const [step, setStep] = useState<"capture" | "pin" | "compose">("capture");
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [screenshotBlob, setScreenshotBlob] = useState<Blob | null>(null);
  const [screenshotDimensions, setScreenshotDimensions] = useState<{ w: number; h: number } | null>(null);
  const [pinPosition, setPinPosition] = useState<{ x: number; y: number } | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

  // Reset state when modal closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setStep("capture");
      setScreenshotDataUrl(null);
      setScreenshotBlob(null);
      setScreenshotDimensions(null);
      setPinPosition(null);
      setCommentText("");
    }
    onOpenChange(newOpen);
  };

  // Capture screenshot using html2canvas
  const handleCapture = useCallback(async () => {
    if (!captureTarget) {
      toast({
        title: "Cannot capture",
        description: "No target element to capture. Please use file upload instead.",
        variant: "destructive",
      });
      return;
    }

    setIsCapturing(true);
    try {
      const canvas = await html2canvas(captureTarget, {
        useCORS: true,
        allowTaint: true,
        logging: false,
        scale: 1, // Use 1x scale for reasonable file sizes
        backgroundColor: "#ffffff",
      });

      const dataUrl = canvas.toDataURL("image/png");
      setScreenshotDataUrl(dataUrl);
      setScreenshotDimensions({ w: canvas.width, h: canvas.height });

      // Convert to blob for upload
      canvas.toBlob((blob) => {
        if (blob) {
          setScreenshotBlob(blob);
          setStep("pin");
        }
      }, "image/png");
    } catch (error) {
      console.error("Screenshot capture failed:", error);
      toast({
        title: "Capture failed",
        description: "Could not capture the preview. Try uploading a screenshot instead.",
        variant: "destructive",
      });
    } finally {
      setIsCapturing(false);
    }
  }, [captureTarget]);

  // Handle file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setScreenshotDataUrl(dataUrl);

      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        setScreenshotDimensions({ w: img.width, h: img.height });
      };
      img.src = dataUrl;

      setScreenshotBlob(file);
      setStep("pin");
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // Handle pin placement click
  const handleImageClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();
    
    // Calculate click position as percentage of image dimensions
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setPinPosition({ x, y });
    setStep("compose");
  }, []);

  // Submit the feedback
  const handleSubmit = useCallback(async () => {
    if (!screenshotBlob || !pinPosition || !commentText.trim()) {
      toast({
        title: "Missing information",
        description: "Please add a comment before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload screenshot to storage
      const formData = new FormData();
      formData.append("file", screenshotBlob, `screenshot-${Date.now()}.png`);
      formData.append("prototype_id", prototypeId);
      
      const uploadRes = await fetch(
        `${SUPABASE_URL}/functions/v1/portal/${token}/screenshot`,
        { method: "POST", body: formData }
      );

      if (!uploadRes.ok) {
        throw new Error("Failed to upload screenshot");
      }

      const { path: screenshotPath } = await uploadRes.json();

      // Submit the comment with screenshot data
      await onSubmit({
        body: commentText.trim(),
        screenshotPath,
        pinX: pinPosition.x,
        pinY: pinPosition.y,
        screenshotW: screenshotDimensions?.w ?? 0,
        screenshotH: screenshotDimensions?.h ?? 0,
      });

      toast({
        title: "Feedback submitted",
        description: "Your screenshot feedback has been added.",
      });

      handleOpenChange(false);
    } catch (error) {
      console.error("Submit failed:", error);
      toast({
        title: "Submission failed",
        description: "Could not submit your feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [screenshotBlob, pinPosition, commentText, prototypeId, token, screenshotDimensions, onSubmit, SUPABASE_URL]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === "capture" && "Capture Screenshot"}
            {step === "pin" && "Click to Place Pin"}
            {step === "compose" && "Add Your Comment"}
          </DialogTitle>
          <DialogDescription>
            {step === "capture" && "Take a screenshot of the preview or upload one."}
            {step === "pin" && "Click on the screenshot where you want to place your feedback pin."}
            {step === "compose" && "Describe the issue or feedback for this location."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto min-h-0">
          {step === "capture" && (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <div className="flex gap-4">
                <Button
                  size="lg"
                  onClick={handleCapture}
                  disabled={isCapturing || !captureTarget}
                >
                  {isCapturing ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5 mr-2" />
                  )}
                  Capture Preview
                </Button>
                
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Screenshot
                </Button>
              </div>
              
              {!captureTarget && (
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Auto-capture may not work with cross-origin content. 
                  You can take a screenshot manually and upload it.
                </p>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          )}

          {(step === "pin" || step === "compose") && screenshotDataUrl && (
            <div className="relative">
              <img
                ref={imageRef}
                src={screenshotDataUrl}
                alt="Screenshot"
                className={`w-full h-auto rounded-lg border border-border ${
                  step === "pin" ? "cursor-crosshair" : ""
                }`}
                onClick={step === "pin" ? handleImageClick : undefined}
              />
              
              {/* Pin marker */}
              {pinPosition && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: `${pinPosition.x}%`,
                    top: `${pinPosition.y}%`,
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
          )}

          {step === "compose" && (
            <div className="mt-4 space-y-4">
              <Textarea
                placeholder="Describe the issue or feedback..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[100px]"
                autoFocus
              />
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !commentText.trim()}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Submit Feedback
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setPinPosition(null);
                    setStep("pin");
                  }}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Move Pin
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => handleOpenChange(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 pt-4 border-t border-border">
          <div className={`w-2 h-2 rounded-full ${step === "capture" ? "bg-primary" : "bg-muted"}`} />
          <div className={`w-2 h-2 rounded-full ${step === "pin" ? "bg-primary" : "bg-muted"}`} />
          <div className={`w-2 h-2 rounded-full ${step === "compose" ? "bg-primary" : "bg-muted"}`} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
