import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileText, MessageSquare, CreditCard, AlertCircle, Send, Home, Download, Image as ImageIcon, Upload, Eye, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { proxyMediaUrl, isImageType, getFileIcon } from "@/lib/media";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface PortalMessage {
  id: string;
  content: string;
  sender_type: string;
  created_at: string;
  read_at: string | null;
}

interface PortalFile {
  id: string;
  file_name: string;
  file_type: string;
  description: string | null;
  created_at: string;
}

interface PortalPayment {
  amount_cents: number;
  payment_type: string;
  status: string;
  created_at: string;
}

interface PortalData {
  business: {
    name: string;
    slug: string;
    status: string;
  };
  messages: PortalMessage[];
  files: PortalFile[];
  payments: PortalPayment[];
  pagination: {
    messages_limit: number;
    messages_before: string | null;
    has_more_messages: boolean;
  };
}

export default function PortalPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadDesc, setUploadDesc] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<{ url: string; name: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const originalTitle = useRef(document.title);
  const markReadInFlight = useRef(false);

  // Scroll to bottom when new messages arrive (messages are oldest→newest)
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    console.log("✅ PortalPage mounted, token:", token?.slice(0, 8) + "...");
    if (token) {
      fetchPortalData(token);
      // Mark admin messages as read when portal loads
      markAdminMessagesAsRead(token);
    }
  }, [token]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!token || !data) return;

    console.log("📡 Setting up realtime subscription for portal:", token.slice(0, 8) + "...");

    const channel = supabase
      .channel(`portal-messages-${token}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `project_token=eq.${token}`,
        },
        (payload) => {
          console.log("📨 New message received:", payload);
          const newMsg = payload.new as {
            id: string;
            content: string;
            sender_type: string;
            created_at: string;
            read_at: string | null;
          };

          setData((prev) => {
            if (!prev) return prev;

            // Deduplicate by id
            const exists = prev.messages.some((m) => m.id === newMsg.id);
            if (exists) {
              console.log("⚠️ Duplicate message ignored");
              return prev;
            }

            console.log("✅ Adding new message to state");
            
            // Show toast for admin messages
            if (newMsg.sender_type === "admin") {
              toast({
                title: "New message from Team",
                description: newMsg.content.slice(0, 50) + (newMsg.content.length > 50 ? "..." : ""),
              });
              // Flash tab title with business name
              const businessName = data?.business?.name || "Portal";
              document.title = `(1) New message — ${businessName}`;
              setTimeout(() => {
                document.title = originalTitle.current;
              }, 5000);
              // Mark as read since user is viewing
              markAdminMessagesAsRead(token);
            }

            // Append to end (oldest→newest order)
            return {
              ...prev,
              messages: [
                ...prev.messages,
                {
                  id: newMsg.id,
                  content: newMsg.content,
                  sender_type: newMsg.sender_type,
                  created_at: newMsg.created_at,
                  read_at: newMsg.read_at,
                },
              ],
            };
          });

          // Auto-scroll to bottom for new messages
          setTimeout(scrollToBottom, 100);
        }
      )
      .subscribe((status) => {
        console.log("📡 Portal subscription status:", status);
      });

    return () => {
      console.log("🔌 Cleaning up portal realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [token, data?.business.name, scrollToBottom]);

  async function fetchPortalData(portalToken: string, messagesBefore?: string) {
    try {
      if (!messagesBefore) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams({ messages_limit: "50" });
      if (messagesBefore) {
        params.set("messages_before", messagesBefore);
      }

      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/portal/${portalToken}?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      const response = await res.json();

      if (!res.ok) {
        console.error("Portal fetch error:", response.error);
        setError("Portal not found");
        return;
      }

      if (response?.error) {
        console.error("Portal API error:", response.error);
        setError(response.error);
        return;
      }

      if (messagesBefore) {
        // Prepend older messages (they come in ascending order, so prepend to maintain oldest→newest)
        setData((prev) => {
          if (!prev) return response;
          return {
            ...response,
            messages: [...response.messages, ...prev.messages],
          };
        });
      } else {
        setData(response);
        // Scroll to bottom after initial load
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error("Portal fetch exception:", err);
      setError("Failed to load portal");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  async function markAdminMessagesAsRead(portalToken: string) {
    // Throttle: skip if already in flight
    if (markReadInFlight.current) return;
    markReadInFlight.current = true;

    try {
      console.log("📖 Marking admin messages as read...");
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/messages/${portalToken}/mark-read`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      const response = await res.json();

      if (!res.ok) {
        console.error("Mark read error:", response.error);
        return;
      }

      if (response?.marked_count > 0) {
        console.log(`Marked ${response.marked_count} admin messages as read`);
      }
    } catch (err) {
      console.error("Mark read exception:", err);
    } finally {
      markReadInFlight.current = false;
    }
  }

  function handleLoadOlderMessages() {
    if (!token || !data || data.messages.length === 0) return;
    // Oldest message is at the beginning (index 0)
    const oldestMessage = data.messages[0];
    fetchPortalData(token, oldestMessage.created_at);
  }

  async function handleSendMessage() {
    if (!token || !messageContent.trim()) return;

    setSending(true);
    setSendError(null);

    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/messages/${token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ content: messageContent.trim() }),
        }
      );

      const response = await res.json();

      if (!res.ok) {
        console.error("Send message error:", response.error);
        setSendError("Failed to send message");
        return;
      }

      if (response?.error) {
        console.error("Send message API error:", response.error);
        setSendError(response.error);
        return;
      }

      // Show success toast
      toast({
        title: "Message sent",
        description: "Your message has been delivered.",
      });

      // Optimistically add message to end (oldest→newest)
      if (response?.message) {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [
              ...prev.messages,
              {
                id: response.message.id,
                content: response.message.content,
                sender_type: response.message.sender_type,
                created_at: response.message.created_at,
                read_at: response.message.read_at,
              },
            ],
          };
        });
        setTimeout(scrollToBottom, 100);
      }

      setMessageContent("");
    } catch (err) {
      console.error("Send message exception:", err);
      setSendError("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  async function handleFileUpload(file: File) {
    if (!token) return;
    setUploading(true);
    setUploadError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      if (uploadDesc.trim()) fd.append("description", uploadDesc.trim());

      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/files/${encodeURIComponent(token)}/upload`,
        {
          method: "POST",
          body: fd,
        }
      );

      const response = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Upload error:", response.error);
        setUploadError(response.error || "Upload failed");
        return;
      }

      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully.",
      });

      // Optimistic update so file appears immediately
      if (response?.file) {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            files: [response.file, ...prev.files],
          };
        });
      }

      setUploadDesc("");
    } catch (err) {
      console.error("Upload exception:", err);
      setUploadError("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading) setIsDragging(true);
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading) setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    // Ignore drops while uploading
    if (uploading) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }

  function isPdf(fileType: string): boolean {
    return fileType.toLowerCase() === "application/pdf";
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function formatCurrency(cents: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">Portal Not Found</h2>
            <p className="text-muted-foreground">{error || "Invalid or expired portal link"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3 max-w-4xl flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
            <span className="text-sm">Home</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Business Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{data.business.name}</h1>
            <Badge variant={data.business.status === "active" ? "default" : "secondary"}>
              {data.business.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">Client Portal</p>
        </div>

        <div className="grid gap-6">
          {/* Messages Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Messages ({data.messages.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Message Composer */}
              <div className="mb-6 space-y-2">
                <Textarea
                  placeholder="Type your message..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  disabled={sending}
                  className="min-h-[80px]"
                />
                {sendError && (
                  <p className="text-sm text-destructive">{sendError}</p>
                )}
                <Button
                  onClick={handleSendMessage}
                  disabled={sending || !messageContent.trim()}
                  className="w-full sm:w-auto"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Message
                </Button>
              </div>

              {/* Messages List (oldest→newest, with load more at top) */}
              {data.messages.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No messages yet</p>
              ) : (
                <div className="space-y-4">
                  {data.pagination.has_more_messages && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleLoadOlderMessages}
                      disabled={loadingMore}
                    >
                      {loadingMore ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Load older messages
                    </Button>
                  )}
                  
                  {data.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-lg ${
                        msg.sender_type === "admin"
                          ? "bg-primary/10 border-l-4 border-primary"
                          : "bg-muted"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="text-xs">
                          {msg.sender_type === "admin" ? "Team" : "You"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(msg.created_at)}
                        </span>
                      </div>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  ))}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Files Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Files ({data.files.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Upload Form with Drag & Drop */}
              <div 
                className={`mb-6 p-4 border-2 border-dashed rounded-lg space-y-3 transition-colors ${
                  isDragging 
                    ? "border-primary bg-primary/5" 
                    : "border-border"
                } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">
                    {isDragging ? "Drop file here" : "Upload a file"}
                  </span>
                </div>
                
                {!isDragging && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="file-upload" className="sr-only">Choose file</Label>
                      <Input
                        id="file-upload"
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload(f);
                          e.currentTarget.value = "";
                        }}
                        disabled={uploading}
                        className="cursor-pointer"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="file-desc">Description (optional)</Label>
                      <Input
                        id="file-desc"
                        value={uploadDesc}
                        onChange={(e) => setUploadDesc(e.target.value)}
                        placeholder="e.g., Floor plan PDF, inspiration image..."
                        disabled={uploading}
                      />
                    </div>
                  </>
                )}
                
                {uploadError && (
                  <p className="text-sm text-destructive">{uploadError}</p>
                )}
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground">
                  {isDragging ? "Release to upload" : "Drag & drop or choose file • Images + PDF • Max 10MB"}
                </p>
              </div>

              {data.files.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No files uploaded yet</p>
              ) : (
                <div className="space-y-3">
                  {data.files.map((file) => {
                    const fileUrl = proxyMediaUrl(file.id, token);
                    const isImage = isImageType(file.file_type);
                    
                    return (
                      <div key={file.id} className="p-3 bg-muted rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getFileIcon(file.file_type)}</span>
                            <div>
                              <p className="font-medium">{file.file_name}</p>
                              {file.description && (
                                <p className="text-sm text-muted-foreground">{file.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">{file.file_type.split('/')[1] || file.file_type}</Badge>
                            {isPdf(file.file_type) && (
                              <button
                                onClick={() => setPdfPreview({ url: fileUrl, name: file.file_name })}
                                className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-background transition-colors"
                                title="Preview PDF"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            )}
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-background transition-colors"
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                        
                        {/* Image preview */}
                        {isImage && (
                          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="block">
                            <img
                              src={fileUrl}
                              alt={file.file_name}
                              className="max-h-48 rounded-md border border-border object-contain"
                              loading="lazy"
                            />
                          </a>
                        )}
                        
                        <p className="text-xs text-muted-foreground">
                          {formatDate(file.created_at)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payments ({data.payments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.payments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No payment history</p>
              ) : (
                <div className="space-y-3">
                  {data.payments.map((payment, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{formatCurrency(payment.amount_cents)}</p>
                        <p className="text-sm text-muted-foreground">{payment.payment_type}</p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            payment.status === "completed"
                              ? "default"
                              : payment.status === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {payment.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(payment.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {pdfPreview && (
        <div 
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPdfPreview(null)}
        >
          <div 
            className="bg-card border border-border rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold truncate">{pdfPreview.name}</h3>
              <button
                onClick={() => setPdfPreview(null)}
                className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0 p-4">
              <iframe
                src={pdfPreview.url}
                title={pdfPreview.name}
                className="w-full h-[70vh] rounded border border-border"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
