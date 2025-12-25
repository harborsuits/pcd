const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export class AdminAuthError extends Error {
  constructor(message: string = "Admin key invalid. Please re-enter your admin key.") {
    super(message);
    this.name = "AdminAuthError";
  }
}

export async function adminFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const adminKey = localStorage.getItem("admin_key") || "";
  
  // Don't set Content-Type for FormData - browser will set it with boundary
  const isFormData = init.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> || {}),
    "x-admin-key": adminKey,
  };
  
  if (!isFormData && init.body) {
    headers["Content-Type"] = "application/json";
  }
  
  const res = await fetch(`${SUPABASE_URL}/functions/v1${path}`, {
    ...init,
    headers,
  });

  if (res.status === 401) {
    // Key is wrong/stale -> reset storage
    localStorage.removeItem("admin_key");
    throw new AdminAuthError();
  }

  return res;
}

export function getAdminKey(): string | null {
  return localStorage.getItem("admin_key");
}

export function setAdminKey(key: string): void {
  localStorage.setItem("admin_key", key);
}

export function clearAdminKey(): void {
  localStorage.removeItem("admin_key");
}
