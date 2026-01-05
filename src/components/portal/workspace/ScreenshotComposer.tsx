import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Paperclip, X, MapPin } from "lucide-react";

interface ScreenshotComposerProps {
  screenshotUrl: string;
  pinX: number;
  pinY: number;
  screenshotW: number;
  screenshotH: number;
  onSubmit: (data: {
    body: string;
    pinX: number;
    pinY: number;
    screenshotW: number;
    screenshotH: number;
    attachments?: File[];
  }) => Promise<void>;
  onCancel: () => void;
  onRepin: () => void;
}

export function ScreenshotComposer({
  screenshotUrl,
  pinX,
  pinY,
  screenshotW,
  screenshotH,
  onSubmit,
  onCancel,
  onRepin,
}: ScreenshotComposerProps) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    
    setSubmitting(true);
    try {
      await onSubmit({
        body: text.trim(),
        pinX,
        pinY,
        screenshotW,
        screenshotH,
        attachments: files.length > 0 ? files : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 border-t border-border bg-background">
      {/* Screenshot preview with pin */}
      <div className="mb-3">
        <div className="relative inline-block max-w-full rounded-lg overflow-hidden border border-border">
          <img
            src={screenshotUrl}
            alt="Screenshot preview"
            className="max-h-[120px] w-auto object-contain"
          />
          {/* Pin marker */}
          <div
            className="absolute w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center"
            style={{
              left: `${pinX}%`,
              top: `${pinY}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <span className="text-[8px] font-bold text-primary-foreground">1</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs mt-1"
          onClick={onRepin}
        >
          <MapPin className="h-3 w-3 mr-1" />
          Move pin
        </Button>
      </div>

      {/* Comment input */}
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Describe your feedback..."
        className="min-h-[80px] resize-none mb-3"
        autoFocus
      />

      {/* File previews */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {files.map((file, index) => (
            <div
              key={index}
              className="relative group flex items-center gap-2 px-2 py-1 rounded bg-muted text-xs"
            >
              <Paperclip className="h-3 w-3 text-muted-foreground" />
              <span className="truncate max-w-[100px]">{file.name}</span>
              <button
                onClick={() => removeFile(index)}
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
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-3.5 w-3.5" />
            Attach
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={!text.trim() || submitting}
            className="gap-1.5"
          >
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
