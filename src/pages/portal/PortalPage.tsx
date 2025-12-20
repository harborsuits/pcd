import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileText, MessageSquare, CreditCard, AlertCircle, Send, Home } from "lucide-react";

interface PortalMessage {
  content: string;
  sender_type: string;
  created_at: string;
  read_at: string | null;
}

interface PortalFile {
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

  useEffect(() => {
    console.log("✅ PortalPage mounted, token:", token?.slice(0, 8) + "...");
    if (token) {
      fetchPortalData(token);
    }
  }, [token]);

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

      const { data: response, error: fetchError } = await supabase.functions.invoke(
        `portal/${portalToken}?${params.toString()}`,
        { method: "GET" }
      );

      if (fetchError) {
        console.error("Portal fetch error:", fetchError);
        setError("Portal not found");
        return;
      }

      if (response?.error) {
        console.error("Portal API error:", response.error);
        setError(response.error);
        return;
      }

      if (messagesBefore) {
        // Append older messages using functional update to avoid stale closure
        setData((prev) => {
          if (!prev) return response;
          return {
            ...response,
            messages: [...prev.messages, ...response.messages],
          };
        });
      } else {
        setData(response);
      }
    } catch (err) {
      console.error("Portal fetch exception:", err);
      setError("Failed to load portal");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  function handleLoadOlderMessages() {
    if (!token || !data || data.messages.length === 0) return;
    const oldestMessage = data.messages[data.messages.length - 1];
    fetchPortalData(token, oldestMessage.created_at);
  }

  async function handleSendMessage() {
    if (!token || !messageContent.trim()) return;

    setSending(true);
    setSendError(null);

    try {
      const { data: response, error: sendErr } = await supabase.functions.invoke(
        `messages/${token}`,
        {
          method: "POST",
          body: { content: messageContent.trim() },
        }
      );

      if (sendErr) {
        console.error("Send message error:", sendErr);
        setSendError("Failed to send message");
        return;
      }

      if (response?.error) {
        console.error("Send message API error:", response.error);
        setSendError(response.error);
        return;
      }

      // Optimistically add message to the top of the list (newest first)
      if (response?.message) {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [
              {
                ...response.message,
                read_at: null,
              },
              ...prev.messages,
            ],
          };
        });
      }

      setMessageContent("");
    } catch (err) {
      console.error("Send message exception:", err);
      setSendError("Failed to send message");
    } finally {
      setSending(false);
    }
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

              {/* Messages List */}
              {data.messages.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No messages yet</p>
              ) : (
                <div className="space-y-4">
                  {data.messages.map((msg, idx) => (
                    <div
                      key={idx}
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
              {data.files.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No files uploaded</p>
              ) : (
                <div className="space-y-3">
                  {data.files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{file.file_name}</p>
                        {file.description && (
                          <p className="text-sm text-muted-foreground">{file.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{file.file_type}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(file.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
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
    </div>
  );
}
