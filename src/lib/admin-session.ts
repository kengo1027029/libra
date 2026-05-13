import {
  AUTH_MOCK_COOKIE_NAME,
  AUTH_MOCK_COOKIE_VALUE,
  isAuthMockMode,
} from "@/lib/auth-mode";

export const ADMIN_SESSION_KEY = "libra_admin_session";

export function setAdminSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
}

export function clearAdminSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

export function hasAdminSession(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "1";
}

function setBrowserMockAuthCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_MOCK_COOKIE_NAME}=${AUTH_MOCK_COOKIE_VALUE}; path=/; max-age=604800; SameSite=Lax`;
}

function clearBrowserMockAuthCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_MOCK_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

/** モック認証: middleware が読める Cookie と既存の sessionStorage を両方セット */
export function establishMockAdminSession(): void {
  if (!isAuthMockMode()) return;
  setAdminSession();
  setBrowserMockAuthCookie();
}

export function clearAllClientAdminAuth(): void {
  clearAdminSession();
  clearBrowserMockAuthCookie();
}
