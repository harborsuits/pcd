import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle, Circle, Loader2, ImageIcon, FileIcon, 
  ExternalLink, Paperclip, X, Upload, Reply, RotateCcw, Send, Lock
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { adminFetch } from "@/lib/adminFetch";

interface PrototypeComment {
  id: string;
  source_message_id: string | null;
  body: string;
  pin_x: number | null;
  pin_y: number | null;
  resolved_at: string | null;
  created_at: string;
  author_type: string;
  prototype_id?: string;
  parent_comment_id?: string | null;
  is_internal?: boolean;
}

interface Attachment {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  uploader_type: string;
  created_at: string;
  signed_url: string | null;
}

interface CommentCardProps {
  comment: PrototypeComment;
  index: number;
  projectToken: string;
  isHighlighted: boolean;
  onJumpToPin: (comment: PrototypeComment) => void;
  onResolveToggle: (commentId: string, resolve: boolean) => void;
  isResolving: boolean;
  onReplyAdded?: () => void;
}

export function CommentCard({
  comment,
  index,
  projectToken,
  isHighlighted,
  onJumpToPin,
  onResolveToggle,
  isResolving,
  onReplyAdded,
}: CommentCardProps) {
  const [showAttachments, setShowAttachments] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch attachments for this comment
  const { data: attachmentsData, isLoading: attachmentsLoading } = useQuery({
    queryKey: ["comment-attachments", projectToken, comment.id],
    queryFn: async () => {
      const res = await adminFetch(`/admin/comments/${projectToken}/${comment.id}/attachments`);
      if (!res.ok) throw new Error("Failed to fetch attachments");
      return res.json() as Promise<{ attachments: Attachment[] }>;
    },
    enabled: showAttachments,
  });

  // Upload attachment mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await adminFetch(`/admin/comments/${projectToken}/${comment.id}/attachments`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload attachment");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Attachment uploaded");
      queryClient.invalidateQueries({ queryKey: ["comment-attachments", projectToken, comment.id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Delete attachment mutation
  const deleteMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      const res = await adminFetch(`/admin/comments/${projectToken}/${comment.id}/attachments/${attachmentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete attachment");
    },
    onSuccess: () => {
      toast.success("Attachment deleted");
      queryClient.invalidateQueries({ queryKey: ["comment-attachments", projectToken, comment.id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Reply mutation - creates a new admin comment associated with the same prototype
  // If the original comment is resolved, mark reply as internal (private note)
  const replyMutation = useMutation({
    mutationFn: async ({ body, isInternal }: { body: string; isInternal: boolean }) => {
      const res = await adminFetch(`/admin/comments/${projectToken}`, {
        method: "POST",
        body: JSON.stringify({ 
          prototype_id: comment.prototype_id,
          body,
          pin_x: comment.pin_x,
          pin_y: comment.pin_y,
          author_type: "admin",
          parent_comment_id: comment.id,
          is_internal: isInternal,
        }),
      });
      if (!res.ok) throw new Error("Failed to add reply");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Reply added");
      setReplyText("");
      setShowReply(false);
      queryClient.invalidateQueries({ queryKey: ["project-comments", projectToken] });
      onReplyAdded?.();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const attachments = attachmentsData?.attachments || [];
  const isImageMime = (mimeType: string) => mimeType.startsWith("image/");
  const isResolved = !!comment.resolved_at;
  const isInternal = !!comment.is_internal;

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => uploadMutation.mutate(file));
  };

  const [makeInternal, setMakeInternal] = useState(isResolved);
  
  const handleSubmitReply = () => {
    if (!replyText.trim()) return;
    replyMutation.mutate({ body: replyText.trim(), isInternal: makeInternal });
  };

  return (
    <div
      className={`p-3 rounded-lg border transition-colors ${
        isHighlighted ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
      } ${isResolved ? "opacity-70" : ""} ${isInternal ? "border-dashed border-yellow-500/50 bg-yellow-50/30 dark:bg-yellow-900/10" : ""}`}
    >
      {/* Internal badge */}
      {isInternal && (
        <div className="mb-2 flex items-center gap-1">
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400">
            Internal Note
          </span>
        </div>
      )}
      {/* Header row */}
      <div 
        className="flex items-start justify-between gap-2 cursor-pointer"
        onClick={() => onJumpToPin(comment)}
      >
        <div className="flex items-start gap-2 min-w-0">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
            isResolved ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
          }`}>
            {index + 1}
          </div>
          <div className="min-w-0">
            <p className={`text-sm line-clamp-2 ${isResolved ? "line-through text-muted-foreground" : ""}`}>
              {comment.body}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {comment.author_type === "client" ? "Client" : "Admin"} • {format(new Date(comment.created_at), "MMM d, h:mm a")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Reply button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              setShowReply(!showReply);
            }}
            title="Reply"
          >
            <Reply className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              setShowAttachments(!showAttachments);
            }}
            title="Attachments"
          >
            <Paperclip className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onResolveToggle(comment.id, !isResolved);
            }}
            disabled={isResolving}
            title={isResolved ? "Reopen" : "Resolve"}
          >
            {isResolved ? <RotateCcw className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* Reply input */}
      {showReply && (
        <div className="mt-2 pt-2 border-t border-border" onClick={(e) => e.stopPropagation()}>
          <Textarea
            placeholder={isResolved ? "Add a note..." : "Reply to this comment..."}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="min-h-[60px] text-sm resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                handleSubmitReply();
              }
            }}
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center space-x-1.5">
                <Checkbox
                  id={`internal-${comment.id}`}
                  checked={makeInternal}
                  onCheckedChange={(checked) => setMakeInternal(!!checked)}
                />
                <Label 
                  htmlFor={`internal-${comment.id}`}
                  className="text-[10px] text-muted-foreground cursor-pointer flex items-center gap-1"
                >
                  <Lock className="h-2.5 w-2.5" />
                  Internal only
                </Label>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setShowReply(false);
                  setReplyText("");
                  setMakeInternal(isResolved);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className={`h-7 text-xs ${makeInternal ? "bg-yellow-600 hover:bg-yellow-700" : ""}`}
                onClick={handleSubmitReply}
                disabled={!replyText.trim() || replyMutation.isPending}
              >
                {replyMutation.isPending ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : makeInternal ? (
                  <Lock className="h-3 w-3 mr-1" />
                ) : (
                  <Send className="h-3 w-3 mr-1" />
                )}
                {makeInternal ? "Add Note" : "Reply"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Attachments panel */}
      {showAttachments && (
        <div className="mt-2 pt-2 border-t border-border" onClick={(e) => e.stopPropagation()}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          
          {attachmentsLoading ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : attachments.length === 0 ? (
            <div className="text-center py-2 text-muted-foreground">
              <p className="text-xs">No attachments</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1 mb-2">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="relative group w-12 h-12 rounded border border-border overflow-hidden bg-muted/50"
                >
                  {isImageMime(att.mime_type) && att.signed_url ? (
                    <img src={att.signed_url} alt={att.filename} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-0.5">
                    {att.signed_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-white hover:bg-white/20"
                        onClick={() => window.open(att.signed_url!, "_blank")}
                        title="Open"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-white hover:bg-white/20"
                      onClick={() => deleteMutation.mutate(att.id)}
                      disabled={deleteMutation.isPending}
                      title="Delete"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            className="w-full h-7 text-xs"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Upload className="h-3 w-3 mr-1" />
            )}
            Add files
          </Button>
        </div>
      )}
    </div>
  );
}
