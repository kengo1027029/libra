"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { StarRating } from "@/components/admin/StarRating";
import { hasAdminSession } from "@/lib/admin-session";
import {
  formatScore,
  loadVendorReviews,
  summarizeVendorReviews,
  type VendorReviewSummary,
} from "@/lib/admin-vendor-reviews";

type SortKey = "overall_desc" | "overall_asc" | "comments_desc" | "name_asc";

const OVERALL_FILTER_OPTIONS = [
  { value: "all", label: "すべての評価" },
  { value: "4", label: "★4.0 以上" },
  { value: "3", label: "★3.0 以上" },
  { value: "2", label: "★2.0 以上" },
  { value: "1", label: "★1.0 以上" },
] as const;

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "overall_desc", label: "総合評価が高い順" },
  { value: "overall_asc", label: "総合評価が低い順" },
  { value: "comments_desc", label: "コメント数が多い順" },
  { value: "name_asc", label: "出店者名（昇順）" },
];

export function VendorReviewsListPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [summaries, setSummaries] = useState<VendorReviewSummary[]>([]);
  const [keyword, setKeyword] = useState("");
  const [overallFilter, setOverallFilter] = useState<(typeof OVERALL_FILTER_OPTIONS)[number]["value"]>("all");
  const [sortKey, setSortKey] = useState<SortKey>("overall_desc");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!hasAdminSession()) {
      router.replace("/admin/login");
      return;
    }
    setReady(true);
    setSummaries(summarizeVendorReviews(loadVendorReviews()));
  }, [router]);

  const closeMenu = useCallback(() => setOpenMenuId(null), []);

  useEffect(() => {
    if (!openMenuId) return;
    function handlePointerDown(e: PointerEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const root = target.closest("[data-vendor-row-menu]");
      const rid = root?.getAttribute("data-vendor-row-menu");
      if (rid === openMenuId) return;
      closeMenu();
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [openMenuId, closeMenu]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const min = overallFilter === "all" ? 0 : Number(overallFilter);

    const list = summaries.filter((s) => {
      if (kw && !s.vendorName.toLowerCase().includes(kw)) return false;
      if (s.overallScore < min) return false;
      return true;
    });

    list.sort((a, b) => {
      switch (sortKey) {
        case "overall_desc":
          return b.overallScore - a.overallScore;
        case "overall_asc":
          return a.overallScore - b.overallScore;
        case "comments_desc":
          return b.commentCount - a.commentCount;
        case "name_asc":
          return a.vendorName.localeCompare(b.vendorName, "ja");
      }
    });

    return list;
  }, [summaries, keyword, overallFilter, sortKey]);

  function resetFilters() {
    setKeyword("");
    setOverallFilter("all");
    setSortKey("overall_desc");
  }

  function toggleMenu(id: string) {
    setOpenMenuId((current) => (current === id ? null : id));
  }

  function handleViewDetail(id: string) {
    router.push(`/admin/vendor-reviews/${id}`);
    closeMenu();
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f8f9fa] text-sm text-neutral-500">
        読み込み中…
      </div>
    );
  }

  const cellPadding = "px-4 py-5 md:px-5";
  const menuBtnClass =
    "rounded-md px-2 py-1 text-lg leading-none text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2c32f1]/40";

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-0">
        <section className="rounded-xl border border-neutral-200/90 bg-white p-6 shadow-sm md:rounded-2xl md:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <header className="space-y-1">
              <div className="flex items-center gap-2 text-neutral-600">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5"
                    aria-hidden
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </span>
                <span className="text-sm font-medium text-neutral-600">出店者管理</span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 md:text-3xl">
                出店者評価リスト
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-neutral-500">
                登録された出店者の評価を確認できます。出店者ごとに評価が集計され、平均点と総合評価が表示されます。
              </p>
            </header>
            <Link
              href="/admin/vendor-reviews/new"
              className="inline-flex shrink-0 items-center justify-center rounded-[10px] bg-black px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            >
              評価入力する（仮名称）
            </Link>
          </div>

          <div className="mt-8 grid gap-3 rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-center">
            <div>
              <label htmlFor="vendor-search" className="sr-only">
                出店者名で検索
              </label>
              <input
                id="vendor-search"
                type="search"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="出店者名で検索"
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#2c32f1] focus:outline-none focus:ring-2 focus:ring-[#2c32f1]/20"
              />
            </div>
            <div>
              <label htmlFor="overall-filter" className="sr-only">
                総合評価フィルター
              </label>
              <select
                id="overall-filter"
                value={overallFilter}
                onChange={(e) => setOverallFilter(e.target.value as typeof overallFilter)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:border-[#2c32f1] focus:outline-none focus:ring-2 focus:ring-[#2c32f1]/20"
              >
                {OVERALL_FILTER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="sort-key" className="sr-only">
                並び替え
              </label>
              <select
                id="sort-key"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:border-[#2c32f1] focus:outline-none focus:ring-2 focus:ring-[#2c32f1]/20"
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
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
            >
              リセット
            </button>
          </div>

          <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-200 [-webkit-overflow-scrolling:touch]">
            <table className="min-w-[960px] w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th scope="col" className={`${cellPadding} min-w-[12rem] font-semibold text-neutral-700`}>
                    出店者名
                  </th>
                  <th scope="col" className={`${cellPadding} whitespace-nowrap font-semibold text-neutral-700`}>
                    評価1
                  </th>
                  <th scope="col" className={`${cellPadding} whitespace-nowrap font-semibold text-neutral-700`}>
                    評価2
                  </th>
                  <th scope="col" className={`${cellPadding} whitespace-nowrap font-semibold text-neutral-700`}>
                    評価3
                  </th>
                  <th scope="col" className={`${cellPadding} whitespace-nowrap font-semibold text-neutral-700`}>
                    総合評価
                  </th>
                  <th scope="col" className={`${cellPadding} whitespace-nowrap font-semibold text-neutral-700`}>
                    コメント数
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
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-sm text-neutral-500"
                    >
                      評価がまだありません。「評価入力する」から登録できます。
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-neutral-100 bg-white transition-colors hover:bg-neutral-50/70"
                    >
                      <td className={`${cellPadding} font-medium text-neutral-900`}>
                        <button
                          type="button"
                          onClick={() => handleViewDetail(row.id)}
                          className="text-left text-neutral-900 transition hover:text-[#2c32f1] hover:underline"
                        >
                          {row.vendorName}
                        </button>
                      </td>
                      <td className={`${cellPadding} whitespace-nowrap`}>
                        <ScoreCell score={row.averageScore1} />
                      </td>
                      <td className={`${cellPadding} whitespace-nowrap`}>
                        <ScoreCell score={row.averageScore2} />
                      </td>
                      <td className={`${cellPadding} whitespace-nowrap`}>
                        <ScoreCell score={row.averageScore3} />
                      </td>
                      <td className={`${cellPadding} whitespace-nowrap`}>
                        <div className="flex items-center gap-2">
                          <StarRating value={Math.round(row.overallScore)} readOnly size={18} />
                          <span className="text-sm font-semibold text-neutral-900">
                            {formatScore(row.overallScore)}
                          </span>
                        </div>
                      </td>
                      <td className={`${cellPadding} whitespace-nowrap text-neutral-700`}>
                        {row.commentCount}
                      </td>
                      <td
                        className={`${cellPadding} sticky right-0 z-10 border-l border-neutral-200 bg-white text-right shadow-[-6px_0_8px_-8px_rgba(15,23,42,0.25)]`}
                      >
                        <div className="relative inline-flex justify-end" data-vendor-row-menu={row.id}>
                          <button
                            type="button"
                            className={menuBtnClass}
                            aria-expanded={openMenuId === row.id}
                            aria-haspopup="menu"
                            aria-label={`${row.vendorName} の操作メニュー`}
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
                                onClick={() => handleViewDetail(row.id)}
                              >
                                詳細を見る
                                <span className="text-neutral-400" aria-hidden>
                                  ›
                                </span>
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

function ScoreCell({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <StarRating value={Math.round(score)} readOnly size={16} />
      <span className="text-sm text-neutral-700">{formatScore(score)}</span>
    </div>
  );
}
