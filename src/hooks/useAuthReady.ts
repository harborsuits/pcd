import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAuthReady() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsReady(!!session?.access_token);
    };
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });
    return () => subscription.unsubscribe();
  }, []);

  return isReady;
}
