import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface PushSubscriptionState {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  permission: NotificationPermission | null;
}

export function usePushNotifications(projectToken: string | undefined) {
  const [state, setState] = useState<PushSubscriptionState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: true,
    permission: null,
  });

  // Check support and existing subscription on mount
  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      
      if (!isSupported) {
        setState({
          isSupported: false,
          isSubscribed: false,
          isLoading: false,
          permission: null,
        });
        return;
      }

      const permission = Notification.permission;
      let isSubscribed = false;

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        isSubscribed = !!subscription;
      } catch (e) {
        console.error("Failed to check push subscription:", e);
      }

      setState({
        isSupported: true,
        isSubscribed,
        isLoading: false,
        permission,
      });
    };

    checkSupport();
  }, []);

  // Register service worker on app load
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Service worker registration failed:", err);
      });
    }
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!projectToken || !state.isSupported) return false;

    setState((s) => ({ ...s, isLoading: true }));

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState((s) => ({ ...s, isLoading: false, permission }));
        return false;
      }

      // Get VAPID public key
      const vapidRes = await fetch(`${SUPABASE_URL}/functions/v1/push/vapid-public-key`);
      if (!vapidRes.ok) {
        throw new Error("Failed to get VAPID key");
      }
      const { publicKey } = await vapidRes.json();

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      // Send subscription to server
      const subscribeRes = await fetch(`${SUPABASE_URL}/functions/v1/push/${projectToken}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          who: "client",
        }),
      });

      if (!subscribeRes.ok) {
        throw new Error("Failed to save subscription");
      }

      setState({
        isSupported: true,
        isSubscribed: true,
        isLoading: false,
        permission: "granted",
      });

      return true;
    } catch (error) {
      console.error("Push subscription error:", error);
      setState((s) => ({ ...s, isLoading: false }));
      return false;
    }
  }, [projectToken, state.isSupported]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!projectToken) return false;

    setState((s) => ({ ...s, isLoading: true }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe locally
        await subscription.unsubscribe();

        // Notify server
        await fetch(`${SUPABASE_URL}/functions/v1/push/${projectToken}/unsubscribe`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
      }

      setState((s) => ({
        ...s,
        isSubscribed: false,
        isLoading: false,
      }));

      return true;
    } catch (error) {
      console.error("Push unsubscribe error:", error);
      setState((s) => ({ ...s, isLoading: false }));
      return false;
    }
  }, [projectToken]);

  return {
    ...state,
    subscribe,
    unsubscribe,
  };
}

// Convert base64 to Uint8Array for applicationServerKey
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
