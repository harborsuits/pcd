import { useEffect, useState } from "react";
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

  useEffect(() => {
    let mounted = true;

    // Check if we're on an operator route - if so, don't track client auth here
    const isOperatorRoute = window.location.pathname.startsWith("/operator");
    if (isOperatorRoute) {
      setState({ hydrated: true, session: null });
      return;
    }

    // Set up auth listener FIRST (Supabase best practice)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        console.log("[useAuthReady] onAuthStateChange:", event);
        
        // Ignore if this is an operator session bleeding through
        if (isOperatorSession(session)) {
          console.log("[useAuthReady] Ignoring operator session bleed");
          setState({ hydrated: true, session: null });
          return;
        }
        
        setState({ hydrated: true, session });
      }
    );

    // THEN do ONE initial session check (no retries)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      console.log("[useAuthReady] Initial getSession:", !!session);
      
      // Ignore if this is an operator session
      if (isOperatorSession(session)) {
        console.log("[useAuthReady] Ignoring operator session on init");
        setState({ hydrated: true, session: null });
        return;
      }
      
      setState({ hydrated: true, session });
    });

    // Timeout fallback - don't block forever
    const timeout = setTimeout(() => {
      if (mounted) {
        setState(prev => prev.hydrated ? prev : { hydrated: true, session: null });
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
