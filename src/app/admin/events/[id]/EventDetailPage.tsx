"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { hasAdminSession } from "@/lib/admin-session";
import {
  getApplicantsForEvent,
  type Applicant,
  type ContactStatus,
} from "@/lib/admin-event-applicants";

type ApplicantAction = "出店者情報" | "削除";

const EVENT_TITLE_MAP: Record<string, string> = {
  "1": "わんわんマルシェ",
  "2": "DOG PARK FESTA 東京",
  "3": "愛犬と楽しむ休日マルシェ",
};

function statusSelectClass(status: ContactStatus) {
  if (status === "返信待ち") return "bg-sky-50 text-sky-800 ring-sky-600/20";
  if (status === "出店確定") return "bg-emerald-50 text-emerald-800 ring-emerald-600/20";
  return "bg-amber-50 text-amber-900 ring-amber-500/20";
}

/** フィルター対象外（例: 入金済み）。フィルター未選択時のみ一覧に残す。 */
function isOutsideContactFilters(status: ContactStatus): boolean {
  return (status as string) === "入金済み";
}

function contactMatchesSelection(status: ContactStatus, selected: ContactStatus[]): boolean {
  if (selected.length === 0) return true;
  if (isOutsideContactFilters(status)) return false;
  return selected.includes(status);
}

function MenuChevron() {
  return (
    <span className="text-neutral-400" aria-hidden>
      ›
    </span>
  );
}

