"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { hasAdminSession } from "@/lib/admin-session";
import {
  appendAdminEvent,
  EMPTY_ADMIN_EVENT_DRAFT,
  type AdminEventDraft,
  type StoredAdminEvent,
  type VisitorScale,
} from "@/lib/admin-events";

type FormErrors = Partial<Record<keyof AdminEventDraft, string>>;

const VISITOR_SCALE_OPTIONS: VisitorScale[] = [
  "500〜1,000",
  "1,001〜3,000",
  "3,001〜5,000",
  "5,001〜",
];

const TEXTAREA_PLACEHOLDER: Partial<Record<keyof AdminEventDraft, string>> = {
  description:
    "愛犬と一緒に楽しめるドッグマルシェです。出店者様・来場者様ともに楽しめるイベントを予定しています。",
  paymentMethod: "銀行振込。出店確定後、指定口座へお振込みをお願いいたします。",
  cancellationPolicy: "荒天の場合は前日18:00までにメールまたは公式SNSにてご連絡いたします。",
  messageToExhibitors: "ご不明点がございましたら、お気軽にお問い合わせください。",
};

const INPUT_PLACEHOLDER: Partial<Record<keyof AdminEventDraft, string>> = {
  title: "〇〇マルシェ",
  boothFee: "5,500円（税込）",
  rentalEquipment: "テント：3,000円、テーブル：1,000円",
  hpUrl: "https://example.com",
  snsUrl: "https://www.instagram.com/example",
  emergencyContact: "090-0000-0000",
};

function RequiredMark() {
  return <span className="ml-0.5 text-red-500">*</span>;
}

function formatDateLabel(date: string) {
  if (!date) return "-";
  return date.replaceAll("-", "/");
}

