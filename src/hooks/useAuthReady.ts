import { useEffect, useState, useRef } from "react";
import { portalSupabase } from "@/integrations/supabase/portalClient";
import type { Session } from "@supabase/supabase-js";

const HYDRATION_TIMEOUT = 8000;

type AuthReadyState = {
  hydrated: boolean;
  session: Session | null;
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
 * Check if URL contains OAuth error
 */
const hasOAuthError = (): { error: string; description: string } | null => {
  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  
  const error = params.get("error") || hashParams.get("error");
  const description = params.get("error_description") || hashParams.get("error_description");
  
  if (error) {
    return { error, description: description || "Authentication failed" };
  }
  return null;
};

/**
 * Client portal auth hook using isolated portalSupabase client.
 * No need to detect operator session bleed - separate storage keys prevent it.
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

    // Check if we're on an operator route - if so, don't track portal auth here
    const isOperatorRoute = window.location.pathname.startsWith("/operator");
    if (isOperatorRoute) {
      setState({ hydrated: true, session: null });
      return;
    }

    // Check for OAuth errors first
    const oauthError = hasOAuthError();
    if (oauthError) {
      console.error("[useAuthReady] OAuth error:", oauthError);
      // Clear the error from URL and continue without session
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }

    console.log("[useAuthReady] Starting auth detection, isOAuthCallback:", isOAuthCallback.current);

    const handleSession = (session: Session | null, source: string) => {
      if (!mounted) return;
      
      console.log(`[useAuthReady] ${source}:`, !!session, session?.user?.email);
      
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
    const { data: { subscription } } = portalSupabase.auth.onAuthStateChange(
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
        const { data: { session } } = await portalSupabase.auth.getSession();
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

/**
 * Export OAuth detection helpers for use in components
 */
export { hasOAuthTokensInUrl, hasOAuthError };