export function EventDetailPage({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [applicants, setApplicants] = useState<Applicant[]>(() => getApplicantsForEvent(eventId));
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [contactFilters, setContactFilters] = useState<ContactStatus[]>([]);

  useEffect(() => {
    if (!hasAdminSession()) {
      router.replace("/admin/login");
      return;
    }
    setReady(true);
  }, [router]);

  useEffect(() => {
    setApplicants(getApplicantsForEvent(eventId));
  }, [eventId]);

  const closeMenu = useCallback(() => setOpenMenuId(null), []);

  useEffect(() => {
    if (!openMenuId) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const root = target.closest("[data-applicant-menu]");
      const rid = root?.getAttribute("data-applicant-menu");
      if (rid === openMenuId) return;
      closeMenu();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [openMenuId, closeMenu]);

  const stats = useMemo(() => {
    const total = applicants.length;
    const fixed = applicants.filter((a) => a.contactStatus === "出店確定").length;
    const waitingPayment = applicants.filter((a) => a.contactStatus === "入金待ち").length;
    const waitingReply = applicants.filter((a) => a.contactStatus === "返信待ち").length;
    return { total, fixed, waitingPayment, waitingReply };
  }, [applicants]);

  const filteredApplicants = useMemo(
    () => applicants.filter((a) => contactMatchesSelection(a.contactStatus, contactFilters)),
    [applicants, contactFilters],
  );

  function toggleContactFilter(status: ContactStatus) {
    setContactFilters((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    );
  }

  function onChangeStatus(id: string, next: ContactStatus) {
    setApplicants((prev) =>
      prev.map((row) => (row.id === id ? { ...row, contactStatus: next } : row)),
    );
  }

  function toggleMenu(id: string) {
    setOpenMenuId((prev) => (prev === id ? null : id));
  }

  function onMenuAction(row: Applicant, action: ApplicantAction) {
    if (action === "出店者情報") {
      router.push(`/admin/events/${eventId}/applicants/${row.id}`);
      closeMenu();
      return;
    }
    console.log("[応募管理]", action, { eventId, applicantId: row.id, name: row.name });
    closeMenu();
  }

  function navigateToApplicant(applicantId: string) {
    router.push(`/admin/events/${eventId}/applicants/${applicantId}`);
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f8f9fa] text-sm text-neutral-500">
        読み込み中…
      </div>
    );
  }

  const eventTitle = EVENT_TITLE_MAP[eventId] ?? `イベント ${eventId}`;
  const cellPadding = "px-4 py-4 md:px-5";

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] space-y-6">
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
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
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">{eventTitle}</h1>
                </div>
              </div>
              <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <div className="flex items-baseline gap-1.5">
                  <dt className="text-neutral-500">応募者総合：</dt>
                  <dd className="font-semibold text-neutral-900">{stats.total}</dd>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <dt className="text-neutral-500">出店確定：</dt>
                  <dd className="font-semibold text-neutral-900">{stats.fixed}</dd>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <dt className="text-neutral-500">入金待ち：</dt>
                  <dd className="font-semibold text-neutral-900">{stats.waitingPayment}</dd>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <dt className="text-neutral-500">返信待ち：</dt>
                  <dd className="font-semibold text-neutral-900">{stats.waitingReply}</dd>
                </div>
              </dl>
            </div>
            <Link
              href={`/admin/events/${eventId}/edit`}
              className="inline-flex items-center gap-2 self-start text-sm font-medium text-neutral-600 underline underline-offset-4 transition hover:text-neutral-900"
            >
              内容修正する
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-5 text-lg font-semibold text-neutral-900">応募管理</h2>
          <div className="mb-4 flex flex-wrap gap-2">
            {(
              [
                {
                  status: "返信待ち" as const,
                  count: stats.waitingReply,
                  activeClass:
                    "border-sky-400 bg-sky-100 text-sky-900 shadow-inner ring-1 ring-sky-500/25",
                  idleClass:
                    "border-neutral-200 bg-white text-neutral-700 hover:border-sky-300 hover:bg-sky-50/80",
                },
                {
                  status: "出店確定" as const,
                  count: stats.fixed,
                  activeClass:
                    "border-emerald-400 bg-emerald-100 text-emerald-900 shadow-inner ring-1 ring-emerald-500/25",
                  idleClass:
                    "border-neutral-200 bg-white text-neutral-700 hover:border-emerald-300 hover:bg-emerald-50/80",
                },
                {
                  status: "入金待ち" as const,
                  count: stats.waitingPayment,
                  activeClass:
                    "border-amber-400 bg-amber-100 text-amber-950 shadow-inner ring-1 ring-amber-500/25",
                  idleClass:
                    "border-neutral-200 bg-white text-neutral-700 hover:border-amber-300 hover:bg-amber-50/80",
                },
              ] as const
            ).map(({ status, count, activeClass, idleClass }) => {
              const active = contactFilters.includes(status);
              return (
                <button
                  key={status}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleContactFilter(status)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${active ? activeClass : idleClass}`}
                >
                  <span>{status}</span>
                  <span className="tabular-nums text-neutral-600">{count}</span>
                </button>
              );
            })}
          </div>
          <div className="overflow-x-auto rounded-xl border border-neutral-200 [-webkit-overflow-scrolling:touch]">
            <table className="min-w-[900px] w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className={`${cellPadding} whitespace-nowrap font-semibold text-neutral-700`}>記入日</th>
                  <th className={`${cellPadding} min-w-[10rem] font-semibold text-neutral-700`}>名前</th>
                  <th className={`${cellPadding} min-w-[8rem] font-semibold text-neutral-700`}>ジャンル</th>
                  <th className={`${cellPadding} whitespace-nowrap font-semibold text-neutral-700`}>連絡状況</th>
                  <th className={`${cellPadding} w-14 text-right`}>
                    <span className="sr-only">メニュー</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredApplicants.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer border-b border-neutral-100 bg-white transition-colors hover:bg-gray-50"
                    onClick={(e) => {
                      const target = e.target as HTMLElement | null;
                      if (!target) return;
                      if (target.closest("[data-applicant-menu]")) return;
                      if (target.closest("select")) return;
                      navigateToApplicant(row.id);
                    }}
                  >
                    <td className={`${cellPadding} whitespace-nowrap text-neutral-700`}>{row.entryDate}</td>
                    <td className={`${cellPadding} font-medium text-neutral-900`}>{row.name}</td>
                    <td className={`${cellPadding} text-neutral-700`}>{row.genre}</td>
                    <td className={cellPadding}>
                      <select
                        value={row.contactStatus}
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        onChange={(e) => onChangeStatus(row.id, e.target.value as ContactStatus)}
                        className={`h-7 rounded-md px-2.5 text-xs font-medium ring-1 ring-inset focus:outline-none focus:ring-2 focus:ring-[#2c32f1]/25 ${statusSelectClass(
                          row.contactStatus,
                        )}`}
                      >
                        <option value="返信待ち">返信待ち</option>
                        <option value="出店確定">出店確定</option>
                        <option value="入金待ち">入金待ち</option>
                      </select>
                    </td>
                    <td
                      data-applicant-menu={row.id}
                      className={`${cellPadding} cursor-default text-right`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative inline-flex justify-end">
                        <button
                          type="button"
                          className="rounded-md px-2 py-1 text-lg leading-none text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2c32f1]/40"
                          aria-expanded={openMenuId === row.id}
                          aria-haspopup="menu"
                          aria-label={`${row.name} の操作メニュー`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMenu(row.id);
                          }}
                        >
                          ···
                        </button>
                        {openMenuId === row.id ? (
                          <div
                            role="menu"
                            className="absolute right-0 top-full z-30 mt-1 min-w-[10rem] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg ring-1 ring-black/5"
                          >
                            <button
                              type="button"
                              role="menuitem"
                              className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm text-neutral-900 hover:bg-neutral-50"
                              onClick={() => onMenuAction(row, "出店者情報")}
                            >
                              出店者情報
                              <MenuChevron />
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                              onClick={() => onMenuAction(row, "削除")}
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
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
