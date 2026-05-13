import type { NextRequest } from "next/server";

/** DB 未準備時: ログイン画面から擬似セッションで /admin に入る（本番では 0 にすること） */
export const AUTH_MOCK_COOKIE_NAME = "libra_auth_mock";
export const AUTH_MOCK_COOKIE_VALUE = "1";

export function isAuthMockMode(): boolean {
  return process.env.NEXT_PUBLIC_AUTH_MOCK === "1";
}

export function requestHasMockAuthCookie(request: NextRequest): boolean {
  return request.cookies.get(AUTH_MOCK_COOKIE_NAME)?.value === AUTH_MOCK_COOKIE_VALUE;
}
