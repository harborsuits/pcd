import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Upload, File, Image, FileText, Download, Loader2, FolderOpen, MessageSquare, Grid, List, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { ImagePreviewModal } from "@/components/portal/ImagePreviewModal";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface FileItem {
  id: string;
  file_name: string;
  file_type: string;
  created_at: string;
  description?: string | null;
  signed_url?: string | null;
  source?: "upload" | "feedback";
  uploader_type?: string | null;
  comment_id?: string | null;
}

interface FilesTabProps {
  token: string;
}

type FilterType = 'all' | 'images' | 'documents' | 'feedback';
type ViewMode = 'list' | 'grid';

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.includes('pdf')) return FileText;
  return File;
}

function isImageType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

// Component for image thumbnail - uses signed_url from list response
function FileThumbnail({ file, onClick }: { file: FileItem; onClick?: () => void }) {
  const [error, setError] = useState(false);

  // For non-images, show the icon
  if (!isImageType(file.file_type)) {
    const FileIcon = getFileIcon(file.file_type);
    return (
      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <FileIcon className="h-5 w-5 text-muted-foreground" />
      </div>
    );
  }

  // If signed_url provided and no error, show the thumbnail
  if (file.signed_url && !error) {
    return (
      <button
        onClick={onClick}
        className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted hover:ring-2 hover:ring-primary transition-all"
      >
        <img
          src={file.signed_url}
          alt={file.file_name}
          className="w-full h-full object-cover"
          onError={() => setError(true)}
        />
      </button>
    );
  }

  // Fallback to icon
  return (
    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
      <Image className="h-5 w-5 text-muted-foreground" />
    </div>
  );
}

// Grid tile for images
function GridTile({ file, onClick }: { file: FileItem; onClick: () => void }) {
  const [error, setError] = useState(false);
  
  if (!file.signed_url || error) {
    const FileIcon = getFileIcon(file.file_type);
    return (
      <div className="aspect-square rounded-xl bg-muted flex flex-col items-center justify-center p-3 border border-border">
        <FileIcon className="h-8 w-8 text-muted-foreground mb-2" />
        <span className="text-xs text-muted-foreground text-center truncate w-full">
          {file.file_name}
        </span>
      </div>
    );
  }
  
  return (
    <button
      onClick={onClick}
      className="aspect-square rounded-xl overflow-hidden bg-muted border border-border hover:ring-2 hover:ring-primary transition-all group relative"
    >
      <img
        src={file.signed_url}
        alt={file.file_name}
        className="w-full h-full object-cover"
        onError={() => setError(true)}
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
        <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      {file.source === 'feedback' && (
        <div className="absolute top-2 right-2">
          <Badge className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5">
            <MessageSquare className="h-2.5 w-2.5" />
          </Badge>
        </div>
      )}
    </button>
  );
}

export function FilesTab({ token }: FilesTabProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  // Filter files
  const filteredFiles = useMemo(() => {
    switch (filter) {
      case 'images':
        return files.filter(f => isImageType(f.file_type));
      case 'documents':
        return files.filter(f => !isImageType(f.file_type));
      case 'feedback':
        return files.filter(f => f.source === 'feedback');
      default:
        return files;
    }
  }, [files, filter]);

  // Get image files for preview modal
  const imageFiles = useMemo(() => 
    filteredFiles.filter(f => isImageType(f.file_type)),
    [filteredFiles]
  );

  // Count files by type
  const counts = useMemo(() => ({
    all: files.length,
    images: files.filter(f => isImageType(f.file_type)).length,
    documents: files.filter(f => !isImageType(f.file_type)).length,
    feedback: files.filter(f => f.source === 'feedback').length,
  }), [files]);

  const fetchFiles = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || SUPABASE_ANON_KEY;
      
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/files/${token}/list`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await res.json();
      if (res.ok && data.files) {
        setFiles(data.files);
        // Mark files as read
        localStorage.setItem(`pcd_files_read_${token}`, new Date().toISOString());
      }
    } catch (err) {
      console.error("Fetch files error:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || SUPABASE_ANON_KEY;
      
      for (const file of Array.from(selectedFiles)) {
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/files/${token}/upload`,
          {
            method: "POST",
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${authToken}`,
            },
            body: formData,
          }
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Upload failed');
        }
      }
      
      toast.success(`${selectedFiles.length} file(s) uploaded`);
      await fetchFiles();
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload files");
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDownload = async (file: FileItem) => {
    // If we have a signed_url from the list, use it directly
    if (file.signed_url) {
      window.open(file.signed_url, '_blank');
      return;
    }

    // Fallback to download endpoint
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || SUPABASE_ANON_KEY;
      
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/files/${token}/${file.id}/download`,
        {
          method: "GET",
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.open(data.url, '_blank');
        }
      }
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Failed to download file");
    }
  };

  const handleImageClick = (file: FileItem) => {
    const index = imageFiles.findIndex(f => f.id === file.id);
    if (index >= 0) {
      setPreviewIndex(index);
      setPreviewOpen(true);
    }
  };

  // Get provenance text for display
  const getProvenanceText = (file: FileItem): string => {
    if (file.source !== "feedback" || !file.uploader_type) return "";
    return file.uploader_type === "client" ? "You" : "Operator";
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with upload button and view toggle */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Project Files</h3>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 ${viewMode === 'list' ? 'bg-muted' : 'hover:bg-muted/50'}`}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 ${viewMode === 'grid' ? 'bg-muted' : 'hover:bg-muted/50'}`}
                aria-label="Grid view"
              >
                <Grid className="h-4 w-4" />
              </button>
            </div>
            
            <label>
              <input
                type="file"
                multiple
                onChange={handleUpload}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
              <Button variant="outline" size="sm" asChild disabled={uploading}>
                <span className="cursor-pointer">
                  {uploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Upload
                </span>
              </Button>
            </label>
          </div>
        </div>
        
        {/* Filter chips */}
        {files.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(['all', 'images', 'documents', 'feedback'] as FilterType[]).map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                  filter === filterType
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                <span className={`text-xs ${
                  filter === filterType ? 'text-primary-foreground/70' : 'text-muted-foreground/70'
                }`}>
                  {counts[filterType]}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Files display */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredFiles.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
              <FolderOpen className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">
              {filter === 'all' ? 'No files yet' : `No ${filter} found`}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              {filter === 'all' 
                ? 'Upload logos, photos, documents, or any other files for your project.'
                : 'Try selecting a different filter.'}
            </p>
            {filter === 'all' && (
              <label>
                <input
                  type="file"
                  multiple
                  onChange={handleUpload}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <Button variant="outline" asChild disabled={uploading}>
                  <span className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload files
                  </span>
                </Button>
              </label>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          // Grid view
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {filteredFiles.map((file) => (
              <GridTile 
                key={file.id} 
                file={file} 
                onClick={() => isImageType(file.file_type) ? handleImageClick(file) : handleDownload(file)} 
              />
            ))}
          </div>
        ) : (
          // List view
          <div className="space-y-2">
            {filteredFiles.map((file) => {
              const provenance = getProvenanceText(file);
              
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                >
                  <FileThumbnail 
                    file={file} 
                    onClick={() => handleImageClick(file)} 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{file.file_name}</p>
                      {file.source === "feedback" && (
                        <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 flex-shrink-0">
                          <MessageSquare className="h-3 w-3" />
                          From feedback
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(file.created_at), 'MMM d, yyyy')}
                      {provenance && ` • ${provenance}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(file)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        images={imageFiles}
        initialIndex={previewIndex}
      />
    </div>
  );
}
