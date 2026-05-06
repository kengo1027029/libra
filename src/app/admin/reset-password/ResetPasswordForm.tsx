"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export function ResetPasswordForm() {
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(false);
    if (!nextPassword.trim() || !confirmPassword.trim()) {
      setError("新しいパスワードを入力してください。");
      return;
    }
    if (nextPassword !== confirmPassword) {
      setError("新しいパスワードが一致しません。");
      return;
    }
    setDone(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-4xl font-semibold tracking-tight text-neutral-900">新しいパスワード設定</h1>
      <p className="text-sm text-neutral-600">新しいパスワードを入力してください。</p>

      <input
        type="password"
        value={nextPassword}
        onChange={(e) => setNextPassword(e.target.value)}
        placeholder="新しいパスワード"
        className="w-full rounded-xl border border-neutral-300 bg-white py-3 px-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#2c32f1] focus:outline-none focus:ring-2 focus:ring-[#2c32f1]/20"
      />

      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="新しいパスワード確認"
        className="w-full rounded-xl border border-neutral-300 bg-white py-3 px-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#2c32f1] focus:outline-none focus:ring-2 focus:ring-[#2c32f1]/20"
      />

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {done ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          パスワードを更新しました。ログイン画面から再度ログインしてください。
        </p>
      ) : null}

      <button type="submit" className="w-full rounded-xl bg-[#1767e8] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f56cb]">
        パスワードを更新
      </button>

      <p className="pt-2 text-center text-sm">
        <Link href="/admin/login" className="font-medium text-[#1767e8]">
          ログイン画面へ戻る
        </Link>
      </p>
    </form>
  );
}
