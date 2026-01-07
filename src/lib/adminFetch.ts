import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export class AdminAuthError extends Error {
  constructor(message: string = "Admin authentication required. Please log in.") {
    super(message);
    this.name = "AdminAuthError";
  }
}

// Get current session token for admin requests
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

// Check if user has admin role
export async function checkAdminRole(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  console.log("[adminFetch] checkAdminRole - session:", session?.user?.id);
  if (!session?.user?.id) return false;
  
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", session.user.id)
    .eq("role", "admin")
    .maybeSingle();
  
  console.log("[adminFetch] checkAdminRole - data:", data, "error:", error);
  if (error || !data) return false;
  return true;
}

// Get current user email
export async function getAdminEmail(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.email || null;
}

// Admin fetch with JWT authentication
export async function adminFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken();
  
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
    const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
    
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

// Sign in with email/password
export async function signInAdmin(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  // Verify admin role
  const isAdmin = await checkAdminRole();
  if (!isAdmin) {
    await supabase.auth.signOut();
    return { success: false, error: "Access denied. Admin privileges required." };
  }
  
  return { success: true };
}

// Sign out
export async function signOutAdmin(): Promise<void> {
  sessionStorage.removeItem("admin_verified");
  await supabase.auth.signOut();
}

// Check if currently authenticated as admin (with caching for faster loads)
export async function isAuthenticatedAdmin(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    sessionStorage.removeItem("admin_verified");
    return false;
  }
  
  // Check if we've already verified admin status for this session
  const cachedUserId = sessionStorage.getItem("admin_verified");
  if (cachedUserId === session.user.id) {
    console.log("[adminFetch] Using cached admin verification");
    return true;
  }
  
  // Verify admin role and cache result
  const isAdmin = await checkAdminRole();
  if (isAdmin) {
    sessionStorage.setItem("admin_verified", session.user.id);
  } else {
    sessionStorage.removeItem("admin_verified");
  }
  return isAdmin;
}
