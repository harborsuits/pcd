import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { operatorSupabase } from "@/integrations/supabase/operatorClient";

const HYDRATION_TIMEOUT = 3000;

type AuthReadyState = {
  hydrated: boolean;
  session: Session | null;
};

/**
 * Operator-specific auth hook using isolated storage.
 * Prevents session bleeding from client portal to operator console.
 */
export function useOperatorAuthReady(): AuthReadyState {
  const [state, setState] = useState<AuthReadyState>({
    hydrated: false,
    session: null,
  });

  useEffect(() => {
    let mounted = true;

    // 1) Subscribe first
    const { data: { subscription } } = operatorSupabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        console.log("[useOperatorAuthReady] onAuthStateChange:", event);
        setState({ hydrated: true, session });
      }
    );

    // 2) One initial getSession (no retries)
    operatorSupabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        console.log("[useOperatorAuthReady] Initial getSession:", !!session);
        setState({ hydrated: true, session });
      })
      .catch((err) => {
        console.warn("[useOperatorAuthReady] getSession failed:", err);
        if (!mounted) return;
        setState({ hydrated: true, session: null });
      });

    // 3) Timeout fallback
    const timeout = setTimeout(() => {
      if (!mounted) return;
      setState((prev) => (prev.hydrated ? prev : { hydrated: true, session: null }));
    }, HYDRATION_TIMEOUT);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
