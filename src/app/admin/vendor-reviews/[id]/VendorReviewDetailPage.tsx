"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { StarRating } from "@/components/admin/StarRating";
import { ensureSupabaseSession } from "@/lib/supabase-auth-guard";
import {
  findVendorSummaryById,
  formatScore,
  loadVendorReviews,
  type StoredVendorReview,
  type VendorReviewSummary,
} from "@/lib/admin-vendor-reviews";

type Props = {
  vendorId: string;
};

type SortOption = "new" | "old" | "score_high" | "score_low";
type OverallFilterOption = "all" | "gte4" | "mid3" | "lt3";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}.${m}.${day} ${hh}:${mm}`;
}

function reviewOverallScore(r: StoredVendorReview): number {
  return (r.score1 + r.score2 + r.score3) / 3;
}

function matchesOverallFilter(overall: number, filter: OverallFilterOption): boolean {
  switch (filter) {
    case "all":
      return true;
    case "gte4":
      return overall >= 4;
    case "mid3":
      return overall >= 3 && overall < 4;
    case "lt3":
      return overall < 3;
    default:
      return true;
  }
}

export function VendorReviewDetailPage({ vendorId }: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [summary, setSummary] = useState<VendorReviewSummary | null>(null);
  const [resolved, setResolved] = useState(false);
  const [sortKey, setSortKey] = useState<SortOption>("new");
  const [overallFilter, setOverallFilter] = useState<OverallFilterOption>("all");

  useEffect(() => {
    void (async () => {
      if (!(await ensureSupabaseSession((href) => router.replace(href)))) return;
      setReady(true);
      setSummary(findVendorSummaryById(loadVendorReviews(), vendorId));
      setResolved(true);
    })();
  }, [router, vendorId]);

  const filteredSortedReviews = useMemo(() => {
    if (!summary) return [];
    const list = summary.reviews.filter((r) =>
      matchesOverallFilter(reviewOverallScore(r), overallFilter),
    );
    list.sort((a, b) => {
      const oa = reviewOverallScore(a);
      const ob = reviewOverallScore(b);
      switch (sortKey) {
        case "new":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "old":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "score_high":
          return ob - oa;
        case "score_low":
          return oa - ob;
        default:
          return 0;
      }
    });
    return list;
  }, [summary, sortKey, overallFilter]);

  if (!ready || !resolved) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f8f9fa] text-sm text-neutral-500">
        読み込み中…
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="mx-auto w-full max-w-[1440px] px-0">
        <section className="rounded-xl border border-neutral-200/90 bg-white p-6 text-center shadow-sm md:rounded-2xl md:p-8 lg:p-10">
          <h1 className="text-xl font-semibold text-neutral-900">出店者評価が見つかりません</h1>
          <p className="mt-3 text-sm text-neutral-500">
            指定された出店者の評価データが見つかりませんでした。
          </p>
          <div className="mt-8">
            <Link
              href="/admin/vendor-reviews"
              className="inline-flex items-center justify-center rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              一覧へ戻る
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const latest = summary.reviews[0];
  const ngCount = summary.reviews.filter((r) => reviewOverallScore(r) < 3).length;

  return (
    <div className="mx-auto w-full max-w-[1440px] px-0">
      <section className="rounded-xl border border-neutral-200/90 bg-white p-6 shadow-sm md:rounded-2xl md:p-8 lg:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-4">
            <nav className="text-sm text-neutral-500" aria-label="パンくず">
              <Link href="/admin/vendor-reviews" className="font-medium text-neutral-600 hover:text-[#2c32f1]">
                出店者評価リスト
              </Link>
              <span className="mx-2 text-neutral-300">＞</span>
              <span className="text-neutral-800">{summary.vendorName}</span>
            </nav>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 md:text-3xl">
                {summary.vendorName}
              </h1>
              <div className="mt-3">
                {latest?.instagramUrl ? (
                  <a
                    href={latest.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-sm font-medium text-[#2c32f1] underline-offset-4 hover:underline"
                  >
                    {latest.instagramUrl}
                  </a>
                ) : (
                  <span className="text-sm text-neutral-400">—</span>
                )}
              </div>
            </div>
          </div>
          <div className="shrink-0 lg:pt-8">
            <Link
              href="/admin/vendor-reviews"
              className="inline-flex w-full items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50 lg:w-auto"
            >
              一覧に戻る
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <MetricTile
            icon={<IconStarSoft />}
            iconBg="bg-amber-50 text-amber-600"
            label="総合評価"
            value={<MetricValue value={formatScore(summary.overallScore)} colorClass="text-amber-600" />}
          />
          <MetricTile
            icon={<IconChat />}
            iconBg="bg-sky-50 text-sky-600"
            label="総合コメント数"
            value={<MetricValue value={summary.commentCount} suffix="件" />}
          />
          <MetricTile
            icon={<IconBan />}
            iconBg="bg-rose-50 text-rose-600"
            label="NG登録件数"
            value={<MetricValue value={ngCount} suffix="件" />}
          />
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4">
          <label className="flex min-w-[11rem] flex-1 md:flex-none">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortOption)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:border-[#2c32f1] focus:outline-none focus:ring-2 focus:ring-[#2c32f1]/20"
            >
              <option value="new">並び替え：新しい順</option>
              <option value="old">並び替え：古い順</option>
              <option value="score_high">並び替え：総合評価が高い順</option>
              <option value="score_low">並び替え：総合評価が低い順</option>
            </select>
          </label>
          <label className="flex min-w-[11rem] flex-1 md:flex-none">
            <select
              value={overallFilter}
              onChange={(e) => setOverallFilter(e.target.value as OverallFilterOption)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:border-[#2c32f1] focus:outline-none focus:ring-2 focus:ring-[#2c32f1]/20"
            >
              <option value="all">総合評価：すべて</option>
              <option value="gte4">総合評価：4.0以上</option>
              <option value="mid3">総合評価：3.0〜3.9</option>
              <option value="lt3">総合評価：3.0未満</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              setSortKey("new");
              setOverallFilter("all");
            }}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
          >
            リセット
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {filteredSortedReviews.length === 0 ? (
            <p className="rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-14 text-center text-sm text-neutral-500">
              条件に一致する評価がありません。
            </p>
          ) : (
            filteredSortedReviews.map((review) => <ReviewCommentCard key={review.id} review={review} />)
          )}
        </div>
      </section>
    </div>
  );
}

function MetricTile({
  icon,
  iconBg,
  label,
  value,
  className = "",
}: {
  icon: ReactNode;
  iconBg: string;
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-neutral-200 bg-neutral-50/40 px-6 py-5 md:px-7 md:py-5 ${className}`}
    >
      <div className="flex items-center gap-4">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}
          aria-hidden
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-neutral-500">{label}</p>
          {value}
        </div>
      </div>
    </div>
  );
}

