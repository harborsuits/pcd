import { operatorSupabase } from "@/integrations/supabase/operatorClient";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export class AdminAuthError extends Error {
  constructor(message: string = "Admin authentication required. Please log in.") {
    super(message);
    this.name = "AdminAuthError";
  }
}

/**
 * Check if user has admin role.
 * REQUIRES userId - no fallback getSession() to avoid deadlocks.
 */
export async function checkAdminRole(userId: string): Promise<boolean> {
  console.log("[adminFetch] checkAdminRole - uid:", userId);
  const { data, error } = await operatorSupabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  
  if (error || !data) return false;
  return true;
}

/**
 * Sign in with email/password and verify admin role.
 * Uses session from sign-in response directly.
 * Uses isolated operator Supabase client.
 */
export async function signInAdmin(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await operatorSupabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  if (!data.session?.user?.id) {
    return { success: false, error: "Sign-in failed" };
  }
  
  // Verify admin role using user ID from response
  const isAdmin = await checkAdminRole(data.session.user.id);
  if (!isAdmin) {
    await operatorSupabase.auth.signOut();
    return { success: false, error: "Access denied. Admin privileges required." };
  }
  
  return { success: true };
}

/**
 * Sign out and clear any cached admin state.
 * Uses isolated operator Supabase client.
 */
export async function signOutAdmin(): Promise<void> {
  console.log("[adminFetch] signOutAdmin called");
  sessionStorage.removeItem("admin_verified");
  
  try {
    const { error } = await operatorSupabase.auth.signOut();
    if (error) {
      console.error("[adminFetch] signOut error:", error);
    } else {
      console.log("[adminFetch] signOut successful");
    }
  } catch (err) {
    console.error("[adminFetch] signOut exception:", err);
  }
}

/**
 * Admin fetch with JWT authentication.
 * Gets token from session, retries on 401.
 * Uses isolated operator Supabase client.
 */
export async function adminFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await operatorSupabase.auth.getSession();
  const token = session?.access_token;
  
  if (!token) {
    throw new AdminAuthError("Not logged in. Please sign in to continue.");
  }
  
  // Don't set Content-Type for FormData - browser will set it with boundary
  const isFormData = init.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> || {}),
    "Authorization": `Bearer ${token}`,
  };
  
  if (!isFormData && init.body) {
    headers["Content-Type"] = "application/json";
  }
  
  const res = await fetch(`${SUPABASE_URL}/functions/v1${path}`, {
    ...init,
    headers,
  });

  if (res.status === 401) {
    // Try to refresh the session
    const { data: { session: newSession }, error } = await operatorSupabase.auth.refreshSession();
    
    if (error || !newSession) {
      throw new AdminAuthError("Session expired. Please log in again.");
    }
    
    // Retry with new token
    headers["Authorization"] = `Bearer ${newSession.access_token}`;
    return fetch(`${SUPABASE_URL}/functions/v1${path}`, {
      ...init,
      headers,
    });
  }

  if (res.status === 403) {
    throw new AdminAuthError("Access denied. Admin privileges required.");
  }

  return res;
}
