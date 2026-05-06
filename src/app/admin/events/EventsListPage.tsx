"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { hasAdminSession } from "@/lib/admin-session";
import { loadAdminEvents } from "@/lib/admin-events";

type EventStatus = "申請中" | "掲載中" | "下書き" | "差し戻し";

type EventTableRow = {
  id: string;
  entryDate: string;
  name: string;
  status: EventStatus;
  publishDate: string;
  applicationPeriod: string;
};

function toDotDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "----.--.--";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

function formatStorageDate(date: string) {
  if (!date) return "-";
  return date.replaceAll("-", "/");
}

const MOCK_EVENTS: EventTableRow[] = [
  {
    id: "1",
    entryDate: "2026.01.08",
    name: "わんわんマルシェ Spring",
    status: "申請中",
    publishDate: "—",
    applicationPeriod: "2026.02.01〜02.28",
  },
  {
    id: "2",
    entryDate: "2025.12.20",
    name: "DOG PARK FESTA 東京",
    status: "掲載中",
    publishDate: "2026.01.05",
    applicationPeriod: "2025.12.01〜2026.01.31",
  },
  {
    id: "3",
    entryDate: "2026.02.01",
    name: "愛犬と楽しむ休日マルシェ",
    status: "下書き",
    publishDate: "—",
    applicationPeriod: "—",
  },
  {
    id: "4",
    entryDate: "2026.02.02",
    name: "ペット同伴 OK ナイトマーケット",
    status: "下書き",
    publishDate: "—",
    applicationPeriod: "—",
  },
  {
    id: "5",
    entryDate: "2026.02.03",
    name: "わんわんマルシェ横浜 vol.3",
    status: "下書き",
    publishDate: "—",
    applicationPeriod: "2026.03.01〜03.15",
  },
  {
    id: "6",
    entryDate: "2026.01.15",
    name: "ドッグランカフェイベント",
    status: "下書き",
    publishDate: "—",
    applicationPeriod: "—",
  },
  {
    id: "7",
    entryDate: "2026.01.28",
    name: "しっぽフェスティバル 大阪",
    status: "下書き",
    publishDate: "—",
    applicationPeriod: "2026.04.10〜04.12",
  },
  {
    id: "8",
    entryDate: "2026.02.10",
    name: "犬と猫の譲渡会つきマルシェ",
    status: "下書き",
    publishDate: "—",
    applicationPeriod: "—",
  },
  {
    id: "9",
    entryDate: "2026.02.12",
    name: "里親募集ウィークエンド",
    status: "下書き",
    publishDate: "—",
    applicationPeriod: "2026.05.01〜05.07",
  },
  {
    id: "10",
    entryDate: "2025.11.30",
    name: "わんわんマルシェ（公募タイトル未確定）",
    status: "差し戻し",
    publishDate: "—",
    applicationPeriod: "2025.11.01〜11.30",
  },
];

