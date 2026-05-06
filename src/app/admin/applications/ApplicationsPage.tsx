"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { hasAdminSession } from "@/lib/admin-session";

export function ApplicationsPage() {
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
      <div className="mx-auto max-w-4xl">
        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm md:rounded-2xl md:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 md:text-3xl">掲載申請一覧</h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500">
            掲載申請の一覧は、データ連携後に表示予定です。
          </p>
        </section>
      </div>
    </AdminShell>
  );
}
