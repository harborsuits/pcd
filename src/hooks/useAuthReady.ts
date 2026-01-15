import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

const HYDRATION_TIMEOUT = 3000;

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
  
  // Use ref to track if we've already hydrated (avoids stale closure issues)
  const hydratedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    // Check if we're on an operator route - if so, don't track client auth here
    const isOperatorRoute = window.location.pathname.startsWith("/operator");
    if (isOperatorRoute) {
      setState({ hydrated: true, session: null });
      hydratedRef.current = true;
      return;
    }

    const handleSession = (session: Session | null, source: string) => {
      if (!mounted) return;
      
      // Already hydrated with a session - don't overwrite with null
      if (hydratedRef.current && state.session && !session) {
        console.log(`[useAuthReady] ${source}: Ignoring null session, already have session`);
        return;
      }
      
      console.log(`[useAuthReady] ${source}:`, !!session);
      
      // Ignore if this is an operator session bleeding through
      if (isOperatorSession(session)) {
        console.log("[useAuthReady] Ignoring operator session bleed");
        setState({ hydrated: true, session: null });
        hydratedRef.current = true;
        return;
      }
      
      setState({ hydrated: true, session });
      hydratedRef.current = true;
    };

    // Set up auth listener FIRST (Supabase best practice)
    // This will catch SIGNED_IN events from OAuth callbacks
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("[useAuthReady] onAuthStateChange:", event);
        handleSession(session, `onAuthStateChange(${event})`);
      }
    );

    // Initial session check - but give Supabase a moment to process any OAuth callback
    // The callback URL might not have hash tokens (PKCE flow processes server-side)
    const initCheck = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        handleSession(session, "getSession");
      });
    };

    // Small delay to allow Supabase to process OAuth callbacks
    // onAuthStateChange should fire first if there's a valid session
    setTimeout(initCheck, 100);

    // Timeout fallback - don't block forever
    const timeout = setTimeout(() => {
      if (mounted && !hydratedRef.current) {
        console.log("[useAuthReady] Timeout - hydrating with null session");
        setState({ hydrated: true, session: null });
        hydratedRef.current = true;
      }
    }, HYDRATION_TIMEOUT);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
