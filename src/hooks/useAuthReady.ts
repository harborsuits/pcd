import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const HYDRATION_TIMEOUT = 2000; // 2 seconds max wait

type AuthReadyState = {
  hydrated: boolean;   // we finished checking (don't block forever)
  hasToken: boolean;   // access_token exists right now
};

export function useAuthReady(): AuthReadyState {
  const [state, setState] = useState({
    hydrated: false,
    hasToken: false,
  });

  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const checkWithRetry = async () => {
      console.log("[useAuthReady] Starting session check...");
      // Try up to ~300ms to allow Supabase to hydrate session after refresh
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        console.log(`[useAuthReady] Attempt ${attempt + 1}: session=${!!session}, token=${!!session?.access_token}`);

        if (session?.access_token) {
          setState({ hydrated: true, hasToken: true });
          return;
        }

        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 100));
        }
      }

      // Hydration attempt finished, but no token
      console.log("[useAuthReady] No token found after retries");
      if (mounted) setState({ hydrated: true, hasToken: false });
    };

    // Fallback timeout - always resolve after HYDRATION_TIMEOUT
    timeoutId = setTimeout(() => {
      if (mounted && !state.hydrated) {
        console.log("[useAuthReady] Timeout - forcing hydrated state");
        setState((prev) => prev.hydrated ? prev : { hydrated: true, hasToken: false });
      }
    }, HYDRATION_TIMEOUT);

    checkWithRetry();

    // Use sync callback to avoid Supabase deadlock, defer async work
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      console.log("[useAuthReady] onAuthStateChange:", event, "hasToken:", !!session?.access_token);
      // Immediate sync update based on session from callback
      setState({
        hydrated: true,
        hasToken: !!session?.access_token,
      });
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
