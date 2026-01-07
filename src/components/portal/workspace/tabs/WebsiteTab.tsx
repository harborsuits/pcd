import { useState, useRef, useCallback } from "react";
import { Clock, ExternalLink, RefreshCw, Camera, Upload, Loader2, X, Send, Paperclip, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { VersionsList, type Version } from "../VersionsList";
import { captureTab, isTabCaptureSupported, type CaptureError } from "@/lib/tabCapture";

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

type FeedbackMode = 
  | { type: "preview" }
  | { type: "screenshot"; image: string; imageW: number; imageH: number; pin: { x: number; y: number } | null };

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
  
  const selectedId = selectedVersionId ?? internalSelectedId;
  const handleSelect = onSelectVersion ?? setInternalSelectedId;
  
  const selectedVersion = versions.find(v => v.id === selectedId);
  const canTabCapture = isTabCaptureSupported();

  // Capture screenshot using browser tab capture
  const handleCaptureScreenshot = useCallback(async () => {
    if (!canTabCapture) {
      toast.error("Screen capture not supported. Please upload a screenshot.");
      return;
    }

    setIsCapturing(true);
    try {
      const result = await captureTab();
      setMode({
        type: "screenshot",
        image: result.dataUrl,
        imageW: result.width,
        imageH: result.height,
        pin: null,
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
        setMode({
          type: "screenshot",
          image: e.target?.result as string,
          imageW: img.naturalWidth,
          imageH: img.naturalHeight,
          pin: null,
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

  // Handle pin placement on screenshot
  const handlePinPlace = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode.type !== "screenshot") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMode(prev => prev.type === "screenshot" ? { ...prev, pin: { x, y } } : prev);
  };

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

  // Submit feedback
  const handleSubmitFeedback = async () => {
    if (mode.type !== "screenshot" || !mode.pin || !commentText.trim() || !selectedVersion) return;

    setIsSubmitting(true);
    try {
      // Convert base64 to blob and upload
      const response = await fetch(mode.image);
      const blob = await response.blob();
      const { mediaId, path } = await uploadScreenshot(blob);

      // Create comment with screenshot
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
            pin_x: mode.pin.x,
            pin_y: mode.pin.y,
            author_type: "client",
            screenshot_media_id: mediaId,
            screenshot_path: path,
            screenshot_w: mode.imageW,
            screenshot_h: mode.imageH,
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
                  {mode.type === "screenshot" ? (
                    <>
                      <span className="text-sm font-medium text-primary">Screenshot Mode</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={exitScreenshotMode}
                        className="h-7 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Exit
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
                            Take a screenshot, place a pin, and tell us what you'd like changed
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
              <div className="flex-1 bg-muted/20 overflow-hidden">
                {mode.type === "screenshot" && mode.image ? (
                  /* Screenshot viewer with pin placement */
                  <div 
                    className="w-full h-full overflow-auto cursor-crosshair"
                    onClick={handlePinPlace}
                  >
                    <div className="relative inline-block min-w-full">
                      <img
                        src={mode.image}
                        alt="Screenshot for feedback"
                        className="max-w-none"
                        style={{ maxHeight: "none" }}
                      />
                      {/* Pin marker */}
                      {mode.pin && (
                        <div
                          className="absolute pointer-events-none z-10"
                          style={{
                            left: `${mode.pin.x}%`,
                            top: `${mode.pin.y}%`,
                            transform: "translate(-50%, -100%)",
                          }}
                        >
                          <div className="relative">
                            <div className="w-6 h-6 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                              <span className="text-[10px] font-bold text-primary-foreground">1</span>
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-primary" />
                          </div>
                        </div>
                      )}
                      {/* Click hint */}
                      {!mode.pin && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-medium">
                            Click to place your pin on what you want changed
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
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

      {/* Bottom: Comment composer when pin is placed */}
      {mode.type === "screenshot" && mode.pin && (
        <div className="flex-shrink-0 p-4 border-t border-border bg-background">
          {/* Screenshot preview with pin */}
          <div className="mb-3 flex items-start gap-3">
            <div className="relative inline-block rounded-lg overflow-hidden border border-border flex-shrink-0">
              <img
                src={mode.image}
                alt="Screenshot preview"
                className="h-16 w-auto object-contain"
              />
              <div
                className="absolute w-3 h-3 bg-primary rounded-full border border-white shadow"
                style={{
                  left: `${mode.pin.x}%`,
                  top: `${mode.pin.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => setMode(prev => prev.type === "screenshot" ? { ...prev, pin: null } : prev)}
            >
              <MapPin className="h-3 w-3 mr-1" />
              Move pin
            </Button>
          </div>

          {/* Comment input */}
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="What would you like changed? (e.g., 'Change this logo to...' or 'Make this text larger')"
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
                Attach file (e.g., logo you want)
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
