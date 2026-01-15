import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

const HYDRATION_TIMEOUT = 8000;

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
 * Check if the current URL contains OAuth callback tokens
 */
const hasOAuthTokensInUrl = (): boolean => {
  const hash = window.location.hash;
  const search = window.location.search;
  
  // Check for access_token in hash (implicit flow) or code in search (PKCE flow)
  return hash.includes("access_token") || 
         hash.includes("refresh_token") ||
         search.includes("code=");
};

/**
 * Client portal auth hook.
 * Ignores sessions from operator storage to prevent cross-contamination.
 * Properly handles OAuth callbacks by waiting for token processing.
 */
export function useAuthReady(): AuthReadyState {
  const [state, setState] = useState<AuthReadyState>({
    hydrated: false,
    session: null,
  });
  
  // Use ref to track if we've already set a valid session
  const hasValidSession = useRef(false);
  const isOAuthCallback = useRef(hasOAuthTokensInUrl());

  useEffect(() => {
    let mounted = true;

    // Check if we're on an operator route - if so, don't track client auth here
    const isOperatorRoute = window.location.pathname.startsWith("/operator");
    if (isOperatorRoute) {
      setState({ hydrated: true, session: null });
      return;
    }

    console.log("[useAuthReady] Starting auth detection, isOAuthCallback:", isOAuthCallback.current);

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
      } else if (!hasValidSession.current && !isOAuthCallback.current) {
        // Only set null session if we haven't found a valid session yet
        // AND we're not in an OAuth callback (which needs time to process)
        setState({ hydrated: true, session: null });
      }
    };

    // Set up auth listener FIRST - this catches SIGNED_IN from OAuth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("[useAuthReady] onAuthStateChange:", event, !!session, session?.user?.email);
        
        // For OAuth callbacks, the SIGNED_IN event is the reliable source
        if (event === "SIGNED_IN" && session) {
          isOAuthCallback.current = false; // Clear the flag, we got the session
          handleSession(session, `onAuthStateChange(${event})`);
        } else if (event === "SIGNED_OUT") {
          hasValidSession.current = false;
          isOAuthCallback.current = false;
          setState({ hydrated: true, session: null });
        } else if (event === "TOKEN_REFRESHED" && session) {
          handleSession(session, `onAuthStateChange(${event})`);
        } else if (event === "INITIAL_SESSION") {
          // INITIAL_SESSION fires once when subscription is set up
          handleSession(session, `onAuthStateChange(${event})`);
        }
      }
    );

    // For OAuth callbacks, wait a bit longer for Supabase to process the tokens
    // before doing the getSession check
    const sessionCheckDelay = isOAuthCallback.current ? 500 : 100;
    
    const sessionCheck = setTimeout(async () => {
      if (!mounted) return;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("[useAuthReady] getSession result:", !!session, session?.user?.email);
        
        if (session) {
          handleSession(session, "getSession");
        } else if (!hasValidSession.current && !isOAuthCallback.current) {
          // Only mark as hydrated with no session if we're sure there's no OAuth callback
          setState(prev => prev.hydrated ? prev : { hydrated: true, session: null });
        }
      } catch (err) {
        console.error("[useAuthReady] getSession error:", err);
        if (!hasValidSession.current) {
          setState({ hydrated: true, session: null });
        }
      }
    }, sessionCheckDelay);

    // Timeout fallback - don't block forever
    const timeout = setTimeout(() => {
      if (mounted && !state.hydrated) {
        console.log("[useAuthReady] Timeout - hydrating with current state");
        isOAuthCallback.current = false;
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
