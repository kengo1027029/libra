"use client";

import {
  AUTH_MOCK_COOKIE_NAME,
  AUTH_MOCK_COOKIE_VALUE,
  isAuthMockMode,
} from "@/lib/auth-mode";
import { hasAdminSession } from "@/lib/admin-session";
import { createClient } from "@/lib/supabase";

function clientHasMockAuthCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((row) => {
    const i = row.indexOf("=");
    if (i === -1) return false;
    const name = row.slice(0, i).trim();
    const value = row.slice(i + 1);
    return name === AUTH_MOCK_COOKIE_NAME && value === AUTH_MOCK_COOKIE_VALUE;
  });
}

export async function ensureSupabaseSession(replace: (href: string) => void): Promise<boolean> {
  if (isAuthMockMode()) {
    if (hasAdminSession() || clientHasMockAuthCookie()) return true;
    replace("/admin/login");
    return false;
  }

  const { data: { user } } = await createClient().auth.getUser();
  if (!user) {
    replace("/admin/login");
    return false;
  }
  return true;
}
