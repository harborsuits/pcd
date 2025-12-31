import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Upload, 
  Loader2, 
  Image as ImageIcon, 
  FileText, 
  Palette, 
  X,
  Check,
  Download,
  Eye
} from "lucide-react";
import { proxyMediaUrl, isImageType, getFileIcon } from "@/lib/media";

interface PortalFile {
  id: string;
  file_name: string;
  file_type: string;
  description: string | null;
  created_at: string;
}

interface FileCategory {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  accept: string;
  examples: string;
}

const FILE_CATEGORIES: FileCategory[] = [
  {
    id: "logo",
    label: "Logo",
    description: "Your business logo in high resolution",
    icon: <ImageIcon className="h-5 w-5" />,
    accept: "image/*,.svg,.pdf,.ai,.eps",
    examples: "PNG, SVG, or vector format",
  },
  {
    id: "photos",
    label: "Photos",
    description: "Team photos, location, work samples",
    icon: <ImageIcon className="h-5 w-5" />,
    accept: "image/*",
    examples: "JPEG, PNG, WebP",
  },
  {
    id: "copy",
    label: "Copy & Content",
    description: "Text, bios, service descriptions",
    icon: <FileText className="h-5 w-5" />,
    accept: ".pdf,.doc,.docx,.txt,.md,text/*",
    examples: "PDF, Word, or text files",
  },
  {
    id: "brand",
    label: "Brand Colors",
    description: "Brand guidelines, color codes, fonts",
    icon: <Palette className="h-5 w-5" />,
    accept: ".pdf,image/*,.ai,.eps",
    examples: "PDF brand guide or color swatches",
  },
];

interface ClientFileUploadProps {
  token: string;
  files: PortalFile[];
  onFileUploaded: (file: PortalFile) => void;
  onPreviewImage?: (url: string, name: string) => void;
  onPreviewPdf?: (url: string, name: string) => void;
}

