import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Crop, X, Check } from "lucide-react";
import { toast } from "sonner";

interface CropSelection {
  x: number; // percentage 0-1
  y: number; // percentage 0-1
  w: number; // percentage 0-1
  h: number; // percentage 0-1
}

interface CropSelectorProps {
  imageDataUrl: string;
  onConfirm: (selection: CropSelection, croppedDataUrl: string) => void;
  onCancel: () => void;
}

const MIN_SELECTION_PCT = 0.02; // 2% minimum

export function CropSelector({ imageDataUrl, onConfirm, onCancel }: CropSelectorProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [selection, setSelection] = useState<CropSelection | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Get relative position within the IMAGE element (not container)
  const getRelativePosition = useCallback((e: React.MouseEvent | MouseEvent): { x: number; y: number } | null => {
    if (!imageRef.current) return null;
    const rect = imageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    return { x, y };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const pos = getRelativePosition(e);
    if (!pos) return;
    
    setIsDrawing(true);
    setStartPoint(pos);
    setSelection({ x: pos.x, y: pos.y, w: 0, h: 0 });
  }, [getRelativePosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDrawing || !startPoint) return;
    
    const pos = getRelativePosition(e);
    if (!pos) return;

    // Calculate selection rectangle (handle dragging in any direction)
    const x = Math.min(startPoint.x, pos.x);
    const y = Math.min(startPoint.y, pos.y);
    const w = Math.abs(pos.x - startPoint.x);
    const h = Math.abs(pos.y - startPoint.y);

    setSelection({ x, y, w, h });
  }, [isDrawing, startPoint, getRelativePosition]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    // Check minimum size
    if (selection && (selection.w < MIN_SELECTION_PCT || selection.h < MIN_SELECTION_PCT)) {
      toast.error("Selection too small. Please draw a larger area.");
      setSelection(null);
    }
  }, [isDrawing, selection]);

  // Global mouse events for smooth dragging
  useEffect(() => {
    if (isDrawing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDrawing, handleMouseMove, handleMouseUp]);

  // Escape key to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selection) {
          setSelection(null);
        } else {
          onCancel();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selection, onCancel]);

  // Generate cropped image and confirm
  const handleConfirm = useCallback(async () => {
    if (!selection || !imageRef.current) return;
    
    if (selection.w < MIN_SELECTION_PCT || selection.h < MIN_SELECTION_PCT) {
      toast.error("Selection too small. Please draw a larger area.");
      return;
    }

    // Create canvas with cropped region
    const img = imageRef.current;
    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;

    const sx = Math.round(selection.x * naturalW);
    const sy = Math.round(selection.y * naturalH);
    const sw = Math.max(1, Math.round(selection.w * naturalW));
    const sh = Math.max(1, Math.round(selection.h * naturalH));

    const canvas = document.createElement("canvas");
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    const croppedDataUrl = canvas.toDataURL("image/png", 1.0);

    onConfirm(selection, croppedDataUrl);
  }, [selection, onConfirm]);

  const hasValidSelection = selection && selection.w >= MIN_SELECTION_PCT && selection.h >= MIN_SELECTION_PCT;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Crop className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Select the area you want to change</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button 
            size="sm" 
            onClick={handleConfirm}
            disabled={!hasValidSelection}
          >
            <Check className="h-4 w-4 mr-1" />
            Continue
          </Button>
        </div>
      </div>

      {/* Image with crop overlay - overlay is positioned relative to image */}
      <div className="flex-1 relative overflow-auto bg-black/90 flex items-center justify-center p-4">
        <div className="relative inline-block">
          <img
            ref={imageRef}
            src={imageDataUrl}
            alt="Screenshot to crop"
            className="max-h-[70vh] w-auto max-w-full object-contain select-none"
            style={{ cursor: "crosshair" }}
            onMouseDown={handleMouseDown}
            onLoad={() => setImageLoaded(true)}
            draggable={false}
          />
          
          {/* Overlay positioned on the image element */}
          {imageLoaded && selection && selection.w > 0 && selection.h > 0 && (
            <>
              {/* Darkened areas around selection */}
              <div 
                className="absolute inset-0 bg-black/60 pointer-events-none"
                style={{
                  clipPath: `polygon(
                    0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
                    ${selection.x * 100}% ${selection.y * 100}%,
                    ${selection.x * 100}% ${(selection.y + selection.h) * 100}%,
                    ${(selection.x + selection.w) * 100}% ${(selection.y + selection.h) * 100}%,
                    ${(selection.x + selection.w) * 100}% ${selection.y * 100}%,
                    ${selection.x * 100}% ${selection.y * 100}%
                  )`
                }}
              />
              
              {/* Selection border */}
              <div
                className="absolute border-2 border-primary border-dashed pointer-events-none"
                style={{
                  left: `${selection.x * 100}%`,
                  top: `${selection.y * 100}%`,
                  width: `${selection.w * 100}%`,
                  height: `${selection.h * 100}%`,
                }}
              >
                {/* Corner handles */}
                <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-primary rounded-sm" />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-sm" />
                <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-primary rounded-sm" />
                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-primary rounded-sm" />
              </div>
            </>
          )}

          {/* Instructions overlay when no selection */}
          {imageLoaded && (!selection || selection.w === 0) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
              <div className="bg-background/95 px-4 py-2 rounded-lg shadow-lg">
                <p className="text-sm font-medium">Click and drag to select an area</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer hint */}
      <div className="p-2 border-t border-border bg-muted/30 text-center">
        <p className="text-xs text-muted-foreground">
          {hasValidSelection 
            ? "Selection ready. Click Continue to add your comment." 
            : "Draw a rectangle around the element you want to change. Press Esc to cancel."}
        </p>
      </div>
    </div>
  );
}
