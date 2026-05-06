export const ADMIN_PROFILE_STORAGE_KEY = "libra_admin_profile";

export type AdminProfile = {
  name: string;
  kana: string;
  email: string;
  phone: string;
  organization: string;
};

function isAdminProfile(value: unknown): value is AdminProfile {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.name === "string" &&
    typeof o.kana === "string" &&
    typeof o.email === "string" &&
    typeof o.phone === "string" &&
    typeof o.organization === "string"
  );
}

export function loadAdminProfile(): AdminProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ADMIN_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isAdminProfile(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAdminProfile(profile: AdminProfile): void {
  localStorage.setItem(ADMIN_PROFILE_STORAGE_KEY, JSON.stringify(profile));
}
