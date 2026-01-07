import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, FileText, ExternalLink, Upload, Loader2, Check, Clock, CircleDot, XCircle, Pencil, X, Archive } from "lucide-react";
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

type CommentStatus = "open" | "in_progress" | "resolved" | "wont_do";

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
    status?: CommentStatus;
    resolution_note?: string | null;
    resolved_by?: string | null;
    archived_at?: string | null;
    // Screenshot feedback fields
    screenshot_path?: string | null;
    screenshot_w?: number | null;
    screenshot_h?: number | null;
    // Snip-first crop fields
    screenshot_full_path?: string | null;
    crop_x?: number | null;
    crop_y?: number | null;
    crop_w?: number | null;
    crop_h?: number | null;
  };
  index: number;
  onResolve: (id: string) => void;
  onUnresolve: (id: string) => void;
  onMarkInProgress?: (id: string) => void;
  onEdit?: (id: string, newBody: string) => Promise<void>;
  onArchive?: (id: string) => Promise<void>;
  onViewScreenshot?: (comment: PortalCommentCardProps["comment"]) => void;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function PortalCommentCard({ 
  token, 
  comment, 
  index,
  onResolve,
  onUnresolve,
  onMarkInProgress,
  onEdit,
  onArchive,
  onViewScreenshot,
}: PortalCommentCardProps) {
  const [showAttachments, setShowAttachments] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.body);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const isResolved = comment.status === "resolved" || comment.status === "wont_do" || !!comment.resolved_at;
  const isInProgress = comment.status === "in_progress";
  const isClient = comment.author_type === "client";
  // Allow editing for unresolved comments - onEdit prop controls whether editing is available
  const canEdit = !isResolved && !!onEdit;
  const status = comment.status || (comment.resolved_at ? "resolved" : "open");

  // Get status dot color
  const getStatusDotClass = () => {
    switch (status) {
      case "in_progress":
        return "bg-amber-400";
      case "resolved":
      case "wont_do":
        return "bg-muted-foreground/40";
      case "open":
      default:
        return "bg-primary";
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "in_progress":
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200"><Clock className="h-2.5 w-2.5 mr-0.5" />In Progress</Badge>;
      case "resolved":
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-green-50 text-green-700 border-green-200"><Check className="h-2.5 w-2.5 mr-0.5" />Resolved</Badge>;
      case "wont_do":
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-gray-50 text-gray-600 border-gray-200"><XCircle className="h-2.5 w-2.5 mr-0.5" />Won't Do</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-orange-50 text-orange-700 border-orange-200"><CircleDot className="h-2.5 w-2.5 mr-0.5" />Open</Badge>;
    }
  };

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
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    if (isToday) return `Today at ${time}`;
    return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} at ${time}`;
  };

  const getRoleBadge = () => {
    if (comment.author_type === "operator" || comment.author_type === "admin") {
      return (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700">
          Operator
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-700">
        Client
      </Badge>
    );
  };

  return (
    <div
      className={`p-3 rounded-lg border ${
        isResolved
          ? "bg-muted/50 border-border/50"
          : "bg-card border-border"
      }`}
    >
      {/* Header row 1: index + badges + timestamp */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <div className="relative flex-shrink-0">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                isResolved
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {isResolved ? <Check className="h-3 w-3" /> : index + 1}
            </div>
            {/* Status dot */}
            <span
              className={`absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full ring-2 ring-background ${getStatusDotClass()}`}
              title={
                status === "in_progress"
                  ? "In progress"
                  : status === "resolved"
                  ? "Resolved"
                  : status === "wont_do"
                  ? "Won't do"
                  : "Open"
              }
            />
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatTime(comment.created_at)}
          </span>
        </div>
      </div>

      {/* Header row 2: role badge + status + actions */}
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {getRoleBadge()}
          {getStatusBadge()}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {canEdit && !isEditing && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setEditText(comment.body);
                setIsEditing(true);
              }}
            >
              <Pencil className="h-3 w-3" />
            </Button>
          )}
          {/* Archive button - only for resolved comments */}
          {isResolved && onArchive && !comment.archived_at && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              title="Archive comment"
              disabled={archiving}
              onClick={async (e) => {
                e.stopPropagation();
                setArchiving(true);
                try {
                  await onArchive(comment.id);
                } finally {
                  setArchiving(false);
                }
              }}
            >
              <Archive className="h-3 w-3" />
            </Button>
          )}
          {isResolved ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              onClick={() => onUnresolve(comment.id)}
            >
              Reopen
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              {!isInProgress && onMarkInProgress && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={() => onMarkInProgress(comment.id)}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Working
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={() => onResolve(comment.id)}
              >
                Resolve
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Comment body - editable or static */}
      {isEditing ? (
        <div className="mb-2 space-y-2">
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="min-h-[60px] text-sm"
            placeholder="Update your comment..."
            autoFocus
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={async () => {
                if (!onEdit || !editText.trim()) return;
                setSaving(true);
                try {
                  await onEdit(comment.id, editText.trim());
                  setIsEditing(false);
                  toast.success("Comment updated");
                } catch {
                  toast.error("Failed to update");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving || !editText.trim()}
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setIsEditing(false);
                setEditText(comment.body);
              }}
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className={`text-sm mb-2 ${isResolved ? "text-muted-foreground" : ""}`}>
          {comment.body}
        </p>
      )}

      {/* Screenshot thumbnail */}
      {comment.screenshot_path && (
        <div className="mb-2">
          <button
            onClick={() => onViewScreenshot?.(comment)}
            className="relative group w-full max-w-[200px] rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
          >
            <img
              src={`${SUPABASE_URL}/storage/v1/object/public/project-media/${comment.screenshot_path}`}
              alt="Screenshot feedback"
              className="w-full h-auto object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-medium">View Screenshot</span>
            </div>
            {/* Pin marker preview */}
            {comment.pin_x !== null && comment.pin_y !== null && (
              <div
                className="absolute w-3 h-3 bg-primary rounded-full border-2 border-white shadow-md"
                style={{
                  left: `${comment.pin_x}%`,
                  top: `${comment.pin_y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              />
            )}
          </button>
        </div>
      )}
      
      {/* Resolution note if present */}
      {comment.resolution_note && (
        <div className="mb-2 p-2 rounded bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <p className="text-xs text-green-700 dark:text-green-400 font-medium mb-0.5">Resolution:</p>
          <p className="text-xs text-green-600 dark:text-green-300">{comment.resolution_note}</p>
        </div>
      )}

      {/* Resolved by info */}
      {(status === "resolved" || status === "wont_do") && comment.resolved_by && (
        <div className="mb-2 text-xs text-muted-foreground">
          {status === "wont_do" ? "Closed by" : "Resolved by"}{" "}
          <span className="font-medium">{comment.resolved_by}</span>
          {comment.resolved_at && ` · ${formatTime(comment.resolved_at)}`}
        </div>
      )}

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