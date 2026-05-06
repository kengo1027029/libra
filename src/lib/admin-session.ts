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
