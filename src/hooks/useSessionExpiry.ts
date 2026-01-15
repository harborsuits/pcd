import { useEffect, useRef, useState } from "react";
import { portalSupabase } from "@/integrations/supabase/portalClient";
import { toast } from "@/hooks/use-toast";

const SESSION_WARNING_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes before expiry
const SESSION_WARNING_KEY = "pcd_session_warning_shown";

/**
 * Hook to monitor session expiry and warn users before their session expires.
 * Shows a non-blocking toast when session is close to expiring.
 * Only shows warning once per session to avoid loops.
 * Returns showAuthModal and setShowAuthModal for handling 401s.
 */
export function useSessionExpiry() {
  const warningShownRef = useRef(false);
  const checkIntervalRef = useRef<number | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // Check if warning was already shown this session
    if (sessionStorage.getItem(SESSION_WARNING_KEY) === "true") {
      warningShownRef.current = true;
    }

    const checkSessionExpiry = async () => {
      if (warningShownRef.current) return;

      try {
        const { data: { session } } = await portalSupabase.auth.getSession();
        
        if (!session?.expires_at) return;

        const expiresAtMs = session.expires_at * 1000;
        const now = Date.now();
        const timeUntilExpiry = expiresAtMs - now;

        if (timeUntilExpiry > 0 && timeUntilExpiry <= SESSION_WARNING_THRESHOLD_MS) {
          warningShownRef.current = true;
          sessionStorage.setItem(SESSION_WARNING_KEY, "true");
          
          const minutesLeft = Math.ceil(timeUntilExpiry / 60000);
          
          toast({
            title: "Session expiring soon",
            description: `Your session will expire in about ${minutesLeft} minute${minutesLeft !== 1 ? "s" : ""}. Please save your work and refresh to stay signed in.`,
            duration: 15000, // Show for 15 seconds
          });
        }
      } catch (err) {
        console.error("Session expiry check failed:", err);
      }
    };

    // Check immediately and then every 2 minutes
    checkSessionExpiry();
    checkIntervalRef.current = window.setInterval(checkSessionExpiry, 2 * 60 * 1000);

    // Also listen for auth state changes to reset warning flag on new session
    const { data: { subscription } } = portalSupabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // Reset the warning flag when user gets a new session
        warningShownRef.current = false;
        sessionStorage.removeItem(SESSION_WARNING_KEY);
      }
    });

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      subscription.unsubscribe();
    };
  }, []);

  return { showAuthModal, setShowAuthModal };
}

/**
 * Handle 401 requires_auth response.
 * Call setShowAuthModal(true) to trigger the modal.
 * Stores return path for redirect after re-login.
 */
export function storeAuthReturnPath(returnPath?: string): void {
  const path = returnPath || window.location.pathname;
  sessionStorage.setItem("pcd_auth_return_path", path);
}

/**
 * Get the stored return path after re-login, then clear it.
 */
export function getAuthReturnPath(): string | null {
  const path = sessionStorage.getItem("pcd_auth_return_path");
  if (path) {
    sessionStorage.removeItem("pcd_auth_return_path");
  }
  return path;
}
