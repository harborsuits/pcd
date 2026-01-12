import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, MessageCircle, WifiOff, RotateCcw, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { reportError } from "@/lib/errorReporting";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Fallback polling interval
const POLLING_INTERVAL_MS = 10000;

interface Message {
  id: string;
  content: string;
  sender_type: 'client' | 'operator';
  created_at: string;
}

interface MessagesTabProps {
  token: string;
  businessName: string;
}

// Helper to format date headers
function formatDateHeader(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEEE, MMMM d');
}

// Suggested message starters
const MESSAGE_STARTERS = [
  "Hi, I have a question about my project...",
  "I'd like to request a change to...",
  "Can you help me with..."
];

export function MessagesTab({ token, businessName }: MessagesTabProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(true);
  const [lastReadTime, setLastReadTime] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load last read time from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`pcd_messages_read_${token}`);
    setLastReadTime(stored);
  }, [token]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: Date; messages: Message[] }[] = [];
    
    messages.forEach((msg) => {
      const msgDate = new Date(msg.created_at);
      const lastGroup = groups[groups.length - 1];
      
      if (lastGroup && isSameDay(lastGroup.date, msgDate)) {
        lastGroup.messages.push(msg);
      } else {
        groups.push({ date: msgDate, messages: [msg] });
      }
    });
    
    return groups;
  }, [messages]);

  // Find the first unread message index
  const firstUnreadIndex = useMemo(() => {
    if (!lastReadTime) return -1;
    const lastReadDate = new Date(lastReadTime);
    
    for (let i = 0; i < messages.length; i++) {
      if (
        messages[i].sender_type === 'operator' &&
        new Date(messages[i].created_at) > lastReadDate
      ) {
        return i;
      }
    }
    return -1;
  }, [messages, lastReadTime]);

  // Mark messages as read when viewed (local storage for UI)
  useEffect(() => {
    if (messages.length > 0) {
      const now = new Date().toISOString();
      localStorage.setItem(`pcd_messages_read_${token}`, now);
      setLastReadTime(now);
    }
  }, [token, messages.length]);

  // Mark admin/operator messages as read on the backend when client views them
  useEffect(() => {
    // Skip if still loading or no messages
    if (loading || messages.length === 0) return;
    
    // Check if there are any operator messages (these are "admin" messages from client perspective)
    const hasOperatorMessages = messages.some(m => m.sender_type === 'operator');
    
    if (!hasOperatorMessages) return;
    
    // Call mark-read endpoint - fire and forget
    const markRead = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        
        await fetch(
          `${SUPABASE_URL}/functions/v1/messages/${token}/mark-read`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );
      } catch (err) {
        console.warn('[MessagesTab] Failed to mark messages read:', err);
      }
    };
    
    markRead();
  }, [loading, messages, token]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const { data: { session }, error: sessErr } = await supabase.auth.getSession();
      
      // Hard fail if no session - don't fallback to anon
      if (sessErr || !session?.access_token) {
        console.warn('[MessagesTab] No session for fetchMessages, skipping');
        setLoading(false);
        return;
      }
      
      const accessToken = session.access_token;
      
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/messages/${token}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await res.json();
      if (res.ok && data.messages) {
        setMessages(data.messages);
      } else {
        reportError(`Failed to fetch messages: ${res.status}`, { action: 'fetchMessages', token });
      }
    } catch (err) {
      console.error("Fetch messages error:", err);
      reportError(err instanceof Error ? err : String(err), { action: 'fetchMessages', token });
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Start/stop fallback polling based on realtime connection status
  useEffect(() => {
    if (!isRealtimeConnected) {
      console.log('[MessagesTab] Realtime disconnected, starting fallback polling');
      pollingIntervalRef.current = setInterval(() => {
        fetchMessages();
      }, POLLING_INTERVAL_MS);
    } else if (pollingIntervalRef.current) {
      console.log('[MessagesTab] Realtime connected, stopping polling');
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isRealtimeConnected, fetchMessages]);

  // Refetch on tab focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[MessagesTab] Tab focused, refetching messages');
        fetchMessages();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchMessages]);

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to realtime message updates (token-scoped)
    const channel = supabase
      .channel(`messages-${token}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `project_token=eq.${token}`,
        },
        (payload) => {
          console.log('New message received via realtime:', payload);
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe((status) => {
        console.log('[MessagesTab] Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setIsRealtimeConnected(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsRealtimeConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [token, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    
    setSending(true);
    setSendError(null);
    
    // Store message content for retry
    const messageContent = newMessage.trim();
    
    try {
      const { data: { session }, error: sessErr } = await supabase.auth.getSession();
      
      // Hard fail if no session - require auth
      if (sessErr || !session?.access_token) {
        setSendError("Please sign in again to send messages.");
        reportError("No session for sendMessage", { action: 'sendMessage', token });
        setSending(false);
        return;
      }
      
      const accessToken = session.access_token;
      
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/messages/${token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            content: messageContent,
            sender_type: "client",
          }),
        }
      );

      if (res.ok) {
        setNewMessage("");
        await fetchMessages();
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to send' }));
        setSendError(errorData.error || 'Failed to send message');
        reportError(`Send message failed: ${res.status}`, { action: 'sendMessage', token });
      }
    } catch (err) {
      console.error("Send message error:", err);
      setSendError('Network error. Please try again.');
      reportError(err instanceof Error ? err : String(err), { action: 'sendMessage', token });
    } finally {
      setSending(false);
    }
  };

  const handleRetry = () => {
    setSendError(null);
    sendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleStarterClick = (starter: string) => {
    setNewMessage(starter);
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
      {/* Connection status banner */}
      {!isRealtimeConnected && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs">
          <WifiOff className="h-3 w-3" />
          <span>Live updates unavailable. Messages will refresh automatically.</span>
        </div>
      )}
      
      {/* Messages list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Start a conversation</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Send us a message if you have questions, want to share additional details, or need to make changes.
            </p>
            
            {/* Suggested starters */}
            <div className="space-y-2 w-full max-w-xs">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 justify-center">
                <Sparkles className="h-3 w-3" />
                Quick starters
              </p>
              {MESSAGE_STARTERS.map((starter, idx) => (
                <button
                  key={idx}
                  onClick={() => handleStarterClick(starter)}
                  className="w-full text-left text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors truncate"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {groupedMessages.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-3">
                {/* Date header */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground font-medium">
                    {formatDateHeader(group.date)}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                
                {/* Messages in this group */}
                {group.messages.map((msg, msgIdx) => {
                  const globalIndex = messages.indexOf(msg);
                  const showNewBadge = globalIndex === firstUnreadIndex;
                  
                  return (
                    <div key={msg.id}>
                      {/* New messages divider */}
                      {showNewBadge && (
                        <div className="flex items-center gap-3 my-3">
                          <div className="flex-1 h-px bg-primary/50" />
                          <span className="text-xs font-medium text-primary px-2 py-0.5 bg-primary/10 rounded-full">
                            New messages
                          </span>
                          <div className="flex-1 h-px bg-primary/50" />
                        </div>
                      )}
                      
                      <div
                        className={`flex ${msg.sender_type === 'client' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                            msg.sender_type === 'client'
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-muted rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className={`text-xs mt-1 ${
                            msg.sender_type === 'client' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                            {format(new Date(msg.created_at), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Message input */}
      <div className="border-t border-border p-4 bg-card">
        {/* Error state with retry */}
        {sendError && (
          <div className="flex items-center justify-between gap-2 mb-3 p-2 rounded-md bg-destructive/10 border border-destructive/20">
            <span className="text-xs text-destructive">{sendError}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRetry}
              disabled={sending}
              className="h-6 text-xs px-2"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        )}
        
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
          />
          <Button 
            onClick={sendMessage} 
            disabled={!newMessage.trim() || sending}
            size="icon"
            className="flex-shrink-0"
            aria-label="Send"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
