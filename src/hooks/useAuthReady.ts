import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

    const checkWithRetry = async () => {
      // Try up to ~300ms to allow Supabase to hydrate session after refresh
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (session?.access_token) {
          setState({ hydrated: true, hasToken: true });
          return;
        }

        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 100));
        }
      }

      // Hydration attempt finished, but no token
      if (mounted) setState({ hydrated: true, hasToken: false });
    };

    checkWithRetry();

    // Use sync callback to avoid Supabase deadlock, defer async work
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      // Immediate sync update based on session from callback
      setState({
        hydrated: true,
        hasToken: !!session?.access_token,
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
