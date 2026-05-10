"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { StarRating } from "@/components/admin/StarRating";
import { hasAdminSession } from "@/lib/admin-session";
import {
  appendVendorReview,
  EMPTY_VENDOR_REVIEW_DRAFT,
  formatScore,
  type StoredVendorReview,
  type VendorReviewDraft,
} from "@/lib/admin-vendor-reviews";

type FormErrors = Partial<Record<keyof VendorReviewDraft, string>>;

const SCORE_FIELDS: Array<{ key: "score1" | "score2" | "score3"; label: string; help: string }> = [
  { key: "score1", label: "評価1", help: "対応の丁寧さ" },
  { key: "score2", label: "評価2", help: "商品・サービスの魅力" },
  { key: "score3", label: "評価3", help: "イベント運営への貢献度" },
];

function RequiredMark() {
  return <span className="ml-0.5 text-red-500">*</span>;
}

export function NewVendorReviewPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState<VendorReviewDraft>(EMPTY_VENDOR_REVIEW_DRAFT);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string>("");

  useEffect(() => {
    if (!hasAdminSession()) {
      router.replace("/admin/login");
      return;
    }
    setReady(true);
  }, [router]);

  function setField<K extends keyof VendorReviewDraft>(key: K, value: VendorReviewDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(data: VendorReviewDraft): FormErrors {
    const next: FormErrors = {};
    if (!data.vendorName.trim()) next.vendorName = "出店者名は必須です。";
    if (!data.instagramUrl.trim()) next.instagramUrl = "インスタグラムリンクは必須です。";
    if (!data.score1) next.score1 = "評価1を選択してください。";
    if (!data.score2) next.score2 = "評価2を選択してください。";
    if (!data.score3) next.score3 = "評価3を選択してください。";
    return next;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next = validate(draft);
    setErrors(next);
    if (Object.keys(next).length > 0) {
      setFormError("入力内容を確認してください。");
      return;
    }
    setFormError("");
    const now = new Date();
    const stored: StoredVendorReview = {
      id: `vendor-review-${now.getTime()}`,
      createdAt: now.toISOString(),
      vendorName: draft.vendorName.trim(),
      instagramUrl: draft.instagramUrl.trim(),
      score1: draft.score1,
      score2: draft.score2,
      score3: draft.score3,
      reason: draft.reason.trim(),
    };
    appendVendorReview(stored);
    router.push("/admin/vendor-reviews");
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f8f9fa] text-sm text-neutral-500">
        読み込み中…
      </div>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#2c32f1] focus:outline-none focus:ring-2 focus:ring-[#2c32f1]/20";

  const overallPreview = (draft.score1 + draft.score2 + draft.score3) / 3;

  return (
    <AdminShell>
      <div className="mx-auto max-w-[960px] space-y-6">
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8 lg:p-10">
          <header>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              出店者評価を入力
            </h1>
            <p className="mt-2 text-sm text-neutral-500">
              出店者の対応や提供内容について、3つの観点で評価してください。
            </p>
          </header>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
            {formError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                {formError}
              </p>
            ) : null}

            <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)] md:items-start">
              <label htmlFor="vendorName" className="pt-2 text-sm font-medium text-neutral-800">
                出店者名<RequiredMark />
              </label>
              <div>
                <input
                  id="vendorName"
                  type="text"
                  className={inputClass}
                  value={draft.vendorName}
                  onChange={(e) => setField("vendorName", e.target.value)}
                  placeholder="例：わんわんベーカリー"
                />
                {errors.vendorName ? (
                  <p className="mt-1 text-xs text-red-600">{errors.vendorName}</p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)] md:items-start">
              <label htmlFor="instagramUrl" className="pt-2 text-sm font-medium text-neutral-800">
                インスタグラムリンク<RequiredMark />
              </label>
              <div>
                <input
                  id="instagramUrl"
                  type="url"
                  className={inputClass}
                  value={draft.instagramUrl}
                  onChange={(e) => setField("instagramUrl", e.target.value)}
                  placeholder="https://www.instagram.com/example"
                />
                {errors.instagramUrl ? (
                  <p className="mt-1 text-xs text-red-600">{errors.instagramUrl}</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-800">評価項目</h2>
                <div className="flex items-center gap-2 text-sm text-neutral-700">
                  <span className="text-xs text-neutral-500">総合評価</span>
                  <span className="text-base font-semibold text-amber-500">
                    {formatScore(overallPreview)}
                  </span>
                </div>
              </div>
              <div className="mt-4 space-y-5">
                {SCORE_FIELDS.map(({ key, label, help }) => (
                  <div key={key} className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
                    <div>
                      <p className="text-sm font-medium text-neutral-800">
                        {label}
                        <RequiredMark />
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500">{help}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <StarRating
                          value={draft[key]}
                          onChange={(v) => setField(key, v)}
                          size={32}
                          ariaLabel={label}
                        />
                        <span className="text-sm font-semibold text-neutral-700">
                          {draft[key] > 0 ? `${draft[key]}.0` : "未選択"}
                        </span>
                      </div>
                      {errors[key] ? (
                        <p className="mt-1 text-xs text-red-600">{errors[key]}</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)] md:items-start">
              <label htmlFor="reason" className="pt-2 text-sm font-medium text-neutral-800">
                評価理由
                <span className="ml-1 text-xs font-normal text-neutral-500">（任意）</span>
              </label>
              <div>
                <textarea
                  id="reason"
                  rows={4}
                  className={inputClass}
                  value={draft.reason}
                  onChange={(e) => setField("reason", e.target.value)}
                  placeholder="気づいた点や改善要望、良かった点などを自由にご記入ください。"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
              <Link
                href="/admin/vendor-reviews"
                className="rounded-lg border border-neutral-300 bg-white px-5 py-2.5 text-center text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                className="rounded-lg bg-black px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
              >
                登録する
              </button>
            </div>
          </form>

          <div className="mt-8 border-t border-neutral-200 pt-4">
            <Link
              href="/admin/vendor-reviews"
              className="text-sm font-medium text-[#2c32f1] hover:underline"
            >
              ← 出店者評価リストに戻る
            </Link>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
