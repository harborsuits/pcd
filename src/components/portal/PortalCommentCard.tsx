import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Paperclip, Image, FileText, ExternalLink, Upload, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

interface Attachment {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  uploader_type: string;
  created_at: string;
  signed_url: string | null;
}

interface PortalCommentCardProps {
  token: string;
  comment: {
    id: string;
    prototype_id: string;
    author_type: string;
    body: string;
    pin_x: number | null;
    pin_y: number | null;
    resolved_at: string | null;
    created_at: string;
  };
  index: number;
  onResolve: (id: string) => void;
  onUnresolve: (id: string) => void;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function PortalCommentCard({ 
  token, 
  comment, 
  index,
  onResolve,
  onUnresolve 
}: PortalCommentCardProps) {
  const [showAttachments, setShowAttachments] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const isResolved = !!comment.resolved_at;
  const isClient = comment.author_type === "client";

  // Fetch attachments only when expanded
  const { data: attachmentsData, isLoading: loadingAttachments } = useQuery({
    queryKey: ["portal-comment-attachments", token, comment.id],
    queryFn: async () => {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/portal/${token}/comments/${comment.id}/attachments`
      );
      if (!res.ok) throw new Error("Failed to fetch attachments");
      return res.json() as Promise<{ attachments: Attachment[] }>;
    },
    enabled: showAttachments,
    staleTime: 30000,
  });

  const attachments = attachmentsData?.attachments || [];

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/portal/${token}/comments/${comment.id}/attachments`,
        { method: "POST", body: formData }
      );
      
      if (!res.ok) throw new Error("Failed to upload");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["portal-comment-attachments", token, comment.id] 
      });
    },
    onError: () => {
      toast.error("Failed to upload file");
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadMutation.mutateAsync(file);
      }
      toast.success("Files uploaded");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <div
      className={`p-3 rounded-lg border ${
        isResolved
          ? "bg-muted/50 border-border/50"
          : "bg-card border-border"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
              isResolved
                ? "bg-muted text-muted-foreground"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {isResolved ? <Check className="h-3 w-3" /> : index + 1}
          </div>
          <span className="text-xs text-muted-foreground">
            {isClient ? "You" : "Team"} · {formatTime(comment.created_at)}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => isResolved ? onUnresolve(comment.id) : onResolve(comment.id)}
        >
          {isResolved ? "Reopen" : "Resolve"}
        </Button>
      </div>

      {/* Comment body */}
      <p className={`text-sm mb-2 ${isResolved ? "text-muted-foreground" : ""}`}>
        {comment.body}
      </p>

      {/* Attachments toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1"
          onClick={() => setShowAttachments(!showAttachments)}
        >
          <Paperclip className="h-3 w-3" />
          {showAttachments ? "Hide" : "Attachments"}
          {attachments.length > 0 && (
            <span className="ml-1 text-muted-foreground">({attachments.length})</span>
          )}
        </Button>
      </div>

      {/* Attachments panel */}
      {showAttachments && (
        <div className="mt-3 pt-3 border-t border-border">
          {loadingAttachments ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : attachments.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              No attachments yet
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 mb-3">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="group relative rounded-lg border border-border overflow-hidden bg-muted/30"
                >
                  {att.mime_type.startsWith("image/") && att.signed_url ? (
                    <img
                      src={att.signed_url}
                      alt={att.filename}
                      className="w-full h-20 object-cover"
                    />
                  ) : (
                    <div className="w-full h-20 flex items-center justify-center">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {att.signed_url && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => window.open(att.signed_url!, "_blank")}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="p-1.5">
                    <p className="text-xs truncate">{att.filename}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatSize(att.size_bytes)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload button */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs gap-1"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Upload className="h-3 w-3" />
            )}
            Add files
          </Button>
        </div>
      )}
    </div>
  );
}
