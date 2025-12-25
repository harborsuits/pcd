import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { MessageSquare, X, Send, Loader2, ChevronUp, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatMessage {
  id: string;
  content: string;
  sender_type: string;
  created_at: string;
  read_at: string | null;
  delivered_at: string | null;
}

interface FloatingChatOrbProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => Promise<void>;
  sending: boolean;
  sendError: string | null;
  teamTyping: boolean;
  onTyping: (value: string) => void;
  hasMoreMessages: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  unreadCount?: number;
}

const STORAGE_KEY = "floating-chat-position";
const DEFAULT_OFFSET = { right: 24, bottom: 24 };

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function loadSavedPosition(): { right: number; bottom: number } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed.right === "number" && typeof parsed.bottom === "number") {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_OFFSET;
}

function savePosition(offset: { right: number; bottom: number }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(offset));
  } catch {}
}

export function FloatingChatOrb({
  messages,
  onSendMessage,
  sending,
  sendError,
  teamTyping,
  onTyping,
  hasMoreMessages,
  loadingMore,
  onLoadMore,
  unreadCount = 0,
}: FloatingChatOrbProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messageContent, setMessageContent] = useState("");

  // Store offsets from bottom-right (feels "anchored")
  const [offset, setOffset] = useState(loadSavedPosition);

  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, right: 24, bottom: 24 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const seenMessageIds = useRef<Set<string>>(new Set());

  // Scroll to bottom when messages change or panel opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      const t = window.setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 80);
      return () => window.clearTimeout(t);
    }
  }, [isOpen, isMinimized, messages.length]);

  // Compute last client message index
  const lastClientMsgIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender_type === "client") return i;
    }
    return -1;
  }, [messages]);

  const getDeliveryStatus = (msg: ChatMessage) => {
    if (msg.read_at) return "Seen";
    if (msg.delivered_at) return "Delivered";
    return "Sent";
  };

  const handleSend = async () => {
    if (!messageContent.trim() || sending) return;
    const content = messageContent;
    setMessageContent("");
    await onSendMessage(content);
  };

  const handleMessageChange = (value: string) => {
    setMessageContent(value);
    onTyping(value);
  };

  // Drag handlers using right/bottom offsets
  const beginDrag = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStart.current = {
      x: clientX,
      y: clientY,
      right: offset.right,
      bottom: offset.bottom,
    };
  }, [offset.right, offset.bottom]);

  const moveDrag = useCallback((clientX: number, clientY: number) => {
    const dx = dragStart.current.x - clientX;
    const dy = dragStart.current.y - clientY;

    // Since we're storing right/bottom offsets:
    // moving mouse LEFT increases right offset, moving DOWN decreases bottom offset
    const nextRight = dragStart.current.right + dx;
    const nextBottom = dragStart.current.bottom + dy;

    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

    // Keep it on-screen
    const maxRight = window.innerWidth - 60;
    const maxBottom = window.innerHeight - 60;

    setOffset({
      right: clamp(nextRight, 8, maxRight),
      bottom: clamp(nextBottom, 8, maxBottom),
    });
  }, []);

  const endDrag = useCallback(() => {
    setIsDragging(false);

    // Snap to edges
    const snapThreshold = 48;
    let snappedOffset = { ...offset };

    // Snap to right edge
    if (offset.right < snapThreshold) {
      snappedOffset.right = 16;
    }
    // Snap to left edge (when right offset is large = orb is on the left)
    if (offset.right > window.innerWidth - 100) {
      snappedOffset.right = window.innerWidth - 80;
    }
    // Snap to bottom
    if (offset.bottom < snapThreshold) {
      snappedOffset.bottom = 16;
    }
    // Snap to top (when bottom offset is large)
    if (offset.bottom > window.innerHeight - 100) {
      snappedOffset.bottom = window.innerHeight - 80;
    }

    setOffset(snappedOffset);
    savePosition(snappedOffset);
  }, [offset]);

  // Mouse events
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, textarea, input")) return;
    e.preventDefault();
    beginDrag(e.clientX, e.clientY);
  }, [beginDrag]);

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: MouseEvent) => moveDrag(e.clientX, e.clientY);
    const onUp = () => endDrag();

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, moveDrag, endDrag]);

  // Touch events
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest("button, textarea, input")) return;
    const touch = e.touches[0];
    beginDrag(touch.clientX, touch.clientY);
  }, [beginDrag]);

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      moveDrag(touch.clientX, touch.clientY);
    };
    const onEnd = () => endDrag();

    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("touchend", onEnd);
    return () => {
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    };
  }, [isDragging, moveDrag, endDrag]);

  // Common wrapper style
  const wrapperStyle: React.CSSProperties = {
    position: "fixed",
    right: offset.right,
    bottom: offset.bottom,
    zIndex: 60,
    touchAction: "none",
  };

  // COLLAPSED ORB
  if (!isOpen) {
    return (
      <div
        style={wrapperStyle}
        className="cursor-pointer select-none"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="relative w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center group"
          aria-label="Open chat"
        >
          <MessageSquare className="h-6 w-6 group-hover:scale-110 transition-transform" />
          
          {/* Unread badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          
          {/* Subtle pulse ring */}
          {unreadCount > 0 && (
            <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping pointer-events-none" />
          )}
        </button>
      </div>
    );
  }

  // MINIMIZED BAR
  if (isMinimized) {
    return (
      <div
        style={wrapperStyle}
        className="cursor-move select-none"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        <div className="w-72 bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-primary/5 border-b border-border">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Messages</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7" 
                onClick={() => setIsMinimized(false)}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7" 
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // EXPANDED PANEL
  return (
    <div style={wrapperStyle} className="select-none">
      <div className="w-80 sm:w-96 h-[480px] sm:h-[520px] bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
        {/* Header - draggable */}
        <div 
          className="flex items-center justify-between px-4 py-3 bg-primary/5 border-b border-border cursor-move shrink-0"
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="font-medium">Messages</span>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={() => setIsMinimized(true)}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* Load more button */}
          {hasMoreMessages && (
            <div className="flex justify-center pb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onLoadMore}
                disabled={loadingMore}
                className="text-xs h-7"
              >
                {loadingMore && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                Load older
              </Button>
            </div>
          )}

          {/* Empty state */}
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No messages yet</p>
              <p className="text-xs text-muted-foreground/70">Send a message to get started</p>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => {
                const isClient = msg.sender_type === "client";
                const isLastClientMsg = isClient && index === lastClientMsgIndex;
                
                // Animate only new messages
                const isNewMsg = !seenMessageIds.current.has(msg.id);
                if (isNewMsg) seenMessageIds.current.add(msg.id);

                return (
                  <div
                    key={msg.id}
                    className={`flex w-full ${isClient ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[85%] ${isNewMsg ? "bubble-in" : ""}`}>
                      <div
                        className={[
                          "rounded-2xl px-3 py-2 text-sm leading-relaxed",
                          isClient
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted text-foreground rounded-bl-sm",
                        ].join(" ")}
                      >
                        {msg.content}
                      </div>
                      
                      <div
                        className={[
                          "mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground",
                          isClient ? "justify-end" : "justify-start",
                        ].join(" ")}
                      >
                        <span>{formatDate(msg.created_at)}</span>
                        {isLastClientMsg && (
                          <span className={msg.read_at ? "receipt-pop" : ""}>
                            {getDeliveryStatus(msg)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {teamTyping && (
                <div className="flex w-full justify-start">
                  <div className="max-w-[85%]">
                    <div className="rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm">
                      <span className="typing-anim text-muted-foreground">Team is typing…</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Composer */}
        <div className="shrink-0 border-t border-border p-3 bg-card/50">
          <div className="flex gap-2">
            <Textarea
              placeholder="Type a message..."
              value={messageContent}
              onChange={(e) => handleMessageChange(e.target.value)}
              disabled={sending}
              className="min-h-[40px] max-h-[80px] resize-none flex-1 text-sm"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              onClick={handleSend}
              disabled={sending || !messageContent.trim()}
              size="icon"
              className="h-10 w-10 shrink-0"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {sendError && (
            <p className="text-xs text-destructive mt-1">{sendError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
