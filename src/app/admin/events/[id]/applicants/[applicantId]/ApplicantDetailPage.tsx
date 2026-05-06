"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { hasAdminSession } from "@/lib/admin-session";
import { getApplicantProfileForEvent } from "@/lib/admin-event-applicants";

export function ApplicantDetailPage({
  eventId,
  applicantId,
}: {
  eventId: string;
  applicantId: string;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasAdminSession()) {
      router.replace("/admin/login");
      return;
    }
    setReady(true);
  }, [router]);

  const profile = useMemo(
    () => getApplicantProfileForEvent(eventId, applicantId),
    [eventId, applicantId],
  );

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f8f9fa] text-sm text-neutral-500">
        読み込み中…
      </div>
    );
  }

  const rows: Array<[label: string, value: string]> = [
    ["店名", profile.shopName],
    ["sns", profile.sns],
    ["商品ジャンル", profile.productGenre],
    ["担当者名", profile.contactName],
    ["ふりがな", profile.kana],
    ["メールアドレス", profile.email],
    ["電話番号", profile.phone],
  ];

  return (
    <AdminShell>
      <div className="mx-auto max-w-5xl">
        <section className="rounded-2xl border border-neutral-200 bg-white px-6 py-8 shadow-sm md:px-14 md:py-10">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">出店者情報</h1>

          <dl className="mt-10 divide-y divide-neutral-200">
            {rows.map(([label, value]) => (
              <div
                key={label}
                className="grid grid-cols-1 gap-2 py-5 text-sm md:grid-cols-[160px_minmax(0,1fr)] md:items-center md:gap-6 md:py-6"
              >
                <dt className="font-medium text-neutral-600">{label}</dt>
                <dd className="break-words font-medium text-neutral-900">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-10 flex justify-center">
            <Link
              href={`/admin/events/${eventId}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-700 underline underline-offset-4 transition hover:text-neutral-900"
            >
              <span aria-hidden>←</span>
              一覧へ戻る
            </Link>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
