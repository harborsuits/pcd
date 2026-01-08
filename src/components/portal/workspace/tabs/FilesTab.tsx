import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, File, Image, FileText, Download, Loader2, FolderOpen, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface FileItem {
  id: string;
  file_name: string;
  file_type: string;
  storage_path: string;
  created_at: string;
  description?: string;
}

interface FilesTabProps {
  token: string;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.includes('pdf')) return FileText;
  return File;
}

function isImageType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

// Component for image thumbnail with lazy loading
function FileThumbnail({ 
  file, 
  token 
}: { 
  file: FileItem; 
  token: string;
}) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isImageType(file.file_type)) {
      setLoading(false);
      return;
    }

    const fetchThumbnail = async () => {
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
            setThumbnailUrl(data.url);
          }
        }
      } catch (err) {
        console.error("Thumbnail fetch error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchThumbnail();
  }, [file.id, file.file_type, token]);

  // For non-images, show the icon
  if (!isImageType(file.file_type)) {
    const FileIcon = getFileIcon(file.file_type);
    return (
      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <FileIcon className="h-5 w-5 text-muted-foreground" />
      </div>
    );
  }

  // Loading state for images
  if (loading) {
    return (
      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state or no URL - fall back to icon
  if (error || !thumbnailUrl) {
    return (
      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <Image className="h-5 w-5 text-muted-foreground" />
      </div>
    );
  }

  // Show the actual thumbnail
  return (
    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
      <img
        src={thumbnailUrl}
        alt={file.file_name}
        className="w-full h-full object-cover"
        onError={() => setError(true)}
      />
    </div>
  );
}

export function FilesTab({ token }: FilesTabProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

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

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with upload button */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-medium">Project Files</h3>
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

      {/* Files list */}
      <div className="flex-1 overflow-y-auto p-4">
        {files.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <FolderOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">No files yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              Upload logos, photos, documents, or any other files for your project.
            </p>
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
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => {
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                >
                  <FileThumbnail file={file} token={token} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(file.created_at), 'MMM d, yyyy')}
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
    </div>
  );
}
