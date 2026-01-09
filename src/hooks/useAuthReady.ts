import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

const HYDRATION_TIMEOUT = 3000;

type AuthReadyState = {
  hydrated: boolean;
  session: Session | null;
};

/**
 * Single source of truth for auth state.
 * - Performs ONE getSession() on mount
 * - Uses onAuthStateChange for all subsequent updates
 * - Exposes full session object (not just hasToken)
 */
export function useAuthReady(): AuthReadyState {
  const [state, setState] = useState<AuthReadyState>({
    hydrated: false,
    session: null,
  });

  useEffect(() => {
    let mounted = true;

    // Set up auth listener FIRST (Supabase best practice)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        console.log("[useAuthReady] onAuthStateChange:", event);
        setState({ hydrated: true, session });
      }
    );

    // THEN do ONE initial session check (no retries)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      console.log("[useAuthReady] Initial getSession:", !!session);
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