export function NewEventPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [draft, setDraft] = useState<AdminEventDraft>(EMPTY_ADMIN_EVENT_DRAFT);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string>("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hasAdminSession()) {
      router.replace("/admin/login");
      return;
    }
    setReady(true);
  }, [router]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const requiredFields = useMemo<Array<{ key: keyof AdminEventDraft; label: string }>>(
    () => [
      { key: "topImageName", label: "トップ画像" },
      { key: "title", label: "イベント名" },
      { key: "description", label: "イベント説明" },
      { key: "eventStartDate", label: "開催開始日" },
      { key: "eventEndDate", label: "開催終了日" },
      { key: "eventStartTime", label: "開催開始時間" },
      { key: "eventEndTime", label: "開催終了時間" },
      { key: "visitorScale", label: "来場規模" },
      { key: "boothFee", label: "出店料金" },
      { key: "paymentMethod", label: "お支払い方法" },
      { key: "applicationStartDate", label: "募集開始日" },
      { key: "applicationEndDate", label: "募集終了日" },
      { key: "cancellationPolicy", label: "中止の場合" },
      { key: "emergencyContact", label: "緊急連絡先" },
    ],
    [],
  );

  const detailFields: Array<{
    key:
      | "paymentMethod"
      | "rentalEquipment"
      | "hpUrl"
      | "snsUrl"
      | "cancellationPolicy"
      | "emergencyContact"
      | "messageToExhibitors";
    label: string;
    required: boolean;
    kind: "input" | "textarea";
  }> = [
    { key: "paymentMethod", label: "お支払い方法", required: true, kind: "textarea" },
    { key: "rentalEquipment", label: "備品レンタル", required: false, kind: "input" },
    { key: "hpUrl", label: "HP", required: false, kind: "input" },
    { key: "snsUrl", label: "SNS", required: false, kind: "input" },
    { key: "cancellationPolicy", label: "中止の場合", required: true, kind: "textarea" },
    { key: "emergencyContact", label: "緊急連絡先", required: true, kind: "input" },
    { key: "messageToExhibitors", label: "出店者へ一言", required: false, kind: "textarea" },
  ];

  function setField<K extends keyof AdminEventDraft>(key: K, value: AdminEventDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validateDraft(data: AdminEventDraft): FormErrors {
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
      nextErrors.applicationEndDate = "募集終了日は募集開始日以降を指定してください。";
    }
    if (data.eventStartDate && data.eventEndDate && data.eventStartDate > data.eventEndDate) {
      nextErrors.eventEndDate = "開催終了日は開催開始日以降を指定してください。";
    }
    return nextErrors;
  }

  function handleSelectImage(file: File | null) {
    if (!file) return;
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setFormError("画像は5MB以下を選択してください。");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setFormError("画像ファイルを選択してください。");
      return;
    }
    const accepted = ["image/jpeg", "image/jpg", "image/png"];
    if (!accepted.includes(file.type)) {
      setFormError("トップ画像は jpeg / jpg / png 形式を選択してください。");
      return;
    }
    setFormError("");
    setField("topImageName", file.name);
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(URL.createObjectURL(file));
  }

  function handleNextConfirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nextErrors = validateDraft(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setFormError(draft.topImageName ? "必須項目を入力してください。" : "トップ画像を選択してください。");
      return;
    }
    setFormError("");
    setStep("confirm");
  }

  function handleRegister() {
    const now = new Date();
    const stored: StoredAdminEvent = {
      id: `event-${now.getTime()}`,
      createdAt: now.toISOString(),
      status: "申請中",
      ...draft,
      visitorScale: draft.visitorScale as VisitorScale,
    };
    appendAdminEvent(stored);
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
    <AdminShell>
      <div className="mx-auto max-w-[1200px] space-y-6">
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
                <label className="pt-2 text-sm font-medium text-neutral-800">
                  トップ画像<RequiredMark />
                  <p className="mt-1 text-xs text-neutral-500">jpeg / jpg / png 形式、1ファイル5MBまで</p>
                </label>
                <div>
                  <div
                    className="flex min-h-28 items-center justify-center rounded-xl border border-dashed border-sky-300 bg-sky-50/50 px-4 text-center"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleSelectImage(e.dataTransfer.files?.[0] ?? null);
                    }}
                  >
                    <div className="space-y-2">
                      {!imagePreviewUrl ? (
                        <p className="text-sm text-sky-700">
                          アップロードしたいファイルをここにドラッグ&ドロップ
                        </p>
                      ) : null}
                      {imagePreviewUrl ? (
                        <img
                          src={imagePreviewUrl}
                          alt="画像プレビュー"
                          className="mx-auto h-20 w-auto rounded-md object-cover"
                        />
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      {imagePreviewUrl ? "画像を変更" : "またはファイルを選択"}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,.jpeg,.jpg,.png"
                      className="hidden"
                      onChange={(e) => handleSelectImage(e.target.files?.[0] ?? null)}
                    />
                  </div>
                  {errors.topImageName ? (
                    <p className="mt-1 text-xs text-red-600">トップ画像を選択してください。</p>
                  ) : null}
                </div>
              </div>

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
                    placeholder={INPUT_PLACEHOLDER.title}
                  />
                  {errors.title ? <p className="mt-1 text-xs text-red-600">{errors.title}</p> : null}
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)] md:items-start">
                <label htmlFor="description" className="pt-2 text-sm font-medium text-neutral-800">
                  イベント説明<RequiredMark />
                </label>
                <div>
                  <textarea
                    id="description"
                    rows={4}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
                    value={draft.description}
                    onChange={(e) => setField("description", e.target.value)}
                    placeholder={TEXTAREA_PLACEHOLDER.description}
                  />
                  {errors.description ? <p className="mt-1 text-xs text-red-600">{errors.description}</p> : null}
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)] md:items-start">
                <span className="pt-2 text-sm font-medium text-neutral-800">
                  開催日<RequiredMark />
                </span>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                    <div>
                      <input
                        type="date"
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
                        value={draft.eventStartDate}
                        onChange={(e) => setField("eventStartDate", e.target.value)}
                      />
                      {errors.eventStartDate ? (
                        <p className="mt-1 text-xs text-red-600">{errors.eventStartDate}</p>
                      ) : null}
                    </div>
                    <span className="hidden text-neutral-500 sm:inline">〜</span>
                    <div>
                      <input
                        type="date"
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
                        value={draft.eventEndDate}
                        onChange={(e) => setField("eventEndDate", e.target.value)}
                      />
                      {errors.eventEndDate ? (
                        <p className="mt-1 text-xs text-red-600">{errors.eventEndDate}</p>
                      ) : null}
                    </div>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)] md:items-start">
                <span className="pt-2 text-sm font-medium text-neutral-800">
                  開催時間<RequiredMark />
                </span>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <div>
                    <input
                      type="time"
                      step={1800}
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
                      value={draft.eventStartTime}
                      onChange={(e) => setField("eventStartTime", e.target.value)}
                    />
                    {errors.eventStartTime ? (
                      <p className="mt-1 text-xs text-red-600">{errors.eventStartTime}</p>
                    ) : null}
                  </div>
                  <span className="hidden text-neutral-500 sm:inline">〜</span>
                  <div>
                    <input
                      type="time"
                      step={1800}
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
                      value={draft.eventEndTime}
                      onChange={(e) => setField("eventEndTime", e.target.value)}
                    />
                    {errors.eventEndTime ? (
                      <p className="mt-1 text-xs text-red-600">{errors.eventEndTime}</p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)] md:items-start">
                <span className="pt-2 text-sm font-medium text-neutral-800">
                  来場見込み人数<RequiredMark />
                </span>
                <div>
                  <div className="flex flex-wrap gap-2">
                    {VISITOR_SCALE_OPTIONS.map((option) => {
                      const active = draft.visitorScale === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setField("visitorScale", option)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                            active
                              ? "border-neutral-800 bg-neutral-100 text-neutral-900"
                              : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50"
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                  {errors.visitorScale ? (
                    <p className="mt-1 text-xs text-red-600">{errors.visitorScale}</p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)] md:items-start">
                <label htmlFor="boothFee" className="pt-2 text-sm font-medium text-neutral-800">
                  出店料金<RequiredMark />
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="boothFee"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
                    placeholder={INPUT_PLACEHOLDER.boothFee}
                    value={draft.boothFee}
                    onChange={(e) => setField("boothFee", e.target.value)}
                  />
                  <span className="shrink-0 text-sm text-neutral-500">税込</span>
                </div>
              </div>
              {errors.boothFee ? (
                <p className="-mt-4 text-xs text-red-600 md:ml-[180px]">{errors.boothFee}</p>
              ) : null}

              {detailFields.map(({ key, label, required, kind }) => (
                <div key={key} className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)] md:items-start">
                  <label htmlFor={key} className="pt-2 text-sm font-medium text-neutral-800">
                    {label}
                    {required ? <RequiredMark /> : null}
                  </label>
                  <div>
                    {kind === "textarea" ? (
                      <textarea
                        id={key}
                        rows={3}
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
                        value={draft[key]}
                        onChange={(e) => setField(key, e.target.value)}
                        placeholder={TEXTAREA_PLACEHOLDER[key]}
                      />
                    ) : (
                      <input
                        id={key}
                        type={
                          key === "hpUrl" || key === "snsUrl"
                            ? "url"
                            : key === "emergencyContact"
                              ? "tel"
                              : "text"
                        }
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
                        value={draft[key]}
                        onChange={(e) => setField(key, e.target.value)}
                        placeholder={INPUT_PLACEHOLDER[key]}
                      />
                    )}
                    {errors[key] ? <p className="mt-1 text-xs text-red-600">{errors[key]}</p> : null}
                  </div>
                </div>
              ))}

              <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)] md:items-start">
                <span className="pt-2 text-sm font-medium text-neutral-800">
                  募集期間<RequiredMark />
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
                    ["トップ画像", draft.topImageName || "-"],
                    ["イベント名", draft.title],
                    ["イベント説明", draft.description],
                    ["開催日", `${formatDateLabel(draft.eventStartDate)} 〜 ${formatDateLabel(draft.eventEndDate)}`],
                    ["開催時間", `${draft.eventStartTime || "-"} 〜 ${draft.eventEndTime || "-"}`],
                    ["来場見込み人数", draft.visitorScale || "-"],
                    ["出店料金", draft.boothFee],
                    ["お支払い方法", draft.paymentMethod],
                    ["備品レンタル", draft.rentalEquipment || "-"],
                    ["HP", draft.hpUrl || "-"],
                    ["SNS", draft.snsUrl || "-"],
                    [
                      "募集期間",
                      `${formatDateLabel(draft.applicationStartDate)} 〜 ${formatDateLabel(draft.applicationEndDate)}`,
                    ],
                    ["中止の場合", draft.cancellationPolicy],
                    ["緊急連絡先", draft.emergencyContact],
                    ["出店者へ一言", draft.messageToExhibitors || "-"],
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
    </AdminShell>
  );
}
