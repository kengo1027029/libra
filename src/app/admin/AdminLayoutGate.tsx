"use client";

import { usePathname } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";

function normalizePath(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}

/** ログイン等は `AuthLayout` のみ。二重ヘッダー・サイドバーを避ける。 */
const ADMIN_AUTH_BYPASS_PREFIXES = [
  "/admin/login",
  "/admin/signup",
  "/admin/forgot-password",
  "/admin/reset-password",
] as const;

function isAdminAuthBypassPath(pathname: string): boolean {
  const p = normalizePath(pathname);
  return ADMIN_AUTH_BYPASS_PREFIXES.some((base) => p === base || p.startsWith(`${base}/`));
}

export function AdminLayoutGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (isAdminAuthBypassPath(pathname)) {
    return <>{children}</>;
  }
  return <AdminShell>{children}</AdminShell>;
}
