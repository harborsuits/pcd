import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Isolated Supabase client for client portal.
 * Uses separate storage key to prevent session bleeding from operator console.
 * This ensures client and operator sessions are completely independent.
 * 
 * Key features:
 * - detectSessionInUrl: true - properly handles OAuth callbacks (Google sign-in)
 * - storageKey: unique key prevents conflicts with operator client
 */
export const portalSupabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storageKey: "pcd-portal-auth",
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
