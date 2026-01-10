import { useState, useRef, useCallback, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Paperclip, X, Lock, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ThreadComposerSubmitData {
  body: string;
  files: File[];
  isInternal?: boolean;
}

export interface ThreadComposerProps {
  onSubmit: (data: ThreadComposerSubmitData) => Promise<void>;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  showInternalToggle?: boolean;
  replyingTo?: { label: string; preview?: string } | null;
  onCancelReply?: () => void;
  maxChars?: number;
  showAttachments?: boolean;
  submitLabel?: string;
  className?: string;
  compact?: boolean;
}

export function ThreadComposer({
  onSubmit,
  placeholder = "Type your message...",
  autoFocus = false,
  disabled = false,
  showInternalToggle = false,
  replyingTo = null,
  onCancelReply,
  maxChars = 5000,
  showAttachments = true,
  submitLabel = "Send",
  className,
  compact = false,
}: ThreadComposerProps) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charsRemaining = maxChars - text.length;
  const isOverLimit = charsRemaining < 0;
  const canSubmit = text.trim().length > 0 && !isOverLimit && !disabled && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      await onSubmit({
        body: text.trim(),
        files: files.length > 0 ? files : [],
        isInternal: showInternalToggle ? isInternal : undefined,
      });
      // Clear on success
      setText("");
      setFiles([]);
      setIsInternal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send, Shift+Enter for newline
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const isImage = (file: File) => file.type.startsWith("image/");

  return (
    <div className={cn("space-y-2", className)}>
      {/* Replying-to indicator */}
      {replyingTo && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 text-xs">
          <span className="text-muted-foreground">Replying to</span>
          <span className="font-medium">{replyingTo.label}</span>
          {replyingTo.preview && (
            <span className="text-muted-foreground truncate max-w-[200px]">
              "{replyingTo.preview}"
            </span>
          )}
          {onCancelReply && (
            <button
              type="button"
              onClick={onCancelReply}
              className="ml-auto text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* Internal note toggle (operator only) */}
      {showInternalToggle && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsInternal(!isInternal)}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors",
              isInternal
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {isInternal ? (
              <>
                <Lock className="h-3 w-3" />
                Internal note
              </>
            ) : (
              <>
                <Eye className="h-3 w-3" />
                Visible to client
              </>
            )}
          </button>
        </div>
      )}

      {/* Text input */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled || submitting}
          className={cn(
            "resize-none pr-20",
            compact ? "min-h-[60px]" : "min-h-[80px]",
            isInternal && "border-amber-400/50 bg-amber-50/30 dark:bg-amber-900/10"
          )}
        />
        {/* Character count */}
        {text.length > maxChars * 0.8 && (
          <span
            className={cn(
              "absolute bottom-2 right-2 text-[10px]",
              isOverLimit ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {charsRemaining}
          </span>
        )}
      </div>

      {/* File previews */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="relative group flex items-center gap-2 px-2 py-1 rounded bg-muted text-xs max-w-[180px]"
            >
              {isImage(file) ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="h-8 w-8 object-cover rounded"
                />
              ) : (
                <Paperclip className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              )}
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="ml-auto text-muted-foreground hover:text-foreground flex-shrink-0"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {showAttachments && (
            <>
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
                disabled={disabled || submitting}
              >
                <Paperclip className="h-3.5 w-3.5" />
                {!compact && "Attach"}
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isInternal && (
            <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
              Internal only
            </Badge>
          )}
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="gap-1.5"
          >
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {submitLabel}
          </Button>
        </div>
      </div>

      {/* Hint text */}
      {!compact && (
        <p className="text-[10px] text-muted-foreground">
          Press <kbd className="px-1 py-0.5 rounded bg-muted text-[9px]">Enter</kbd> to send,{" "}
          <kbd className="px-1 py-0.5 rounded bg-muted text-[9px]">Shift+Enter</kbd> for new line
        </p>
      )}
    </div>
  );
}
