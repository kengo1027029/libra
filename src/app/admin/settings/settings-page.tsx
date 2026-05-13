"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ensureSupabaseSession } from "@/lib/supabase-auth-guard";

export function SettingsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      if (!(await ensureSupabaseSession((href) => router.replace(href)))) return;
      setReady(true);
    })();
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f8f9fa] text-sm text-neutral-500">
        読み込み中…
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-4xl rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-neutral-900">設定</h1>
      <p className="mt-2 text-sm text-neutral-600">設定ページは準備中です。</p>
    </section>
  );
}
