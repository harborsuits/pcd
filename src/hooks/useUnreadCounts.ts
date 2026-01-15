import { useState, useEffect, useCallback } from 'react';
import { portalSupabase } from '@/integrations/supabase/portalClient';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface UnreadCounts {
  messages: number;
  comments: number;
  files: number;
  notifications: number;
}

// Storage key for last-read timestamps
const getStorageKey = (token: string) => `pcd_last_read_${token}`;

export function useUnreadCounts(token: string) {
  const [counts, setCounts] = useState<UnreadCounts>({
    messages: 0,
    comments: 0,
    files: 0,
    notifications: 0,
  });
  const [lastRead, setLastRead] = useState<Record<string, string>>({});

  // Load last-read timestamps from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(getStorageKey(token));
    if (stored) {
      try {
        setLastRead(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse last-read timestamps:', e);
      }
    }
  }, [token]);

  // Save last-read timestamps to localStorage
  const markAsRead = useCallback((key: 'messages' | 'comments' | 'files' | 'notifications') => {
    const now = new Date().toISOString();
    const newLastRead = { ...lastRead, [key]: now };
    setLastRead(newLastRead);
    localStorage.setItem(getStorageKey(token), JSON.stringify(newLastRead));
    
    // Also update counts immediately
    setCounts(prev => ({ ...prev, [key]: 0 }));
  }, [token, lastRead]);

  // Fetch unread counts
  const fetchCounts = useCallback(async () => {
    try {
      const { data: { session } } = await portalSupabase.auth.getSession();
      if (!session?.access_token) return;

      const authToken = session.access_token;
      
      // Get last read times from state
      const messagesLastRead = lastRead.messages || '1970-01-01T00:00:00Z';
      const filesLastRead = lastRead.files || '1970-01-01T00:00:00Z';
      const notificationsLastRead = lastRead.notifications || '1970-01-01T00:00:00Z';

      // Fetch messages unread count - count operator messages since last read
      const messagesRes = await fetch(
        `${SUPABASE_URL}/functions/v1/messages/${token}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      
      let messagesCount = 0;
      if (messagesRes.ok) {
        const data = await messagesRes.json();
        if (data.messages) {
          // Count operator messages that are newer than lastRead
          messagesCount = data.messages.filter(
            (m: { sender_type: string; created_at: string }) => 
              m.sender_type === 'operator' && 
              new Date(m.created_at) > new Date(messagesLastRead)
          ).length;
        }
      }

      // Fetch files unread count
      const filesRes = await fetch(
        `${SUPABASE_URL}/functions/v1/files/${token}/list`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      
      let filesCount = 0;
      if (filesRes.ok) {
        const data = await filesRes.json();
        if (data.files) {
          // Count files uploaded by operator since lastRead
          filesCount = data.files.filter(
            (f: { uploader_type?: string; created_at: string }) =>
              f.uploader_type === 'operator' &&
              new Date(f.created_at) > new Date(filesLastRead)
          ).length;
        }
      }

      // Fetch notifications count
      const notificationsRes = await fetch(
        `${SUPABASE_URL}/functions/v1/portal/${token}/notifications`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      
      let notificationsCount = 0;
      if (notificationsRes.ok) {
        const data = await notificationsRes.json();
        if (data.notifications) {
          notificationsCount = data.notifications.filter(
            (n: { created_at: string }) => 
              new Date(n.created_at) > new Date(notificationsLastRead)
          ).length;
        }
      }

      setCounts({
        messages: messagesCount,
        comments: 0, // Comments tracked differently via thread_reads
        files: filesCount,
        notifications: notificationsCount,
      });
    } catch (err) {
      console.error('Failed to fetch unread counts:', err);
    }
  }, [token, lastRead]);

  // Fetch on mount and when lastRead changes
  useEffect(() => {
    if (token && Object.keys(lastRead).length >= 0) {
      fetchCounts();
    }
  }, [token, fetchCounts]);

  // Refresh counts when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchCounts();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchCounts]);

  return { counts, markAsRead, refresh: fetchCounts };
}
