"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { hasAdminSession } from "@/lib/admin-session";
import {
  loadAdminProfile,
  saveAdminProfile,
  type AdminProfile,
} from "@/lib/admin-profile";

const emptyProfile: AdminProfile = {
  name: "",
  kana: "",
  email: "",
  phone: "",
  organization: "",
};

function RequiredMark() {
  return <span className="ml-0.5 text-red-500">*</span>;
}

function PersonGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M6 20v-1.4c0-3.2 3.3-4.9 6-4.9s6 1.7 6 4.9V20" />
    </svg>
  );
}

export function AdminDashboard() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [saved, setSaved] = useState<AdminProfile | null>(null);
  const [draft, setDraft] = useState<AdminProfile>(emptyProfile);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!hasAdminSession()) {
      router.replace("/admin/login");
      return;
    }
    setAuthReady(true);
  }, [router]);

  useEffect(() => {
    if (!authReady) return;
    const stored = loadAdminProfile();
    setSaved(stored);
    setDraft(stored ?? emptyProfile);
    setEditing(stored === null);
    setProfileLoaded(true);
  }, [authReady]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: AdminProfile = {
      name: draft.name.trim(),
      kana: draft.kana.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      organization: draft.organization.trim(),
    };
    if (
      !next.name ||
      !next.kana ||
      !next.email ||
      !next.phone ||
      !next.organization
    ) {
      return;
    }
    saveAdminProfile(next);
    setSaved(next);
    setDraft(next);
    setEditing(false);
  }

  function handleEdit() {
    if (!saved) return;
    setDraft(saved);
    setEditing(true);
  }

  if (!authReady || !profileLoaded) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f8f9fa] text-sm text-neutral-500">
        読み込み中…
      </div>
    );
  }

  const showForm = saved === null || editing;

  const fieldClass =
    "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-[#2c32f1] focus:outline-none focus:ring-2 focus:ring-[#2c32f1]/25";

  const labelClass = "mb-1.5 block text-sm font-medium text-neutral-800";

  return (
    <AdminShell>
      <div className="mx-auto w-full max-w-[1440px] px-0">
        {showForm ? (
          <section className="rounded-xl border border-neutral-200/90 bg-white p-6 shadow-sm md:rounded-2xl md:p-8 lg:p-10">
            <div className="mb-8 flex items-center gap-2 text-neutral-600">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
                <PersonGlyph />
              </span>
              <h1 className="text-lg font-semibold tracking-tight text-neutral-900 md:text-xl">
                プロフィール設定
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="max-w-4xl space-y-8">
              <div className="grid gap-6 md:grid-cols-2 md:gap-x-10 md:gap-y-6">
                <div>
                  <label htmlFor="profile-name" className={labelClass}>
                    氏名
                    <RequiredMark />
                  </label>
                  <input
                    id="profile-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    placeholder="山田 太郎"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label htmlFor="profile-org" className={labelClass}>
                    団体名 / 会社名
                    <RequiredMark />
                  </label>
                  <input
                    id="profile-org"
                    name="organization"
                    type="text"
                    required
                    value={draft.organization}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, organization: e.target.value }))
                    }
                    placeholder="株式会社◯◯"
                    className={fieldClass}
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="profile-kana" className={labelClass}>
                    ふりがな
                    <RequiredMark />
                  </label>
                  <input
                    id="profile-kana"
                    name="kana"
                    type="text"
                    required
                    value={draft.kana}
                    onChange={(e) => setDraft((d) => ({ ...d, kana: e.target.value }))}
                    placeholder="やまだたろう"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label htmlFor="profile-email" className={labelClass}>
                    メールアドレス
                    <RequiredMark />
                  </label>
                  <input
                    id="profile-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={draft.email}
                    onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                    placeholder="sample@gmail.com"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label htmlFor="profile-phone" className={labelClass}>
                    電話番号
                    <RequiredMark />
                  </label>
                  <input
                    id="profile-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={draft.phone}
                    onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                    placeholder="09012345678"
                    className={fieldClass}
                  />
                </div>
              </div>

              <div className="pt-2 md:max-w-xs">
                <button
                  type="submit"
                  className="w-full rounded-[10px] bg-[#2c32f1] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#252adb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c32f1] md:w-auto md:min-w-[200px]"
                >
                  登録する
                </button>
              </div>
            </form>
          </section>
        ) : (
          <section className="rounded-xl border border-neutral-200/90 bg-white p-6 shadow-sm md:rounded-2xl md:p-8 lg:p-10">
            <h2 className="text-center text-xl font-bold tracking-tight text-neutral-900 md:text-2xl">
              プロフィール設定
            </h2>

            <dl className="mx-auto mt-8 max-w-xl divide-y divide-neutral-200">
              {(
                [
                  ["氏名", saved!.name],
                  ["ふりがな", saved!.kana],
                  ["メールアドレス", saved!.email],
                  ["電話番号", saved!.phone],
                  ["団体名 / 会社名", saved!.organization],
                ] as const
              ).map(([dt, dd]) => (
                <div
                  key={dt}
                  className="flex flex-col gap-1 py-4 text-sm sm:flex-row sm:items-baseline sm:gap-8 sm:py-5"
                >
                  <dt className="shrink-0 font-medium text-neutral-700 sm:w-40">{dt}</dt>
                  <dd className="min-w-0 flex-1 text-neutral-900">{dd}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={handleEdit}
                className="inline-flex items-center gap-1 text-sm font-medium text-[#2c32f1] underline underline-offset-4 transition hover:text-[#252adb]"
              >
                修正する
                <span aria-hidden className="translate-y-px">
                  →
                </span>
              </button>
            </div>
          </section>
        )}
      </div>
    </AdminShell>
  );
}