function StatusBadge({ status }: { status: EventStatus }) {
  const styles: Record<EventStatus, string> = {
    申請中: "bg-sky-50 text-sky-800 ring-sky-600/20",
    掲載中: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
    下書き: "bg-neutral-100 text-neutral-700 ring-neutral-500/15",
    差し戻し: "bg-rose-50 text-rose-800 ring-rose-500/25",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function MenuChevron() {
  return (
    <span className="text-neutral-400" aria-hidden>
      ›
    </span>
  );
}

type MenuAction = "詳細を見る" | "編集" | "複製" | "削除";

export function EventsListPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [storedRows, setStoredRows] = useState<EventTableRow[]>([]);

  useEffect(() => {
    if (!hasAdminSession()) {
      router.replace("/admin/login");
      return;
    }
    setReady(true);
    const fromStorage = loadAdminEvents().map((event) => ({
      id: event.id,
      entryDate: toDotDate(event.createdAt),
      name: event.title,
      status: "申請中" as const,
      publishDate: "-",
      applicationPeriod: `${formatStorageDate(event.applicationStartDate)}〜${formatStorageDate(event.applicationEndDate)}`,
    }));
    setStoredRows(fromStorage);
  }, [router]);

  const closeMenu = useCallback(() => setOpenMenuId(null), []);

  useEffect(() => {
    if (!openMenuId) return;

    function handlePointerDown(e: PointerEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const root = target.closest("[data-event-row-menu]");
      const rid = root?.getAttribute("data-event-row-menu");
      if (rid === openMenuId) return;
      closeMenu();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [openMenuId, closeMenu]);

  function toggleMenu(rowId: string) {
    setOpenMenuId((current) => (current === rowId ? null : rowId));
  }

  function handleMenuAction(row: EventTableRow, action: MenuAction) {
    if (action === "詳細を見る") {
      router.push(`/admin/events/${row.id}`);
      closeMenu();
      return;
    }
    console.log("[イベント一覧]", action, { rowId: row.id, eventName: row.name });
    closeMenu();
  }

  const allRows = useMemo(() => [...storedRows, ...MOCK_EVENTS], [storedRows]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f8f9fa] text-sm text-neutral-500">
        読み込み中…
      </div>
    );
  }

  const menuBtnClass =
    "rounded-md px-2 py-1 text-lg leading-none text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2c32f1]/40";

  const cellPadding = "px-4 py-5 md:px-5";

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-0">
        <section className="rounded-xl border border-neutral-200/90 bg-white p-6 shadow-sm md:rounded-2xl md:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <header className="space-y-1">
              <div className="flex items-center gap-2 text-neutral-600">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                    aria-hidden
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M6 20v-1.4c0-3.2 3.3-4.9 6-4.9s6 1.7 6 4.9V20" />
                  </svg>
                </span>
                <span className="text-sm font-medium text-neutral-600">イベント管理</span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 md:text-3xl">
                イベント一覧
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-neutral-500">
                登録済みイベントの掲載状況を確認し、詳細・編集などの操作ができます。
              </p>
            </header>
            <Link
              href="/admin/events/new"
              className="inline-flex shrink-0 items-center justify-center rounded-[10px] bg-black px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            >
              + 新規イベント登録
            </Link>
          </div>

          <div className="mt-8 overflow-x-auto rounded-xl border border-neutral-200 [-webkit-overflow-scrolling:touch]">
            <table className="min-w-[1120px] w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th scope="col" className={`${cellPadding} whitespace-nowrap font-semibold text-neutral-700`}>
                    記入日
                  </th>
                  <th scope="col" className={`${cellPadding} min-w-[10rem] font-semibold text-neutral-700`}>
                    イベント名
                  </th>
                  <th scope="col" className={`${cellPadding} whitespace-nowrap font-semibold text-neutral-700`}>
                    ステータス
                  </th>
                  <th scope="col" className={`${cellPadding} whitespace-nowrap font-semibold text-neutral-700`}>
                    公開日
                  </th>
                  <th scope="col" className={`${cellPadding} min-w-[11rem] font-semibold text-neutral-700`}>
                    応募期間
                  </th>
                  <th
                    scope="col"
                    className={`${cellPadding} sticky right-0 z-20 w-14 border-l border-neutral-200 bg-neutral-50 text-right font-semibold text-neutral-700 shadow-[-6px_0_8px_-8px_rgba(15,23,42,0.25)]`}
                  >
                    <span className="sr-only">メニュー</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {allRows.map((row) => {
                  const isReturned = row.status === "差し戻し";
                  const rowText = isReturned ? "text-red-700" : "text-neutral-900";
                  const rowMuted = isReturned ? "text-red-700/85" : "text-neutral-700";

                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-neutral-100 transition-colors ${
                        isReturned ? "bg-amber-50 hover:bg-amber-50/90" : "bg-white hover:bg-neutral-50/70"
                      }`}
                    >
                      <td className={`${cellPadding} whitespace-nowrap ${rowMuted}`}>{row.entryDate}</td>
                      <td className={`${cellPadding} font-medium ${rowText}`}>{row.name}</td>
                      <td className={cellPadding}>
                        <StatusBadge status={row.status} />
                      </td>
                      <td className={`${cellPadding} whitespace-nowrap ${rowMuted}`}>{row.publishDate}</td>
                      <td className={`${cellPadding} whitespace-nowrap ${rowMuted}`}>{row.applicationPeriod}</td>
                      <td
                        className={`${cellPadding} sticky right-0 z-10 border-l text-right shadow-[-6px_0_8px_-8px_rgba(15,23,42,0.25)] ${
                          isReturned
                            ? "border-amber-200 bg-amber-50"
                            : "border-neutral-200 bg-white"
                        }`}
                      >
                        <div className="relative inline-flex justify-end" data-event-row-menu={row.id}>
                          <button
                            type="button"
                            className={menuBtnClass}
                            aria-expanded={openMenuId === row.id}
                            aria-haspopup="menu"
                            aria-label={`${row.name} の操作メニュー`}
                            onClick={() => toggleMenu(row.id)}
                          >
                            ···
                          </button>
                          {openMenuId === row.id ? (
                            <div
                              role="menu"
                              className="absolute right-0 top-full z-30 mt-1 min-w-[11rem] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg ring-1 ring-black/5"
                            >
                              <button
                                type="button"
                                role="menuitem"
                                className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm text-neutral-900 hover:bg-neutral-50"
                                onClick={() => handleMenuAction(row, "詳細を見る")}
                              >
                                詳細を見る
                                <MenuChevron />
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm text-neutral-900 hover:bg-neutral-50"
                                onClick={() => handleMenuAction(row, "編集")}
                              >
                                編集
                                <MenuChevron />
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm text-neutral-900 hover:bg-neutral-50"
                                onClick={() => handleMenuAction(row, "複製")}
                              >
                                複製
                                <MenuChevron />
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                                onClick={() => handleMenuAction(row, "削除")}
                              >
                                削除
                                <span className="text-red-400" aria-hidden>
                                  ›
                                </span>
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
