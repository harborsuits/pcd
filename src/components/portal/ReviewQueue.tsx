import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  ClipboardCheck, ExternalLink, CheckCircle, XCircle, 
  MessageSquare, Loader2, FileText, Image, Link as LinkIcon 
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface ReviewItem {
  id: string;
  title: string;
  description: string | null;
  item_type: string;
  item_url: string | null;
  item_content: string | null;
  status: string;
  client_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ReviewQueueProps {
  items: ReviewItem[];
  token: string;
  onItemUpdated: (itemId: string, newStatus: string, notes?: string) => void;
}

function getItemIcon(type: string) {
  switch (type) {
    case "draft":
      return <FileText className="h-4 w-4" />;
    case "image":
      return <Image className="h-4 w-4" />;
    case "link":
      return <LinkIcon className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "approved":
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Approved</Badge>;
    case "changes_requested":
      return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Changes Requested</Badge>;
    default:
      return <Badge variant="secondary">Pending Review</Badge>;
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function ReviewQueue({ items, token, onItemUpdated }: ReviewQueueProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [submitting, setSubmitting] = useState<string | null>(null);

  const pendingItems = items.filter(i => i.status === "pending");
  const reviewedItems = items.filter(i => i.status !== "pending");

  async function handleAction(itemId: string, action: "approve" | "request_changes") {
    setSubmitting(itemId);
    
    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/portal/${token}/review/${itemId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            action,
            notes: action === "request_changes" ? feedbackText : undefined,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit");
      }

      toast({
        title: action === "approve" ? "Approved!" : "Feedback submitted",
        description: action === "approve" 
          ? "We'll move forward with this." 
          : "We'll make the changes you requested.",
      });

      onItemUpdated(itemId, data.status, action === "request_changes" ? feedbackText : undefined);
      setExpandedItem(null);
      setFeedbackText("");
    } catch (err: unknown) {
      console.error("Review action error:", err);
      toast({
        title: "Something went wrong",
        description: "Please try again or contact us for help.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(null);
    }
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Review Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nothing to review yet</p>
            <p className="text-sm">When we have work ready for your feedback, it will appear here.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" />
          Review Queue ({pendingItems.length} pending)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pending Items */}
        {pendingItems.length > 0 && (
          <div className="space-y-3">
            {pendingItems.map((item) => (
              <div key={item.id} className="border border-border rounded-lg overflow-hidden">
                <div className="p-4 bg-muted/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-md bg-primary/10 text-primary">
                        {getItemIcon(item.item_type)}
                      </div>
                      <div>
                        <h4 className="font-medium">{item.title}</h4>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Added {formatDate(item.created_at)}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                  
                  {/* Preview link or content */}
                  {item.item_url && (
                    <a 
                      href={item.item_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-3 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Preview
                    </a>
                  )}
                  
                  {item.item_content && (
                    <div className="mt-3 p-3 bg-background rounded-md text-sm">
                      {item.item_content}
                    </div>
                  )}
                </div>
                
                {/* Action Panel */}
                <div className="p-4 border-t border-border bg-background">
                  {expandedItem === item.id ? (
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Tell us what changes you'd like..."
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setExpandedItem(null);
                            setFeedbackText("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAction(item.id, "request_changes")}
                          disabled={!feedbackText.trim() || submitting === item.id}
                        >
                          {submitting === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <MessageSquare className="h-4 w-4 mr-1" />
                          )}
                          Submit Feedback
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAction(item.id, "approve")}
                        disabled={submitting === item.id}
                        className="flex-1"
                      >
                        {submitting === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-1" />
                        )}
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setExpandedItem(item.id)}
                        disabled={submitting === item.id}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Request Changes
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reviewed Items */}
        {reviewedItems.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Previously Reviewed</p>
            {reviewedItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  {getItemIcon(item.item_type)}
                  <span className="text-sm">{item.title}</span>
                </div>
                {getStatusBadge(item.status)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
