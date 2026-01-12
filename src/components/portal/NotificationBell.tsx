import { useState, useEffect, useCallback } from 'react';
import { Bell, MessageCircle, Globe, Phone, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface Notification {
  id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

interface NotificationBellProps {
  token: string;
  onNavigate?: (tab: string) => void;
}

const EVENT_ICONS: Record<string, typeof Bell> = {
  prototype_added: Globe,
  message_received: MessageCircle,
  ai_status_changed: Phone,
  file_uploaded: FileText,
  milestone_completed: CheckCircle2,
};

const EVENT_TITLES: Record<string, string> = {
  prototype_added: 'New website preview',
  message_received: 'New message',
  ai_status_changed: 'AI status update',
  file_uploaded: 'New file uploaded',
  milestone_completed: 'Milestone completed',
};

function getEventDescription(notification: Notification): string {
  const { event_type, payload } = notification;
  
  switch (event_type) {
    case 'prototype_added':
      return 'A new version of your website is ready for review.';
    case 'message_received':
      return (payload as { preview?: string }).preview || 'You have a new message.';
    case 'ai_status_changed':
      return `Your AI receptionist is now ${(payload as { status?: string }).status || 'updated'}.`;
    case 'file_uploaded':
      return `New file: ${(payload as { file_name?: string }).file_name || 'uploaded'}`;
    case 'milestone_completed':
      return `${(payload as { milestone?: string }).milestone || 'A milestone'} has been completed.`;
    default:
      return 'You have a new update.';
  }
}

function getEventTab(eventType: string): string | null {
  switch (eventType) {
    case 'prototype_added':
      return 'website';
    case 'message_received':
      return 'messages';
    case 'file_uploaded':
      return 'files';
    case 'ai_status_changed':
      return 'ai';
    default:
      return 'updates';
  }
}

export function NotificationBell({ token, onNavigate }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [lastReadTime, setLastReadTime] = useState<string>('1970-01-01T00:00:00Z');

  // Load last read time from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`pcd_notifications_read_${token}`);
    if (stored) {
      setLastReadTime(stored);
    }
  }, [token]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/portal/${token}/notifications`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Mark as read when popover opens
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      const now = new Date().toISOString();
      setLastReadTime(now);
      localStorage.setItem(`pcd_notifications_read_${token}`, now);
    }
  };

  // Calculate unread count
  const unreadCount = notifications.filter(
    n => new Date(n.created_at) > new Date(lastReadTime)
  ).length;

  const handleNotificationClick = (notification: Notification) => {
    const tab = getEventTab(notification.event_type);
    if (tab && onNavigate) {
      onNavigate(tab);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h4 className="font-medium text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} new
            </Badge>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.slice(0, 10).map((notification) => {
                const Icon = EVENT_ICONS[notification.event_type] || Bell;
                const isUnread = new Date(notification.created_at) > new Date(lastReadTime);
                
                return (
                  <button
                    key={notification.id}
                    className={`w-full p-3 flex items-start gap-3 text-left hover:bg-muted/50 transition-colors ${
                      isUnread ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isUnread ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${isUnread ? 'font-medium' : ''}`}>
                        {EVENT_TITLES[notification.event_type] || 'Update'}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {getEventDescription(notification)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
