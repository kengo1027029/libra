"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminFixedRowMenuPopover } from "@/components/admin/AdminFixedRowMenuPopover";
import { ensureSupabaseSession } from "@/lib/supabase-auth-guard";
import {
  appendAdminArchiveEntry,
  getArchivedEventIds,
} from "@/lib/admin-archive";
import { loadAdminEvents, saveAdminEvents } from "@/lib/admin-events";

type EventStatus = "申請中" | "掲載中" | "下書き" | "差し戻し";

type EventTableRow = {
  id: string;
  entryDate: string;
  name: string;
  status: EventStatus;
  publishDate: string;
  applicationPeriod: string;
};

type EventListRow = EventTableRow & {
  hasApplicationPeriod: boolean;
};

type StatusFilterValue = "all" | EventStatus;

type ApplicationPeriodFilterValue = "all" | "has" | "none";

type EventSortKey = "entry_desc" | "entry_asc" | "name_asc" | "name_desc";

type ParsedDate = { year: number; month: number; day: number };

function toValidDateParts(year: number, month: number, day: number): ParsedDate | null {
  const d = new Date(year, month - 1, day);
  if (
    Number.isNaN(d.getTime()) ||
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

function parseDate(value: unknown, fallbackYear?: number): ParsedDate | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return {
      year: value.getFullYear(),
      month: value.getMonth() + 1,
      day: value.getDate(),
    };
  }

  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw || raw === "-" || raw === "—") return null;

  const normalized = raw.replace(/\s+/g, "");
  const patterns: Array<{
    regex: RegExp;
    map: (m: RegExpExecArray) => { year?: number; month: number; day?: number };
  }> = [
    {
      regex: /^(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})$/,
      map: (m) => ({ year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) }),
    },
    {
      regex: /^(\d{4})[\/.-](\d{1,2})[\/.-]?$/,
      map: (m) => ({ year: Number(m[1]), month: Number(m[2]), day: 1 }),
    },
    {
      regex: /^(\d{4})[\/.-](\d{1,2})$/,
      map: (m) => ({ year: Number(m[1]), month: Number(m[2]), day: 1 }),
    },
    {
      regex: /^(\d{4})年(\d{1,2})月(\d{1,2})日?$/,
      map: (m) => ({ year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) }),
    },
    {
      regex: /^(\d{4})年(\d{1,2})月$/,
      map: (m) => ({ year: Number(m[1]), month: Number(m[2]), day: 1 }),
    },
    {
      regex: /^(\d{1,2})[\/.-](\d{1,2})$/,
      map: (m) => ({ month: Number(m[1]), day: Number(m[2]) }),
    },
    {
      regex: /^(\d{1,2})月(\d{1,2})日?$/,
      map: (m) => ({ month: Number(m[1]), day: Number(m[2]) }),
    },
  ];

  for (const pattern of patterns) {
    const match = pattern.regex.exec(normalized);
    if (!match) continue;
    const result = pattern.map(match);
    const year = result.year ?? fallbackYear;
    const day = result.day ?? 1;
    if (!year) return null;
    return toValidDateParts(year, result.month, day);
  }

  const parsedByDate = new Date(normalized);
  if (!Number.isNaN(parsedByDate.getTime())) {
    return {
      year: parsedByDate.getFullYear(),
      month: parsedByDate.getMonth() + 1,
      day: parsedByDate.getDate(),
    };
  }

  return null;
}

function formatDate(value: unknown, fallbackYear?: number): string {
  const parsed = parseDate(value, fallbackYear);
  if (!parsed) return "-";
  const yyyy = String(parsed.year).padStart(4, "0");
  const mm = String(parsed.month).padStart(2, "0");
  const dd = String(parsed.day).padStart(2, "0");
  return `${yyyy}/${mm}/${dd}`;
}

function formatApplicationPeriod(period: string): string {
  if (!period || period === "—" || period === "-") return "-";
  const [rawStart, rawEnd] = period.split(/[〜～~]/);
  if (!rawStart || !rawEnd) return "-";
  const startParsed = parseDate(rawStart);
  if (!startParsed) return "-";
  const startDate = formatDate(startParsed);
  const endDate = formatDate(rawEnd, startParsed.year);
  if (startDate === "-" || endDate === "-") return "-";
  return `${startDate}〜${endDate}`;
}

function pickApplicationDateValue(event: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (!(key in event)) continue;
    const value = event[key];
    if (value === null || value === undefined) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    return value;
  }
  return "";
}

