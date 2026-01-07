import { useState, useRef, useCallback } from "react";
import { Clock, ExternalLink, RefreshCw, Camera, Upload, Loader2, X, Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { VersionsList, type Version } from "../VersionsList";
import { CropSelector } from "../CropSelector";
import { captureTabCropped, isTabCaptureSupported, type CaptureError } from "@/lib/tabCapture";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface WebsiteTabProps {
  versions: Version[];
  intakeStatus: 'draft' | 'submitted' | 'approved' | null;
  hasVersions: boolean;
  selectedVersionId?: string;
  onSelectVersion?: (id: string) => void;
  token: string;
  onRefreshComments?: () => void;
}

interface CropSelection {
  x: number;
  y: number;
  w: number;
  h: number;
}

type FeedbackMode = 
  | { type: "preview" }
  | { type: "cropping"; fullImage: string; fullImageW: number; fullImageH: number }
  | { type: "compose"; fullImage: string; fullImageW: number; fullImageH: number; crop: CropSelection; croppedImage: string };

export function WebsiteTab({
  versions,
  intakeStatus,
  hasVersions,
  selectedVersionId,
  onSelectVersion,
  token,
  onRefreshComments,
}: WebsiteTabProps) {
  const [internalSelectedId, setInternalSelectedId] = useState<string | undefined>(
    versions[0]?.id
  );
  const [iframeKey, setIframeKey] = useState(0);
  const [mode, setMode] = useState<FeedbackMode>({ type: "preview" });
  const [isCapturing, setIsCapturing] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  
  const selectedId = selectedVersionId ?? internalSelectedId;
  const handleSelect = onSelectVersion ?? setInternalSelectedId;
  
  const selectedVersion = versions.find(v => v.id === selectedId);
  const canTabCapture = isTabCaptureSupported();

  // Capture screenshot using browser tab capture (auto-crops to preview area)
  const handleCaptureScreenshot = useCallback(async () => {
    if (!canTabCapture) {
      toast.error("Screen capture not supported. Please upload a screenshot.");
      return;
    }

    setIsCapturing(true);
    try {
      // Pass the preview container ref to auto-crop to just the iframe area
      const result = await captureTabCropped(previewContainerRef.current ?? undefined);
      // Go straight to cropping mode
      setMode({
        type: "cropping",
        fullImage: result.dataUrl,
        fullImageW: result.width,
        fullImageH: result.height,
      });
    } catch (err) {
      const captureErr = err as CaptureError;
      if (captureErr.type === "cancelled") {
        return;
      }
      console.error("Screenshot capture failed:", captureErr);
      toast.error(captureErr.message || "Screenshot capture failed. Please upload instead.");
    } finally {
      setIsCapturing(false);
    }
  }, [canTabCapture]);

  // Handle file upload for screenshot
  const handleUploadScreenshot = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Go to cropping mode with uploaded image
        setMode({
          type: "cropping",
          fullImage: e.target?.result as string,
          fullImageW: img.naturalWidth,
          fullImageH: img.naturalHeight,
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleUploadScreenshot(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle crop selection confirmed
  const handleCropConfirm = useCallback((selection: CropSelection, croppedDataUrl: string) => {
    if (mode.type !== "cropping") return;
    setMode({
      type: "compose",
      fullImage: mode.fullImage,
      fullImageW: mode.fullImageW,
      fullImageH: mode.fullImageH,
      crop: selection,
      croppedImage: croppedDataUrl,
    });
  }, [mode]);

  // Handle attachment selection
  const handleAttachmentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
    if (attachInputRef.current) attachInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Upload screenshot to storage
  const uploadScreenshot = async (blob: Blob): Promise<{ mediaId: string; path: string }> => {
    const formData = new FormData();
    formData.append("file", blob, `screenshot-${Date.now()}.png`);

    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/portal/${token}/media`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: formData,
      }
    );

    if (!res.ok) throw new Error("Failed to upload screenshot");
    const data = await res.json();
    return { mediaId: data.media_id, path: data.path };
  };

  // Submit feedback with snip (cropped region)
  const handleSubmitFeedback = async () => {
    if (mode.type !== "compose" || !commentText.trim() || !selectedVersion) return;

    setIsSubmitting(true);
    try {
      // Upload the cropped image (this becomes the main screenshot_path)
      const croppedResponse = await fetch(mode.croppedImage);
      const croppedBlob = await croppedResponse.blob();
      const { mediaId, path } = await uploadScreenshot(croppedBlob);

      // Optionally upload full screenshot for context
      const fullResponse = await fetch(mode.fullImage);
      const fullBlob = await fullResponse.blob();
      const fullUpload = await uploadScreenshot(fullBlob);

      // Create comment with cropped screenshot + crop coordinates
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/portal/${token}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            action: "create",
            prototype_id: selectedVersion.id,
            body: commentText.trim(),
            author_type: "client",
            // Cropped image is the main screenshot
            screenshot_media_id: mediaId,
            screenshot_path: path,
            screenshot_w: Math.round(mode.crop.w * mode.fullImageW),
            screenshot_h: Math.round(mode.crop.h * mode.fullImageH),
            // Store full screenshot and crop coordinates
            screenshot_full_path: fullUpload.path,
            crop_x: mode.crop.x,
            crop_y: mode.crop.y,
            crop_w: mode.crop.w,
            crop_h: mode.crop.h,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to create comment");

      toast.success("Feedback submitted!");
      setMode({ type: "preview" });
      setCommentText("");
      setAttachments([]);
      onRefreshComments?.();
    } catch (err) {
      console.error("Submit feedback failed:", err);
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const exitScreenshotMode = () => {
    setMode({ type: "preview" });
    setCommentText("");
    setAttachments([]);
  };

  // No versions yet - show waiting state
  if (!hasVersions) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Clock className="h-8 w-8 text-primary" />
        </div>
        <h2 className="font-serif text-xl font-bold mb-2">
          Your first preview is being built
        </h2>
        <p className="text-muted-foreground max-w-md mb-4">
          We're working on your website. You'll see the first preview here once it's ready — usually within 24–48 hours.
        </p>
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200">
          {intakeStatus === 'approved' ? 'Build in progress' : 'Under review'}
        </Badge>
      </div>
    );
  }

  // Has versions - show version selector + preview
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex min-h-0">
        {/* Left: Version list */}
        <div className="w-48 border-r border-border flex-shrink-0 overflow-y-auto">
          <VersionsList
            versions={versions}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        </div>
        
        {/* Right: Preview or Screenshot mode */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedVersion && (
            <>
              {/* Preview header with feedback tools */}
              <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  {mode.type !== "preview" ? (
                    <>
                      <span className="text-sm font-medium text-primary">
                        {mode.type === "cropping" ? "Select Area" : "Add Comment"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={exitScreenshotMode}
                        className="h-7 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <div>
                        <h3 className="font-medium text-sm">Preview</h3>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {selectedVersion.url}
                        </p>
                      </div>
                      <div className="h-6 w-px bg-border" />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCaptureScreenshot}
                              disabled={isCapturing}
                              className="h-8 text-xs gap-1.5"
                            >
                              {isCapturing ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Camera className="h-3.5 w-3.5" />
                              )}
                              Capture Feedback
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs max-w-[220px]">
                            Take a screenshot and select the area you want changed
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              className="h-8 text-xs gap-1.5"
                            >
                              <Upload className="h-3.5 w-3.5" />
                              Upload
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">
                            Upload a screenshot to leave feedback
                          </TooltipContent>
                        </Tooltip>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </TooltipProvider>
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {mode.type === "preview" && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIframeKey(k => k + 1)}
                        title="Refresh preview"
                        className="h-8 w-8"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(selectedVersion.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open in new tab
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              {/* Content area */}
              <div ref={previewContainerRef} className="flex-1 bg-muted/20 overflow-hidden">
                {mode.type === "cropping" ? (
                  /* Crop selector for snip-first feedback */
                  <CropSelector
                    imageDataUrl={mode.fullImage}
                    onConfirm={handleCropConfirm}
                    onCancel={exitScreenshotMode}
                  />
                ) : (
                  /* Live preview iframe */
                  <iframe
                    key={iframeKey}
                    src={selectedVersion.url}
                    className="w-full h-full border-0"
                    title="Website preview"
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom: Comment composer when crop is selected */}
      {mode.type === "compose" && (
        <div className="flex-shrink-0 p-4 border-t border-border bg-background">
          {/* Cropped preview */}
          <div className="mb-3 flex items-start gap-3">
            <div className="relative inline-block rounded-lg overflow-hidden border border-border flex-shrink-0 bg-muted">
              <img
                src={mode.croppedImage}
                alt="Selected area"
                className="h-20 w-auto object-contain"
              />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Selected area to change:</p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setMode({ 
                  type: "cropping", 
                  fullImage: mode.fullImage, 
                  fullImageW: mode.fullImageW, 
                  fullImageH: mode.fullImageH 
                })}
              >
                Re-select area
              </Button>
            </div>
          </div>

          {/* Comment input */}
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="What would you like changed? (e.g., 'Replace this logo with...' or 'Make this text larger')"
            className="min-h-[80px] resize-none mb-3"
            autoFocus
          />

          {/* Attachments preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="relative group flex items-center gap-2 px-2 py-1 rounded bg-muted text-xs"
                >
                  <Paperclip className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate max-w-[100px]">{file.name}</span>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                ref={attachInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleAttachmentSelect}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => attachInputRef.current?.click()}
              >
                <Paperclip className="h-3.5 w-3.5" />
                Attach file (e.g., new logo)
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={exitScreenshotMode}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSubmitFeedback}
                disabled={!commentText.trim() || isSubmitting}
                className="gap-1.5"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Submit Feedback
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
