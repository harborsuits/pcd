import { useState, useRef, useCallback } from "react";
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  preview?: string;
  file?: File; // Keep the actual File object for uploading
}

interface FileDropZoneProps {
  label?: string;
  hint?: string;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
}

export function FileDropZone({
  label,
  hint,
  accept = "image/*,application/pdf",
  multiple = true,
  maxFiles = 10,
  maxSizeMB = 10,
  files,
  onFilesChange,
  disabled = false,
  className,
  compact = false,
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (fileList: FileList) => {
    if (disabled) return;
    
    setIsProcessing(true);
    const newFiles: UploadedFile[] = [];
    const maxSize = maxSizeMB * 1024 * 1024;
    
    for (let i = 0; i < fileList.length; i++) {
      if (files.length + newFiles.length >= maxFiles) break;
      
      const file = fileList[i];
      if (file.size > maxSize) continue;
      
      const uploaded: UploadedFile = {
        id: `${Date.now()}-${i}-${file.name}`,
        name: file.name,
        type: file.type,
        size: file.size,
        file, // Store the actual File object
      };
      
      // Create preview for images
      if (file.type.startsWith("image/")) {
        uploaded.preview = URL.createObjectURL(file);
      }
      
      newFiles.push(uploaded);
    }
    
    onFilesChange([...files, ...newFiles]);
    setIsProcessing(false);
  }, [files, maxFiles, maxSizeMB, disabled, onFilesChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = "";
    }
  }, [processFiles]);

  const removeFile = useCallback((id: string) => {
    const file = files.find(f => f.id === id);
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
    onFilesChange(files.filter(f => f.id !== id));
  }, [files, onFilesChange]);

  const isPdf = (type: string) => type === "application/pdf";

  return (
    <div className={cn("space-y-2", className)}>
      {label && <p className="text-sm font-medium">{label}</p>}
      
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "border-2 border-dashed rounded-lg transition-colors cursor-pointer",
          compact ? "p-3" : "p-6",
          isDragging 
            ? "border-primary bg-primary/5" 
            : "border-border hover:border-primary/50 hover:bg-muted/30",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />
        
        <div className={cn(
          "flex flex-col items-center justify-center text-center",
          compact ? "gap-1" : "gap-2"
        )}>
          {isProcessing ? (
            <Loader2 className={cn("text-primary animate-spin", compact ? "h-5 w-5" : "h-8 w-8")} />
          ) : (
            <Upload className={cn("text-muted-foreground", compact ? "h-5 w-5" : "h-8 w-8")} />
          )}
          <div className={compact ? "text-xs" : "text-sm"}>
            <span className="font-medium text-primary">Click to upload</span>
            <span className="text-muted-foreground"> or drag and drop</span>
          </div>
          {hint && (
            <p className="text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
      </div>

      {/* File previews */}
      {files.length > 0 && (
        <div className={cn(
          "grid gap-2",
          compact ? "grid-cols-4" : "grid-cols-3 sm:grid-cols-4"
        )}>
          {files.map((file) => (
            <div
              key={file.id}
              className="relative group border rounded-lg overflow-hidden bg-muted/30"
            >
              {file.preview ? (
                <img
                  src={file.preview}
                  alt={file.name}
                  className={cn(
                    "w-full object-cover",
                    compact ? "h-12" : "h-20"
                  )}
                />
              ) : (
                <div className={cn(
                  "w-full flex items-center justify-center bg-muted/50",
                  compact ? "h-12" : "h-20"
                )}>
                  {isPdf(file.type) ? (
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
              )}
              
              {/* Remove button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(file.id);
                }}
                className="absolute top-1 right-1 p-0.5 rounded-full bg-background/80 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
              
              {/* File name */}
              <div className="px-1 py-0.5 text-xs truncate text-muted-foreground">
                {file.name.length > 12 ? `${file.name.slice(0, 10)}...` : file.name}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File count */}
      {files.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {files.length} file{files.length !== 1 ? "s" : ""} selected
          {maxFiles > 1 && ` (max ${maxFiles})`}
        </p>
      )}
    </div>
  );
}

// Helper to upload files to the files edge function
export async function uploadIntakeFiles(
  projectToken: string,
  files: UploadedFile[],
  category: string
): Promise<{ uploaded: string[]; errors: string[] }> {
  const uploaded: string[] = [];
  const errors: string[] = [];
  
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const uploadUrl = `${baseUrl}/functions/v1/files/${projectToken}/upload`;
  
  for (const file of files) {
    if (!file.file) {
      errors.push(`${file.name}: No file data`);
      continue;
    }
    
    try {
      const formData = new FormData();
      formData.append("file", file.file);
      formData.append("description", `[${category}] ${file.name}`);
      
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Upload failed" }));
        errors.push(`${file.name}: ${err.error || "Upload failed"}`);
        continue;
      }
      
      const result = await response.json();
      if (result.file?.id) {
        uploaded.push(result.file.id);
      }
    } catch (e) {
      errors.push(`${file.name}: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }
  
  return { uploaded, errors };
}

export type { UploadedFile };
