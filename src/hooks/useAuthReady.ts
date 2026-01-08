import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAuthReady() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const checkAuth = async () => {
      // Try up to 3 times with small delays (same as adminFetch)
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          if (mounted) setIsReady(true);
          return;
        }
        // Wait 100ms before retry (except on last attempt)
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 100));
        }
      }
      // No session after retries - still set ready so we don't block forever
      if (mounted) setIsReady(true);
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      if (mounted) {
        // On auth state change, re-check (but no need for retries here)
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (mounted) setIsReady(!!session?.access_token || true);
        });
      }
    });
    
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return isReady;
}