function MetricValue({
  value,
  suffix,
  colorClass = "text-neutral-900",
}: {
  value: string | number;
  suffix?: string;
  colorClass?: string;
}) {
  return (
    <p className={`mt-2 flex items-baseline gap-1 text-4xl font-bold leading-none tabular-nums tracking-tight md:text-[2.75rem] ${colorClass}`}>
      <span>{value}</span>
      {suffix ? <span className="text-lg font-semibold leading-none text-neutral-400">{suffix}</span> : null}
    </p>
  );
}

function ReviewCommentCard({ review }: { review: StoredVendorReview }) {
  const hasReason = review.reason.trim().length > 0;

  return (
    <article className="rounded-xl border border-neutral-200 bg-white p-6 md:p-7">
      <div className="flex flex-col gap-4 border-b border-neutral-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">記入者</p>
          <p className="mt-1 text-base font-semibold text-neutral-900">—</p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-medium text-neutral-400">投稿日</p>
          <p className="mt-1 text-sm font-medium tabular-nums text-neutral-700">{formatDateTime(review.createdAt)}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
        <div className="flex flex-1 flex-wrap gap-6 lg:gap-8">
          <ScoreBlock label="評価1" score={review.score1} />
          <ScoreBlock label="評価2" score={review.score2} />
          <ScoreBlock label="評価3" score={review.score3} />
        </div>
      </div>

      <div className="mt-7">
        <p className="text-xs font-medium text-neutral-500">評価理由</p>
        <div className="mt-2 rounded-2xl bg-[#f5f2eb]/90 px-5 py-4 text-sm leading-relaxed text-neutral-800 md:px-6 md:py-5">
          {hasReason ? (
            <p className="whitespace-pre-wrap">{review.reason}</p>
          ) : (
            <p className="text-neutral-500">評価理由はありません</p>
          )}
        </div>
      </div>

    </article>
  );
}

function ScoreBlock({ label, score }: { label: string; score: number }) {
  return (
    <div className="min-w-[7.5rem]">
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <StarRating value={Math.round(score)} readOnly size={21} />
        <span className="text-xs font-semibold tabular-nums text-neutral-600">{formatScore(score)}</span>
      </div>
    </div>
  );
}

function IconStarSoft() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function IconChat() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function IconBan() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="m4.93 4.93 14.14 14.14" />
    </svg>
  );
}