export function ClientFileUpload({ 
  token, 
  files, 
  onFileUploaded,
  onPreviewImage,
  onPreviewPdf 
}: ClientFileUploadProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploadQueue, setUploadQueue] = useState<{ name: string; status: 'pending' | 'uploading' | 'done' | 'error'; error?: string }[]>([]);
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

  const handleUpload = useCallback(async (category: string, fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    
    setUploading(prev => ({ ...prev, [category]: true }));
    const filesArray = Array.from(fileList);
    const description = descriptions[category] || "";
    const categoryLabel = FILE_CATEGORIES.find(c => c.id === category)?.label || category;
    
    setUploadQueue(filesArray.map(f => ({ name: f.name, status: 'pending' })));
    
    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      
      setUploadQueue(prev => prev.map((item, idx) => 
        idx === i ? { ...item, status: 'uploading' } : item
      ));
      
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("description", `[${categoryLabel}] ${description}`.trim());
        
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/files/${encodeURIComponent(token)}/upload`,
          { method: "POST", body: fd }
        );
        
        const response = await res.json().catch(() => ({}));
        
        if (!res.ok) {
          throw new Error(response.error || "Upload failed");
        }
        
        if (response?.file) {
          onFileUploaded(response.file);
        }
        
        setUploadQueue(prev => prev.map((item, idx) => 
          idx === i ? { ...item, status: 'done' } : item
        ));
      } catch (err: any) {
        setUploadQueue(prev => prev.map((item, idx) => 
          idx === i ? { ...item, status: 'error', error: err.message } : item
        ));
      }
    }
    
    setUploading(prev => ({ ...prev, [category]: false }));
    setDescriptions(prev => ({ ...prev, [category]: "" }));
    
    setTimeout(() => setUploadQueue([]), 3000);
  }, [token, descriptions, onFileUploaded, SUPABASE_URL]);

  // Group files by category based on description prefix
  const filesByCategory = FILE_CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = files.filter(f => 
      f.description?.toLowerCase().includes(`[${cat.label.toLowerCase()}]`)
    );
    return acc;
  }, {} as Record<string, PortalFile[]>);
  
  // Uncategorized files
  const uncategorizedFiles = files.filter(f => 
    !FILE_CATEGORIES.some(cat => 
      f.description?.toLowerCase().includes(`[${cat.label.toLowerCase()}]`)
    )
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const isPdf = (fileType: string) => fileType.toLowerCase() === "application/pdf";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Upload Project Assets</h3>
          <p className="text-sm text-muted-foreground">Share your branding, photos, and content</p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {files.length} file{files.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Category Cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {FILE_CATEGORIES.map((category) => {
          const categoryFiles = filesByCategory[category.id] || [];
          const isExpanded = expandedCategory === category.id;
          const isUploading = uploading[category.id];
          
          return (
            <div 
              key={category.id}
              className={`border rounded-lg transition-all ${
                isExpanded ? "border-primary bg-primary/5" : "border-border bg-card hover:border-muted-foreground/30"
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${isExpanded ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {category.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{category.label}</span>
                      {categoryFiles.length > 0 && (
                        <Badge variant="default" className="text-[10px] h-5 bg-green-500/10 text-green-600 border-green-500/20">
                          <Check className="h-3 w-3 mr-1" />
                          {categoryFiles.length}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{category.description}</p>
                  </div>
                </div>
              </button>

              {/* Expanded Upload Area */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  {/* Existing Files */}
                  {categoryFiles.length > 0 && (
                    <div className="space-y-2">
                      {categoryFiles.map((file) => {
                        const fileUrl = proxyMediaUrl(file.id, token);
                        const isImage = isImageType(file.file_type);
                        
                        return (
                          <div key={file.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm">
                            <span className="text-lg">{getFileIcon(file.file_type)}</span>
                            <span className="flex-1 truncate">{file.file_name}</span>
                            <span className="text-xs text-muted-foreground shrink-0">{formatDate(file.created_at)}</span>
                            {isImage && onPreviewImage && (
                              <button
                                onClick={() => onPreviewImage(fileUrl, file.file_name)}
                                className="p-1 hover:bg-background rounded"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {isPdf(file.file_type) && onPreviewPdf && (
                              <button
                                onClick={() => onPreviewPdf(fileUrl, file.file_name)}
                                className="p-1 hover:bg-background rounded"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-background rounded"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Upload Input */}
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept={category.accept}
                      multiple
                      disabled={isUploading}
                      onChange={(e) => {
                        handleUpload(category.id, e.target.files);
                        e.currentTarget.value = "";
                      }}
                      className="cursor-pointer text-sm"
                    />
                    <Textarea
                      value={descriptions[category.id] || ""}
                      onChange={(e) => setDescriptions(prev => ({ ...prev, [category.id]: e.target.value }))}
                      placeholder="Paste anything you want on the site — we'll format it."
                      disabled={isUploading}
                      className="text-sm min-h-[120px]"
                      rows={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      You can paste everything here if you don't have files.
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Accepted: {category.examples} • Max 10MB
                    </p>
                  </div>

                  {/* Upload Queue */}
                  {isUploading && uploadQueue.length > 0 && (
                    <div className="space-y-1">
                      {uploadQueue.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          {item.status === 'uploading' && <Loader2 className="h-3 w-3 animate-spin" />}
                          {item.status === 'done' && <Check className="h-3 w-3 text-green-500" />}
                          {item.status === 'error' && <X className="h-3 w-3 text-destructive" />}
                          {item.status === 'pending' && <span className="h-3 w-3 rounded-full border border-muted-foreground/30" />}
                          <span className={item.status === 'error' ? 'text-destructive' : 'text-muted-foreground'}>
                            {item.name}
                            {item.error && ` - ${item.error}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Uncategorized Files */}
      {uncategorizedFiles.length > 0 && (
        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-medium mb-2 text-muted-foreground">Other Files</h4>
          <div className="space-y-2">
            {uncategorizedFiles.map((file) => {
              const fileUrl = proxyMediaUrl(file.id, token);
              const isImage = isImageType(file.file_type);
              
              return (
                <div key={file.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm">
                  <span className="text-lg">{getFileIcon(file.file_type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{file.file_name}</p>
                    {file.description && (
                      <p className="text-xs text-muted-foreground truncate">{file.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{formatDate(file.created_at)}</span>
                  {isImage && onPreviewImage && (
                    <button
                      onClick={() => onPreviewImage(fileUrl, file.file_name)}
                      className="p-1 hover:bg-background rounded"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {isPdf(file.file_type) && onPreviewPdf && (
                    <button
                      onClick={() => onPreviewPdf(fileUrl, file.file_name)}
                      className="p-1 hover:bg-background rounded"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-background rounded"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
