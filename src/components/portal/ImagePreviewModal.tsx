import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

interface ImageFile {
  id: string;
  file_name: string;
  signed_url?: string | null;
}

interface ImagePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: ImageFile[];
  initialIndex: number;
}

export function ImagePreviewModal({
  open,
  onOpenChange,
  images,
  initialIndex,
}: ImagePreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  const currentImage = images[currentIndex];
  const hasMultiple = images.length > 1;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setZoom(1);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setZoom(1);
  };

  const handleDownload = () => {
    if (currentImage?.signed_url) {
      window.open(currentImage.signed_url, '_blank');
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, 0.5));
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    } else if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  if (!currentImage) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl w-full h-[80vh] p-0 bg-black/95 border-none"
        onKeyDown={handleKeyDown}
      >
        <DialogTitle className="sr-only">Image preview: {currentImage.file_name}</DialogTitle>
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-2 text-white">
            <span className="text-sm truncate max-w-[200px]">
              {currentImage.file_name}
            </span>
            {hasMultiple && (
              <span className="text-sm text-white/60">
                {currentIndex + 1} / {images.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              className="text-white hover:bg-white/20"
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              className="text-white hover:bg-white/20"
              disabled={zoom >= 3}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="text-white hover:bg-white/20"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Image container */}
        <div className="flex-1 flex items-center justify-center overflow-hidden h-full">
          {currentImage.signed_url ? (
            <img
              src={currentImage.signed_url}
              alt={currentImage.file_name}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
            />
          ) : (
            <div className="text-white/60 text-sm">Image not available</div>
          )}
        </div>

        {/* Navigation arrows */}
        {hasMultiple && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </>
        )}

        {/* Thumbnail strip */}
        {hasMultiple && (
          <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex gap-2 justify-center overflow-x-auto">
              {images.map((image, idx) => (
                <button
                  key={image.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setZoom(1);
                  }}
                  className={`w-12 h-12 rounded-md overflow-hidden flex-shrink-0 border-2 transition-colors ${
                    idx === currentIndex 
                      ? 'border-white' 
                      : 'border-transparent hover:border-white/50'
                  }`}
                >
                  {image.signed_url ? (
                    <img
                      src={image.signed_url}
                      alt={image.file_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/20" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
