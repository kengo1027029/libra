"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ENABLE_GOOGLE_OAUTH } from "@/lib/admin-google-oauth";
import { clearAllClientAdminAuth } from "@/lib/admin-session";
import { loadAdminProfile } from "@/lib/admin-profile";
import { isAuthMockMode } from "@/lib/auth-mode";
import { createClient, hasSupabaseBrowserConfig } from "@/lib/supabase";

function normalizePath(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}

const ADMIN_EVENTS_BASE = "/admin/events";

/**
 * 「イベント掲載一覧」配下: `src/app/admin/events/` の一覧・`[id]` 配下（詳細・編集・応募者など）をまとめて判定。
 * サイドバー「イベント登録」系の静的ルート（`events/new`, `events/new2`）は除外。
 */
const ADMIN_EVENT_REGISTRATION_BASES = [`${ADMIN_EVENTS_BASE}/new`, `${ADMIN_EVENTS_BASE}/new2`] as const;

function isActiveEventListingNav(p: string): boolean {
  const path = normalizePath(p);
  if (path === ADMIN_EVENTS_BASE) return true;
  if (!path.startsWith(`${ADMIN_EVENTS_BASE}/`)) return false;
  return !ADMIN_EVENT_REGISTRATION_BASES.some((base) => path === base || path.startsWith(`${base}/`));
}

function extractFamilyName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "管理者";
  if (trimmed.includes(" ")) return trimmed.split(" ")[0] || "管理者";
  if (trimmed.includes("\u3000")) return trimmed.split("\u3000")[0] || "管理者";
  return trimmed.length >= 2 ? trimmed.slice(0, 2) : trimmed;
}

function IconProfile({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M6 20v-1.4c0-3.2 3.3-4.9 6-4.9s6 1.7 6 4.9V20" />
    </svg>
  );
}

