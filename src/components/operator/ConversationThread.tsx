import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Phone, Building2, Ban, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { operatorSupabase } from "@/integrations/supabase/operatorClient";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface ConversationThreadProps {
  leadId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OutreachEvent {
  id: string;
  lead_id: string;
  channel: string;
  message: string | null;
  status: string;
  created_at: string;
  error: string | null;
  delivery_status: string | null;
  delivery_error_code: string | null;
  direction: string;
  seen_at: string | null;
  provider_message_id: string | null;
}

interface Lead {
  id: string;
  business_name: string;
  phone: string | null;
  phone_e164: string | null;
  phone_raw: string | null;
  demo_url: string | null;
  outreach_status: string | null;
}

async function getAuthHeaders() {
  const { data: { session } } = await operatorSupabase.auth.getSession();
  return {
    Authorization: `Bearer ${session?.access_token || ""}`,
    "Content-Type": "application/json",
  };
}

export function ConversationThread({ leadId, open, onOpenChange }: ConversationThreadProps) {
  const [replyText, setReplyText] = useState("");
  const queryClient = useQueryClient();

  // Fetch lead info
  const { data: lead, isLoading: leadLoading } = useQuery({
    queryKey: ["lead-detail", leadId],
    queryFn: async () => {
      const { data, error } = await operatorSupabase
        .from("leads")
        .select("id, business_name, phone, phone_e164, phone_raw, demo_url, outreach_status")
        .eq("id", leadId)
        .single();
      if (error) throw error;
      return data as Lead;
    },
    enabled: open,
  });

  // Fetch all messages for this lead
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["lead-conversation", leadId],
    queryFn: async () => {
      const { data, error } = await operatorSupabase
        .from("lead_outreach_events")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as OutreachEvent[];
    },
    enabled: open,
    refetchInterval: 10000, // Poll every 10s for new messages
  });

  // Send reply mutation - sends immediately via /sms/send-reply
  const sendReplyMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!lead) throw new Error("Lead not found");
      const phone = lead.phone_e164 || lead.phone_raw || lead.phone;
      if (!phone) throw new Error("No phone number available");

      const headers = await getAuthHeaders();
      
      // Call the send-reply endpoint to send immediately
      const res = await fetch(`${SUPABASE_URL}/functions/v1/sms/send-reply`, {
        method: "POST",
        headers,
        body: JSON.stringify({ lead_id: leadId, message }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to send reply");
      }
      
      return data;
    },
    onSuccess: () => {
      toast.success("Reply sent");
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: ["lead-conversation", leadId] });
      queryClient.invalidateQueries({ queryKey: ["outreach-events"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Suppress contact mutation
  const suppressMutation = useMutation({
    mutationFn: async () => {
      if (!lead) throw new Error("Lead not found");
      const phone = lead.phone_e164 || lead.phone_raw || lead.phone;
      if (!phone) throw new Error("No phone number available");

      const headers = await getAuthHeaders();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/outreach/suppress`, {
        method: "POST",
        headers,
        body: JSON.stringify({ phone, reason: "manual", lead_id: leadId }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to suppress");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Contact suppressed");
      queryClient.invalidateQueries({ queryKey: ["lead-detail", leadId] });
      queryClient.invalidateQueries({ queryKey: ["outreach-suppressions"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const getStatusIcon = (event: OutreachEvent) => {
    if (event.delivery_status === "delivered") {
      return <CheckCircle2 className="h-3 w-3 text-green-500" />;
    }
    if (event.delivery_status === "failed" || event.delivery_status === "undelivered" || event.status === "failed") {
      return <XCircle className="h-3 w-3 text-destructive" />;
    }
    if (event.status === "sent") {
      return <CheckCircle2 className="h-3 w-3 text-blue-500" />;
    }
    if (event.status === "queued") {
      return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
    return null;
  };

  const isLoading = leadLoading || messagesLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {lead?.business_name || "Conversation"}
          </DialogTitle>
          {lead && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span className="font-mono">{lead.phone_e164 || lead.phone || "No phone"}</span>
              {lead.outreach_status && (
                <Badge variant="outline" className="ml-2">{lead.outreach_status}</Badge>
              )}
            </div>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 min-h-[300px] max-h-[400px] pr-4">
              <div className="space-y-3 py-4">
                {messages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No messages yet.</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === "inbound" ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-3 py-2 ${
                          msg.direction === "inbound"
                            ? "bg-muted text-foreground"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <div className={`flex items-center gap-1 mt-1 text-xs ${
                          msg.direction === "inbound" ? "text-muted-foreground" : "text-primary-foreground/70"
                        }`}>
                          <span>{format(new Date(msg.created_at), "MMM d, h:mm a")}</span>
                          {msg.direction === "outbound" && getStatusIcon(msg)}
                          {msg.error && (
                            <span className="text-destructive ml-1">({msg.error})</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <div className="border-t pt-4 space-y-3">
              <Textarea
                placeholder="Type your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[80px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.metaKey && replyText.trim()) {
                    sendReplyMutation.mutate(replyText.trim());
                  }
                }}
              />
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => suppressMutation.mutate()}
                  disabled={suppressMutation.isPending}
                >
                  {suppressMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Ban className="h-4 w-4 mr-2" />
                  )}
                  Suppress Contact
                </Button>
                <Button
                  onClick={() => sendReplyMutation.mutate(replyText.trim())}
                  disabled={!replyText.trim() || sendReplyMutation.isPending}
                >
                  {sendReplyMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Reply
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Press ⌘+Enter to send instantly
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
