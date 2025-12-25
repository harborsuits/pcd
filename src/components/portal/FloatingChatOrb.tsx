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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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
  const [position, setPosition] = useState({ x: 24, y: 24 }); // bottom-right offset
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const seenMessageIds = useRef<Set<string>>(new Set());

  // Scroll to bottom when messages change or panel opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [isOpen, isMinimized, messages.length]);

  // Compute last client message index
  const lastClientMsgIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender_type === "client") return i;
    }
    return -1;
  }, [messages]);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, textarea, input')) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = dragStart.current.x - e.clientX;
    const deltaY = dragStart.current.y - e.clientY;
    
    const newX = Math.max(0, Math.min(window.innerWidth - 80, dragStart.current.posX + deltaX));
    const newY = Math.max(0, Math.min(window.innerHeight - 80, dragStart.current.posY + deltaY));
    
    setPosition({ x: newX, y: newY });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Touch handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button, textarea, input')) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      posX: position.x,
      posY: position.y,
    };
  }, [position]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    
    const deltaX = dragStart.current.x - touch.clientX;
    const deltaY = dragStart.current.y - touch.clientY;
    
    const newX = Math.max(0, Math.min(window.innerWidth - 80, dragStart.current.posX + deltaX));
    const newY = Math.max(0, Math.min(window.innerHeight - 80, dragStart.current.posY + deltaY));
    
    setPosition({ x: newX, y: newY });
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      return () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleTouchMove, handleTouchEnd]);

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

  const getDeliveryStatus = (msg: ChatMessage) => {
    if (msg.read_at) return `Seen`;
    if (msg.delivered_at) return "Delivered";
    return "Sent";
  };

  // Collapsed orb state
  if (!isOpen) {
    return (
      <div
        ref={orbRef}
        className="fixed z-50 cursor-pointer select-none"
        style={{ 
          right: position.x, 
          bottom: position.y,
          touchAction: 'none',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="relative w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center group"
          aria-label="Open chat"
        >
          <MessageSquare className="h-6 w-6 group-hover:scale-110 transition-transform" />
          
          {/* Unread badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          
          {/* Subtle pulse ring when there are unread messages */}
          {unreadCount > 0 && (
            <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
          )}
        </button>
      </div>
    );
  }

  // Minimized header bar
  if (isMinimized) {
    return (
      <div
        ref={panelRef}
        className="fixed z-50 cursor-move select-none"
        style={{ 
          right: position.x, 
          bottom: position.y,
          touchAction: 'none',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="w-72 bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-primary/5 border-b border-border">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Messages</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full">
                  {unreadCount}
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

  // Expanded panel
  return (
    <div
      ref={panelRef}
      className="fixed z-50 select-none"
      style={{ 
        right: position.x, 
        bottom: position.y,
        touchAction: 'none',
      }}
    >
      <div className="w-80 sm:w-96 h-[480px] sm:h-[520px] bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
        {/* Header - draggable */}
        <div 
          className="flex items-center justify-between px-4 py-3 bg-primary/5 border-b border-border cursor-move shrink-0"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
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
                {loadingMore ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : null}
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