function formatApplicationPeriodFromDates(startValue: unknown, endValue: unknown): string {
  const startDate = formatDate(startValue);
  const endDate = formatDate(endValue);
  if (startDate === "-" || endDate === "-") return "-";
  return `${startDate}〜${endDate}`;
}

function isFilledApplicationDateValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  return parseDate(value) !== null;
}

function mockRowHasApplicationPeriodFromPeriodField(period: string): boolean {
  if (!period || period === "—" || period === "-") return false;
  const [rawStart, rawEnd] = period.split(/[〜～~]/);
  const startParsed = parseDate(rawStart?.trim() ?? "");
  if (!startParsed || !(rawEnd?.trim())) return false;
  return parseDate(rawEnd.trim(), startParsed.year) !== null;
}

function entryDateSortTimestamp(entryDateDisplay: string): number {
  const parsed = parseDate(entryDateDisplay);
  if (!parsed) return 0;
  return new Date(parsed.year, parsed.month - 1, parsed.day).getTime();
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

type MenuAction = "詳細を見る" | "編集" | "アーカイブ";

const STATUS_FILTER_OPTIONS: Array<{ value: StatusFilterValue; label: string }> = [
  { value: "all", label: "すべてのステータス" },
  { value: "申請中", label: "申請中" },
  { value: "掲載中", label: "掲載中" },
  { value: "下書き", label: "下書き" },
  { value: "差し戻し", label: "差し戻し" },
];

const APPLICATION_PERIOD_FILTER_OPTIONS: Array<{ value: ApplicationPeriodFilterValue; label: string }> = [
  { value: "all", label: "すべての応募期間" },
  { value: "has", label: "応募期間あり" },
  { value: "none", label: "応募期間なし" },
];

const SORT_OPTIONS: Array<{ value: EventSortKey; label: string }> = [
  { value: "entry_desc", label: "記入日が新しい順" },
  { value: "entry_asc", label: "記入日が古い順" },
  { value: "name_asc", label: "イベント名 昇順" },
  { value: "name_desc", label: "イベント名 降順" },
];

export function EventsListPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [storedRows, setStoredRows] = useState<EventListRow[]>([]);
  const [hiddenArchivedEventIds, setHiddenArchivedEventIds] = useState<Set<string>>(() => new Set());
  const [nameQuery, setNameQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [applicationPeriodFilter, setApplicationPeriodFilter] =
    useState<ApplicationPeriodFilterValue>("all");
  const [sortKey, setSortKey] = useState<EventSortKey>("entry_desc");

  useEffect(() => {
    void (async () => {
      if (!(await ensureSupabaseSession((href) => router.replace(href)))) return;
      setReady(true);
      const events = loadAdminEvents();
      const fromStorage = events.map((event) => {
        const rawEvent = event as Record<string, unknown>;
        const applicationStartDate = pickApplicationDateValue(rawEvent, [
          "applicationStartDate",
          "applicationPeriodStart",
          "recruitmentStartDate",
          "applicationStart",
        ]);
        const applicationEndDate = pickApplicationDateValue(rawEvent, [
          "applicationEndDate",
          "applicationPeriodEnd",
          "recruitmentEndDate",
          "applicationEnd",
        ]);
        const hasApplicationPeriod =
          isFilledApplicationDateValue(applicationStartDate) &&
          isFilledApplicationDateValue(applicationEndDate);
        return {
          id: event.id,
          entryDate: formatDate(event.createdAt),
          name: event.title,
          status: event.status,
          publishDate: event.publishedAt,
          applicationPeriod: formatApplicationPeriodFromDates(applicationStartDate, applicationEndDate),
          hasApplicationPeriod,
        };
      });
      setStoredRows(fromStorage);
      setHiddenArchivedEventIds(getArchivedEventIds());
    })();
  }, [router]);

  const closeMenu = useCallback(() => setOpenMenuId(null), []);

  function navigateToEventDetail(rowId: string) {
    router.push(`/admin/events/${rowId}`);
  }

  function toggleMenu(rowId: string) {
    setOpenMenuId((current) => (current === rowId ? null : rowId));
  }

  function handleMenuAction(row: EventTableRow, action: MenuAction) {
    if (action === "詳細を見る") {
      navigateToEventDetail(row.id);
      closeMenu();
      return;
    }
    if (action === "アーカイブ") {
      closeMenu();
      const ok = window.confirm("このデータをアーカイブしますか？");
      if (!ok) return;
      const isStored = storedRows.some((r) => r.id === row.id);
      if (isStored) {
        const events = loadAdminEvents();
        const found = events.find((e) => e.id === row.id);
        if (found) {
          saveAdminEvents(events.filter((e) => e.id !== row.id));
          setStoredRows((prev) => prev.filter((r) => r.id !== row.id));
          appendAdminArchiveEntry({
            source: "events",
            sourceLabel: "イベント掲載一覧",
            title: found.title,
            description: `${found.status} · 応募期間 ${formatApplicationPeriodFromDates(found.applicationStartDate, found.applicationEndDate)}`,
            originalData: found,
          });
        } else {
          setStoredRows((prev) => prev.filter((r) => r.id !== row.id));
          appendAdminArchiveEntry({
            source: "events",
            sourceLabel: "イベント掲載一覧",
            title: row.name,
            description: `${row.status} · 応募期間 ${row.applicationPeriod} · 公開日 ${row.publishDate}`,
            originalData: {
              id: row.id,
              entryDate: row.entryDate,
              name: row.name,
              status: row.status,
              publishDate: row.publishDate,
              applicationPeriod: row.applicationPeriod,
            },
          });
        }
      } else {
        appendAdminArchiveEntry({
          source: "events",
          sourceLabel: "イベント掲載一覧",
          title: row.name,
          description: `${row.status} · 応募期間 ${row.applicationPeriod} · 公開日 ${row.publishDate}`,
          originalData: {
            id: row.id,
            entryDate: row.entryDate,
            name: row.name,
            status: row.status,
            publishDate: row.publishDate,
            applicationPeriod: row.applicationPeriod,
          },
        });
      }
      setHiddenArchivedEventIds((prev) => new Set(prev).add(row.id));
      router.push("/admin/archive");
      return;
    }
    console.log("[イベント一覧]", action, { rowId: row.id, eventName: row.name });
    closeMenu();
  }

  const allRows = useMemo((): EventListRow[] => {
    const fromMock: EventListRow[] = MOCK_EVENTS.map((row) => ({
      ...row,
      hasApplicationPeriod: mockRowHasApplicationPeriodFromPeriodField(row.applicationPeriod),
    }));
    const merged = [...storedRows, ...fromMock].map((row) => ({
      ...row,
      entryDate: formatDate(row.entryDate),
      publishDate: formatDate(row.publishDate),
      applicationPeriod: formatApplicationPeriod(row.applicationPeriod),
    }));
    return merged.filter((row) => !hiddenArchivedEventIds.has(row.id));
  }, [storedRows, hiddenArchivedEventIds]);

  const filteredRows = useMemo(() => {
    const q = nameQuery.trim().toLowerCase();
    const list = allRows.filter((row) => {
      if (q && !row.name.toLowerCase().includes(q)) return false;
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (applicationPeriodFilter === "has" && !row.hasApplicationPeriod) return false;
      if (applicationPeriodFilter === "none" && row.hasApplicationPeriod) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      switch (sortKey) {
        case "entry_desc":
          return entryDateSortTimestamp(b.entryDate) - entryDateSortTimestamp(a.entryDate);
        case "entry_asc":
          return entryDateSortTimestamp(a.entryDate) - entryDateSortTimestamp(b.entryDate);
        case "name_asc":
          return a.name.localeCompare(b.name, "ja");
        case "name_desc":
          return b.name.localeCompare(a.name, "ja");
        default:
          return 0;
      }
    });
  }, [allRows, nameQuery, statusFilter, applicationPeriodFilter, sortKey]);

  const openMenuRow = useMemo(
    () => (openMenuId ? (allRows.find((r) => r.id === openMenuId) ?? null) : null),
    [openMenuId, allRows],
  );

  function resetFilters() {
    setNameQuery("");
    setStatusFilter("all");
    setApplicationPeriodFilter("all");
    setSortKey("entry_desc");
  }

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
    <>
      <div className="mx-auto w-full max-w-[1440px] px-0">
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

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center">
            <div>
              <label htmlFor="event-name-search" className="sr-only">
                イベント名で検索
              </label>
              <input
                id="event-name-search"
                type="search"
                value={nameQuery}
                onChange={(e) => setNameQuery(e.target.value)}
                placeholder="イベント名で検索"
                className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#2c32f1] focus:outline-none focus:ring-2 focus:ring-[#2c32f1]/20"
              />
            </div>
            <div>
              <label htmlFor="event-status-filter" className="sr-only">
                掲載ステータス
              </label>
              <select
                id="event-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilterValue)}
                className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-[#2c32f1] focus:outline-none focus:ring-2 focus:ring-[#2c32f1]/20"
              >
                {STATUS_FILTER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="event-application-period-filter" className="sr-only">
                応募期間
              </label>
              <select
                id="event-application-period-filter"
                value={applicationPeriodFilter}
                onChange={(e) => setApplicationPeriodFilter(e.target.value as ApplicationPeriodFilterValue)}
                className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-[#2c32f1] focus:outline-none focus:ring-2 focus:ring-[#2c32f1]/20"
              >
                {APPLICATION_PERIOD_FILTER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="event-sort-key" className="sr-only">
                並び替え
              </label>
              <select
                id="event-sort-key"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as EventSortKey)}
                className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-[#2c32f1] focus:outline-none focus:ring-2 focus:ring-[#2c32f1]/20"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="h-10 shrink-0 rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 md:justify-self-start"
            >
              リセット
            </button>
          </div>

          <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-200 [-webkit-overflow-scrolling:touch]">
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
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-neutral-500">
                      条件に一致するイベントがありません。
                    </td>
                  </tr>
                ) : null}
                {filteredRows.map((row) => {
                  const isReturned = row.status === "差し戻し";
                  const rowText = isReturned ? "text-red-700" : "text-neutral-900";
                  const rowMuted = isReturned ? "text-red-700/85" : "text-neutral-700";

                  const rowSurface = isReturned ? "bg-amber-50" : "bg-white";
                  const rowHover = isReturned
                    ? "cursor-pointer hover:bg-amber-100/85"
                    : "cursor-pointer hover:bg-gray-50";

                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-neutral-100 transition-colors ${rowSurface} ${rowHover}`}
                      onClick={(e) => {
                        const target = e.target as HTMLElement | null;
                        if (!target) return;
                        if (target.closest("[data-event-row-menu]")) return;
                        navigateToEventDetail(row.id);
                      }}
                    >
                      <td className={`${cellPadding} whitespace-nowrap ${rowMuted}`}>{row.entryDate}</td>
                      <td className={`${cellPadding} font-medium ${rowText}`}>{row.name}</td>
                      <td className={cellPadding}>
                        <StatusBadge status={row.status} />
                      </td>
                      <td className={`${cellPadding} whitespace-nowrap ${rowMuted}`}>{row.publishDate}</td>
                      <td className={`${cellPadding} whitespace-nowrap ${rowMuted}`}>{row.applicationPeriod}</td>
                      <td
                        data-event-row-menu={row.id}
                        className={`${cellPadding} sticky right-0 z-10 cursor-default border-l text-right shadow-[-6px_0_8px_-8px_rgba(15,23,42,0.25)] ${
                          isReturned
                            ? "border-amber-200 bg-amber-50"
                            : "border-neutral-200 bg-white"
                        }`}
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <div className="relative inline-flex justify-end">
                          <button
                            type="button"
                            className={menuBtnClass}
                            ref={(el) => {
                              menuButtonRefs.current[row.id] = el;
                            }}
                            aria-expanded={openMenuId === row.id}
                            aria-haspopup="menu"
                            aria-label={`${row.name} の操作メニュー`}
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMenu(row.id);
                            }}
                          >
                            ···
                          </button>
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
      {openMenuId && openMenuRow ? (
        <AdminFixedRowMenuPopover
          openMenuId={openMenuId}
          getAnchorEl={() => menuButtonRefs.current[openMenuId] ?? null}
          rowMenuRootAttr="data-event-row-menu"
          estimatedMenuHeight={132}
          estimatedMenuWidth={180}
          menuPanelClassName="min-w-[10.5rem] py-0.5"
          onClose={closeMenu}
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-neutral-900 hover:bg-neutral-50"
            onClick={() => handleMenuAction(openMenuRow, "詳細を見る")}
          >
            詳細を見る
            <MenuChevron />
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-neutral-900 hover:bg-neutral-50"
            onClick={() => handleMenuAction(openMenuRow, "編集")}
          >
            編集
            <MenuChevron />
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={() => handleMenuAction(openMenuRow, "アーカイブ")}
          >
            アーカイブ
            <span className="text-red-400" aria-hidden>
              ›
            </span>
          </button>
        </AdminFixedRowMenuPopover>
      ) : null}
    </>
  );
}
