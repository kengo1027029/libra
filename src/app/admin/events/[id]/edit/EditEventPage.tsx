"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { hasAdminSession } from "@/lib/admin-session";

export function EditEventPage({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasAdminSession()) {
      router.replace("/admin/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f8f9fa] text-sm text-neutral-500">
        読み込み中…
      </div>
    );
  }

  return (
    <AdminShell>
      <section className="mx-auto max-w-3xl rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-neutral-900">イベント内容修正</h1>
        <p className="mt-2 text-sm text-neutral-600">
          イベント ID: {eventId} の編集ページは準備中です。
        </p>
        <Link
          href={`/admin/events/${eventId}`}
          className="mt-6 inline-block text-sm font-medium text-[#2c32f1] hover:underline"
        >
          ← イベント詳細に戻る
        </Link>
      </section>
    </AdminShell>
  );
}
