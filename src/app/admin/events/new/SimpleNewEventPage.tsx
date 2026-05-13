"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ensureSupabaseSession } from "@/lib/supabase-auth-guard";
import {
  appendAdminEvent,
  EMPTY_ADMIN_EVENT_DRAFT,
  type StoredAdminEvent,
  type VisitorScale,
} from "@/lib/admin-events";

type SimpleDraft = {
  title: string;
  applicationStartDate: string;
  applicationEndDate: string;
};

type SimpleDraftKey = keyof SimpleDraft;
type FormErrors = Partial<Record<SimpleDraftKey, string>>;

const INITIAL_SIMPLE_DRAFT: SimpleDraft = {
  title: "",
  applicationStartDate: "",
  applicationEndDate: "",
};

function RequiredMark() {
  return <span className="ml-0.5 text-red-500">*</span>;
}

function formatDateLabel(date: string) {
  if (!date) return "-";
  return date.replaceAll("-", "/");
}

export function SimpleNewEventPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [draft, setDraft] = useState<SimpleDraft>(INITIAL_SIMPLE_DRAFT);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");

  useEffect(() => {
    void (async () => {
      if (!(await ensureSupabaseSession((href) => router.replace(href)))) return;
      setReady(true);
    })();
  }, [router]);

  const requiredFields = useMemo<Array<{ key: SimpleDraftKey; label: string }>>(
    () => [
      { key: "title", label: "イベント名" },
      { key: "applicationStartDate", label: "応募開始日" },
      { key: "applicationEndDate", label: "応募終了日" },
    ],
    [],
  );

  function setField<K extends SimpleDraftKey>(key: K, value: SimpleDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validateDraft(data: SimpleDraft): FormErrors {
    const nextErrors: FormErrors = {};
    for (const field of requiredFields) {
      const value = String(data[field.key] ?? "").trim();
      if (!value) {
        nextErrors[field.key] = `${field.label}は必須です。`;
      }
    }
    if (
      data.applicationStartDate &&
      data.applicationEndDate &&
      data.applicationStartDate > data.applicationEndDate
    ) {
      nextErrors.applicationEndDate = "応募終了日は応募開始日以降を指定してください。";
    }
    return nextErrors;
  }

  function handleNextConfirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nextErrors = validateDraft(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setFormError("必須項目を入力してください。");
      return;
    }
    setFormError("");
    setStep("confirm");
  }

  function handleRegister() {
    const now = new Date();
    const newEvent: StoredAdminEvent = {
      id: `event-${now.getTime()}`,
      createdAt: now.toISOString(),
      publishedAt: "",
      status: "申請中",
      ...EMPTY_ADMIN_EVENT_DRAFT,
      title: draft.title.trim(),
      applicationStartDate: draft.applicationStartDate,
      applicationEndDate: draft.applicationEndDate,
      eventStartDate: draft.applicationStartDate,
      eventEndDate: draft.applicationEndDate,
      visitorScale: "500〜1,000" as VisitorScale,
    };
    appendAdminEvent(newEvent);
    router.push("/admin/events");
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f8f9fa] text-sm text-neutral-500">
        読み込み中…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6">
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8 lg:p-10">
          <header>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">イベント登録</h1>
            <p className="mt-2 text-sm text-neutral-500">
              {step === "form"
                ? "必要事項を入力し、確認画面へ進んでください。"
                : "入力内容を確認し、問題なければ登録してください。"}
            </p>
          </header>

          {step === "form" ? (
            <form className="mt-8 space-y-6" onSubmit={handleNextConfirm}>
              {formError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                  {formError}
                </p>
              ) : null}

              <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)] md:items-start">
                <label htmlFor="title" className="pt-2 text-sm font-medium text-neutral-800">
                  イベント名<RequiredMark />
                </label>
                <div>
                  <input
                    id="title"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
                    value={draft.title}
                    onChange={(e) => setField("title", e.target.value)}
                    placeholder="〇〇マルシェ"
                  />
                  {errors.title ? <p className="mt-1 text-xs text-red-600">{errors.title}</p> : null}
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)] md:items-start">
                <span className="pt-2 text-sm font-medium text-neutral-800">
                  応募期間<RequiredMark />
                </span>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <div>
                    <input
                      type="date"
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
                      value={draft.applicationStartDate}
                      onChange={(e) => setField("applicationStartDate", e.target.value)}
                    />
                    {errors.applicationStartDate ? (
                      <p className="mt-1 text-xs text-red-600">{errors.applicationStartDate}</p>
                    ) : null}
                  </div>
                  <span className="hidden text-neutral-500 sm:inline">〜</span>
                  <div>
                    <input
                      type="date"
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
                      value={draft.applicationEndDate}
                      onChange={(e) => setField("applicationEndDate", e.target.value)}
                    />
                    {errors.applicationEndDate ? (
                      <p className="mt-1 text-xs text-red-600">{errors.applicationEndDate}</p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="mx-auto flex items-center gap-4 rounded-full border-2 border-[#3d78d8] px-6 py-2 text-sm font-semibold text-[#2f66c3] transition hover:bg-sky-50"
                >
                  確認画面へ
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#3d78d8] text-white">
                    →
                  </span>
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-8 space-y-6">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
                <h2 className="text-lg font-semibold text-neutral-900">入力内容の確認</h2>
                <dl className="mt-4 divide-y divide-neutral-200 text-sm">
                  {[
                    ["イベント名", draft.title],
                    [
                      "応募期間",
                      `${formatDateLabel(draft.applicationStartDate)} 〜 ${formatDateLabel(
                        draft.applicationEndDate,
                      )}`,
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className="grid gap-1 py-3 md:grid-cols-[180px_minmax(0,1fr)]">
                      <dt className="font-medium text-neutral-700">{label}</dt>
                      <dd className="whitespace-pre-wrap text-neutral-900">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="rounded-lg border border-neutral-300 bg-white px-5 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  戻って修正する
                </button>
                <button
                  type="button"
                  onClick={handleRegister}
                  className="rounded-lg bg-[#2c32f1] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#252adb]"
                >
                  登録する
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 border-t border-neutral-200 pt-4">
            <Link href="/admin/events" className="text-sm font-medium text-[#2c32f1] hover:underline">
              ← イベント一覧に戻る
            </Link>
          </div>
        </section>
      </div>
  );
}
