const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export class AdminAuthError extends Error {
  constructor(message: string = "Admin key invalid. Please re-enter your admin key.") {
    super(message);
    this.name = "AdminAuthError";
  }
}

// Storage mode management
const STORAGE_MODE_KEY = "admin_key_storage_mode";
type StorageMode = "local" | "session";

function getStorageMode(): StorageMode {
  const v = (localStorage.getItem(STORAGE_MODE_KEY) as StorageMode | null) ?? "local";
  return v === "session" ? "session" : "local";
}

export function setAdminKeyStorageMode(mode: StorageMode): void {
  localStorage.setItem(STORAGE_MODE_KEY, mode);
}

export function getAdminKeyStorageMode(): StorageMode {
  return getStorageMode();
}

function getStorage(): Storage {
  return getStorageMode() === "session" ? sessionStorage : localStorage;
}

export function getAdminKey(): string | null {
  return getStorage().getItem("admin_key");
}

export function setAdminKey(key: string): void {
  getStorage().setItem("admin_key", key);
  localStorage.setItem("admin_key_set_at", String(Date.now()));
}

export function clearAdminKey(): void {
  // Clear from both to be safe
  localStorage.removeItem("admin_key");
  sessionStorage.removeItem("admin_key");
  localStorage.removeItem("admin_key_set_at");
}

export function getKeySetAt(): number | null {
  const ts = localStorage.getItem("admin_key_set_at");
  return ts ? Number(ts) : null;
}

export function getLast401At(): number | null {
  const ts = localStorage.getItem("admin_last_401_at");
  return ts ? Number(ts) : null;
}

export async function adminFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const adminKey = getAdminKey() || "";
  
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
    localStorage.setItem("admin_last_401_at", String(Date.now()));
    clearAdminKey();
    throw new AdminAuthError();
  }

  return res;
}
