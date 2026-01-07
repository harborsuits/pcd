import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ExternalLink, Camera, Upload, Loader2, Maximize2, Minimize2, RefreshCw } from "lucide-react";

interface PreviewPanelProps {
  url: string;
  isScreenshotMode: boolean;
  screenshotImage: string | null;
  pinPosition: { x: number; y: number } | null;
  onCaptureScreenshot: () => void;
  onUploadScreenshot: (file: File) => void;
  onPinPlace: (x: number, y: number) => void;
  onExitScreenshotMode: () => void;
  isCapturing: boolean;
}

export function PreviewPanel({
  url,
  isScreenshotMode,
  screenshotImage,
  pinPosition,
  onCaptureScreenshot,
  onUploadScreenshot,
  onPinPlace,
  onExitScreenshotMode,
  isCapturing,
}: PreviewPanelProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isScreenshotMode || !screenshotImage) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onPinPlace(x, y);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onUploadScreenshot(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? "fixed inset-0 z-50 bg-background" : ""}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          {isScreenshotMode ? (
            <>
              <span className="text-sm font-medium text-primary">Screenshot Mode</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onExitScreenshotMode}
                className="h-7 text-xs"
              >
                Exit
              </Button>
            </>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCaptureScreenshot}
                    disabled={isCapturing}
                    className="h-7 text-xs gap-1.5"
                  >
                    {isCapturing ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Camera className="h-3 w-3" />
                    )}
                    Capture
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs max-w-[200px]">
                  Take a screenshot of your screen to leave pinned feedback
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-7 text-xs gap-1.5"
                  >
                    <Upload className="h-3 w-3" />
                    Upload
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Upload a screenshot image
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
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {!isScreenshotMode && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIframeKey(k => k + 1)}
                className="h-7 w-7 p-0"
                title="Refresh"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(url, "_blank")}
                className="h-7 w-7 p-0"
                title="Open in new tab"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-7 w-7 p-0"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 relative overflow-hidden bg-muted/20">
        {isScreenshotMode && screenshotImage ? (
          /* Screenshot viewer with pin placement */
          <div 
            className="w-full h-full overflow-auto cursor-crosshair"
            onClick={handleImageClick}
          >
            <div className="relative inline-block min-w-full">
              <img
                ref={imageRef}
                src={screenshotImage}
                alt="Screenshot for feedback"
                className="max-w-none"
                style={{ maxHeight: "none" }}
              />
              {/* Pin marker */}
              {pinPosition && (
                <div
                  className="absolute pointer-events-none z-10"
                  style={{
                    left: `${pinPosition.x}%`,
                    top: `${pinPosition.y}%`,
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
              {!pinPosition && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    Click to place your pin
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Live preview iframe */
          <iframe
            key={iframeKey}
            src={url}
            className="w-full h-full border-0"
            title="Site preview"
          />
        )}
      </div>
    </div>
  );
}
