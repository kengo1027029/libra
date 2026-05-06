"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

function MailIcon() {
  return (
    <svg className="h-4 w-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("メールアドレスを入力してください。");
      return;
    }
    setSent(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-4xl font-semibold tracking-tight text-neutral-900">パスワード再設定</h1>
      <p className="text-sm leading-relaxed text-neutral-600">
        ご登録のメールアドレスを入力してください。
        <br />
        パスワード再設定用のリンクを送信します。
      </p>

      <label className="relative block pt-1">
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

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {sent ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          パスワード再設定用のリンクを送信しました。
          <br />
          メールをご確認ください。
        </p>
      ) : null}

      <button type="submit" className="w-full rounded-xl bg-[#1767e8] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f56cb]">
        再設定リンクを送信
      </button>

      <p className="pt-2 text-center text-sm">
        <Link href="/admin/login" className="font-medium text-[#1767e8]">
          ログイン画面へ戻る
        </Link>
      </p>
    </form>
  );
}
