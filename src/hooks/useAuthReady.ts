import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

const HYDRATION_TIMEOUT = 5000;

// The operator console uses a different storage key - must match operatorClient.ts
const OPERATOR_STORAGE_KEY = "pcd-operator-auth";

type AuthReadyState = {
  hydrated: boolean;
  session: Session | null;
};

/**
 * Check if a session belongs to the operator (not client portal).
 * Compares user ID from session with user ID stored in operator storage.
 */
const isOperatorSession = (session: Session | null): boolean => {
  if (!session) return false;
  
  const operatorData = localStorage.getItem(OPERATOR_STORAGE_KEY);
  if (!operatorData) return false;
  
  try {
    const parsed = JSON.parse(operatorData);
    // If session user ID matches operator storage user ID, it's an operator session
    return parsed?.user?.id === session.user.id;
  } catch {
    return false;
  }
};

/**
 * Client portal auth hook.
 * Ignores sessions from operator storage to prevent cross-contamination.
 */
export function useAuthReady(): AuthReadyState {
  const [state, setState] = useState<AuthReadyState>({
    hydrated: false,
    session: null,
  });
  
  // Use ref to track if we've already set a valid session
  const hasValidSession = useRef(false);

  useEffect(() => {
    let mounted = true;

    // Check if we're on an operator route - if so, don't track client auth here
    const isOperatorRoute = window.location.pathname.startsWith("/operator");
    if (isOperatorRoute) {
      setState({ hydrated: true, session: null });
      return;
    }

    const handleSession = (session: Session | null, source: string) => {
      if (!mounted) return;
      
      console.log(`[useAuthReady] ${source}:`, !!session, session?.user?.email);
      
      // Ignore if this is an operator session bleeding through
      if (isOperatorSession(session)) {
        console.log("[useAuthReady] Ignoring operator session bleed");
        if (!hasValidSession.current) {
          setState({ hydrated: true, session: null });
        }
        return;
      }
      
      if (session) {
        hasValidSession.current = true;
        setState({ hydrated: true, session });
      } else if (!hasValidSession.current) {
        // Only set null session if we haven't found a valid session yet
        setState({ hydrated: true, session: null });
      }
    };

    // Set up auth listener FIRST - this catches SIGNED_IN from OAuth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("[useAuthReady] onAuthStateChange:", event, !!session);
        
        // For OAuth callbacks, the SIGNED_IN event is the reliable source
        if (event === "SIGNED_IN" && session) {
          handleSession(session, `onAuthStateChange(${event})`);
        } else if (event === "SIGNED_OUT") {
          hasValidSession.current = false;
          setState({ hydrated: true, session: null });
        } else if (event === "TOKEN_REFRESHED" && session) {
          handleSession(session, `onAuthStateChange(${event})`);
        } else if (event === "INITIAL_SESSION") {
          // INITIAL_SESSION fires once when subscription is set up
          handleSession(session, `onAuthStateChange(${event})`);
        }
      }
    );

    // Also do an explicit getSession check after a short delay
    // This handles cases where no auth event fires (page refresh with existing session)
    const sessionCheck = setTimeout(async () => {
      if (!mounted) return;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        handleSession(session, "getSession");
      } catch (err) {
        console.error("[useAuthReady] getSession error:", err);
        if (!hasValidSession.current) {
          setState({ hydrated: true, session: null });
        }
      }
    }, 200);

    // Timeout fallback - don't block forever
    const timeout = setTimeout(() => {
      if (mounted && !state.hydrated) {
        console.log("[useAuthReady] Timeout - hydrating with current state");
        setState(prev => ({ ...prev, hydrated: true }));
      }
    }, HYDRATION_TIMEOUT);

    return () => {
      mounted = false;
      clearTimeout(sessionCheck);
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
