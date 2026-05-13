"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { establishMockAdminSession, setAdminSession } from "@/lib/admin-session";
import { isAuthMockMode } from "@/lib/auth-mode";
import { createClient } from "@/lib/supabase";

/** false: Google ボタンは仮ログインのみ。true: 本番 Google OAuth（Supabase）を実行 */
const ENABLE_GOOGLE_OAUTH = false;

function MailIcon() {
  return (
    <svg className="h-4 w-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg className="h-4 w-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="m21 2-9.6 9.6M16 3l5 5M15 9l3 3" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.1 29.3 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2.1 1.6-4.6 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.6 5.1C9.5 39.6 16.1 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.2 5.8-6.1 7.4l.1-.1 6.2 5.2c-.4.3 8.5-6.5 8.5-16.5 0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

/** 本番Google OAuth用: Supabase `signInWithOAuth`（ENABLE_GOOGLE_OAUTH が true のときのみ呼び出す） */
async function runSupabaseGoogleOAuth(): Promise<{ error: Error | null }> {
  const supabase = createClient();
  const { error: oauthError } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (oauthError) {
    return { error: new Error(oauthError.message || "Googleログインを開始できませんでした。") };
  }
  return { error: null };
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("メールアドレスとパスワードを入力してください。");
      return;
    }
    setLoading(true);
    try {
      if (isAuthMockMode()) {
        establishMockAdminSession();
        router.push("/admin/events");
        router.refresh();
        return;
      }
      const supabase = createClient();
      const { error: signError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signError) {
        setError(signError.message || "ログインに失敗しました。");
        return;
      }
      router.push("/admin/events");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    if (googleLoading) return;
    setError(null);
    setGoogleLoading(true);
    try {
      if (!ENABLE_GOOGLE_OAUTH) {
        if (isAuthMockMode()) {
          establishMockAdminSession();
        } else {
          setAdminSession();
        }
        router.push("/admin/events");
        router.refresh();
        return;
      }

      const { error: oauthErr } = await runSupabaseGoogleOAuth();
      if (oauthErr) {
        setError(oauthErr.message || "Googleログインを開始できませんでした。");
      }
    } catch {
      if (ENABLE_GOOGLE_OAUTH) {
        setError("Googleログインを開始できませんでした。");
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <h1 className="text-4xl font-semibold tracking-tight text-neutral-900">ログイン</h1>

      <div className="space-y-3 pt-2">
        <label className="relative block">
          <span className="pointer-events-none absolute inset-y-0 left-4 inline-flex items-center">
            <MailIcon />
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレス"
            className="w-full rounded-xl border border-neutral-300 bg-white py-3 pl-11 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#2c32f1] focus:outline-none focus:ring-2 focus:ring-[#2c32f1]/20"
          />
        </label>
        <label className="relative block">
          <span className="pointer-events-none absolute inset-y-0 left-4 inline-flex items-center">
            <KeyIcon />
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード"
            className="w-full rounded-xl border border-neutral-300 bg-white py-3 pl-11 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#2c32f1] focus:outline-none focus:ring-2 focus:ring-[#2c32f1]/20"
          />
        </label>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading || googleLoading}
        className="w-full rounded-xl bg-[#1767e8] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f56cb] disabled:opacity-60"
      >
        {loading ? "ログイン中…" : "ログイン"}
      </button>

      <p className="text-center text-sm font-medium text-[#1767e8]">
        <Link href="/admin/forgot-password">パスワードをお忘れですか？</Link>
      </p>

      <div className="flex items-center gap-3 py-2">
        <span className="h-px flex-1 bg-neutral-200" />
        <span className="text-xs text-neutral-400">or</span>
        <span className="h-px flex-1 bg-neutral-200" />
      </div>

      <button
        type="button"
        onClick={() => void handleGoogleLogin()}
        disabled={googleLoading || loading}
        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleIcon />
        {googleLoading ? "接続中…" : "Google"}
      </button>

      <p className="pt-2 text-center text-sm text-neutral-500">
        アカウントをお持ちでない場合はこちらから{" "}
        <Link href="/admin/signup" className="font-semibold text-[#1767e8]">
          サインアップ
        </Link>
      </p>
    </form>
  );
}