function IconList({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function IconEventAdd({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <path d="M12 9v6M9 12h6" />
    </svg>
  );
}

function IconStar({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function IconArchive({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M5 8v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
      <path d="M10 12h4" />
    </svg>
  );
}

function IconLogout({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
      <path d="M10 17a2 2 0 1 0 4 0" />
    </svg>
  );
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1A1.7 1.7 0 0 0 10 3.2V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.4 1z" />
    </svg>
  );
}

type NavLinkConfig = {
  href: string;
  label: string;
  Icon: typeof IconProfile;
  isActive: (pathname: string) => boolean;
};

const navLinks: NavLinkConfig[] = [
  { href: "/admin", label: "プロフィール設定", Icon: IconProfile, isActive: (p) => normalizePath(p) === "/admin" },
  { href: "/admin/events", label: "イベント掲載一覧", Icon: IconList, isActive: isActiveEventListingNav },
  { href: "/admin/events/new", label: "イベント登録", Icon: IconEventAdd, isActive: (p) => normalizePath(p) === "/admin/events/new" },
  { href: "/admin/events/new2", label: "イベント登録2", Icon: IconEventAdd, isActive: (p) => normalizePath(p) === "/admin/events/new2" },
  {
    href: "/admin/vendor-reviews",
    label: "出店者評価",
    Icon: IconStar,
    isActive: (p) => {
      const path = normalizePath(p);
      return path === "/admin/vendor-reviews" || path.startsWith("/admin/vendor-reviews/");
    },
  },
  {
    href: "/admin/archive",
    label: "アーカイブ",
    Icon: IconArchive,
    isActive: (p) => normalizePath(p) === "/admin/archive",
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [profileName, setProfileName] = useState("管理者");
  const [profileEmail, setProfileEmail] = useState("sample@example.com");
  const [menuOpen, setMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const profile = loadAdminProfile();
    if (!profile) return;
    if (profile.name.trim()) setProfileName(profile.name.trim());
    if (profile.email.trim()) setProfileEmail(profile.email.trim());
  }, []);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (!menuOpen) return;
      const target = e.target as Node | null;
      if (!target) return;
      if (profileMenuRef.current?.contains(target)) return;
      setMenuOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [menuOpen]);

  const familyName = useMemo(() => extractFamilyName(profileName), [profileName]);

  async function handleLogout() {
    if (ENABLE_GOOGLE_OAUTH && hasSupabaseBrowserConfig() && !isAuthMockMode()) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {
        // Supabase 未設定・オフライン時もログアウトは完了させる
      }
    }
    clearAllClientAdminAuth();
    window.location.href = "/admin/login";
  }

  const linkBase = "relative flex items-center gap-2.5 rounded-r-lg py-2.5 pl-4 pr-3 text-sm transition before:absolute before:left-0 before:top-1 before:h-[calc(100%-8px)] before:w-1 before:rounded-full before:transition-colors";

  return (
    <div className="flex min-h-dvh flex-col bg-[#f8f9fa]">
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white">
        <div className="flex h-20 items-center justify-between px-4 md:px-8">
          <Link href="/admin" className="inline-flex items-center rounded-md px-1 py-1 transition hover:opacity-90">
            <Image src="/images/libra-logo.png" alt="Libra" width={132} height={36} sizes="132px" className="h-7 w-auto object-contain" priority />
          </Link>

          <div className="flex items-center gap-2 md:gap-3">
            <button type="button" className="hidden rounded-md bg-[#12c95f] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0fb455] md:inline-flex">
              + LINE連携
            </button>
            <Link href="/admin/events/new" className="hidden rounded-md bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 md:inline-flex">
              + 新規イベント登録
            </Link>
            <button type="button" className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
              <IconBell className="h-5 w-5" />
              <span className="absolute right-0 top-0 inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-semibold text-white">3</span>
            </button>

            <div ref={profileMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex h-11 min-w-11 items-center justify-center rounded-full bg-neutral-100 px-3 text-sm font-semibold text-neutral-900"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                {familyName}
              </button>

              {menuOpen ? (
                <div className="absolute right-0 top-full z-50 mt-3 w-[250px] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl" role="menu">
                  <div className="border-b border-neutral-200 px-4 py-4">
                    <p className="text-xl font-semibold text-neutral-900">{profileName}</p>
                    <p className="mt-1 break-all text-sm text-neutral-500">{profileEmail}</p>
                  </div>
                  <div className="px-2 py-2">
                    <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
                      <IconProfile className="h-5 w-5 text-neutral-400" />
                      プロフィール
                    </Link>
                    <Link href="/admin/settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
                      <IconSettings className="h-5 w-5 text-neutral-400" />
                      設定
                    </Link>
                  </div>
                  <div className="border-t border-neutral-200 px-2 py-2">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-neutral-900 hover:bg-neutral-50"
                    >
                      <IconLogout className="h-5 w-5 text-neutral-400" />
                      ログアウト
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 md:flex-row">
        <aside className="hidden border-r border-neutral-200 bg-white md:fixed md:bottom-0 md:left-0 md:top-20 md:z-40 md:block md:w-56 md:shrink-0 md:overflow-y-auto">
          <nav className="px-2 py-4">
            <ul className="space-y-0.5">
              {navLinks.map((item) => {
                const active = item.isActive(pathname);
                const NavIcon = item.Icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`${linkBase} ${
                        active
                          ? "bg-[#2c32f1]/[0.06] font-semibold text-[#2c32f1] before:bg-[#2c32f1]"
                          : "font-medium text-neutral-600 before:bg-transparent hover:bg-neutral-50 hover:text-neutral-900"
                      }`}
                    >
                      <NavIcon className={`h-4 w-4 shrink-0 ${active ? "text-[#2c32f1]" : "text-neutral-500"}`} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col md:pl-56">
          <header className="border-b border-neutral-200 bg-white px-4 py-2 md:hidden">
            <nav className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
              {navLinks.map((item) => {
                const active = item.isActive(pathname);
                const NavIcon = item.Icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
                      active
                        ? "border-[#2c32f1] bg-[#2c32f1]/10 text-[#2c32f1]"
                        : "border-neutral-200 bg-white text-neutral-700"
                    }`}
                  >
                    <NavIcon className={`h-3.5 w-3.5 shrink-0 ${active ? "text-[#2c32f1]" : "text-neutral-500"}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>
          <main className="flex-1 px-4 py-8 md:px-10 md:py-10">
            <div key={pathname} className="page-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
