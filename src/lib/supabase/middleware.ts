import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAuthMockMode, requestHasMockAuthCookie } from "@/lib/auth-mode";

function normalizePath(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}

const ADMIN_AUTH_BYPASS = [
  "/admin/login",
  "/admin/signup",
  "/admin/forgot-password",
  "/admin/reset-password",
  "/auth/callback",
] as const;

function isAdminAuthBypass(pathname: string): boolean {
  const p = normalizePath(pathname);
  return ADMIN_AUTH_BYPASS.some((base) => p === base || p.startsWith(`${base}/`));
}

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, key };
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const mockOk = isAuthMockMode() && requestHasMockAuthCookie(request);

  const { url, key } = getSupabaseEnv();
  if (!url || !key) {
    if (pathname.startsWith("/admin") && !isAdminAuthBypass(pathname) && !mockOk) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/admin/login";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !mockOk && pathname.startsWith("/admin") && !isAdminAuthBypass(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin/login";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
