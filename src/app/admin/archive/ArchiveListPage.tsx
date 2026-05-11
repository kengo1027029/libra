"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminFixedRowMenuPopover } from "@/components/admin/AdminFixedRowMenuPopover";
import {
  ARCHIVE_SECTION_LABELS,
  ARCHIVE_SOURCE_ORDER,
  groupArchivesBySource,
  loadAdminArchives,
  removeAdminArchiveById,
  restoreAdminArchiveEntry,
  type AdminArchiveEntry,
} from "@/lib/admin-archive";
import { hasAdminSession } from "@/lib/admin-session";

function formatArchivedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ja-JP", { dateStyle: "short", timeStyle: "short" });
}

function entryContent(entry: AdminArchiveEntry): string {
  const d = entry.description?.trim();
  if (d) return d;
  return "—";
}

const thClass = "whitespace-nowrap px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 md:px-4";
const tdClass = "max-w-[min(28rem,55vw)] px-3 py-3 align-top text-sm text-neutral-800 md:max-w-md md:px-4";

const archiveMenuBtnClass =
  "rounded-md px-2 py-1 text-lg leading-none text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2c32f1]/40";

export function ArchiveListPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [archives, setArchives] = useState<AdminArchiveEntry[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const refresh = useCallback(() => {
    setArchives(loadAdminArchives());
  }, []);

  useEffect(() => {
    if (!hasAdminSession()) {
      router.replace("/admin/login");
      return;
    }
    setReady(true);
    refresh();
  }, [router, refresh]);

  const bySource = useMemo(() => groupArchivesBySource(archives), [archives]);

  const handleRestore = useCallback(
    (entry: AdminArchiveEntry) => {
      const result = restoreAdminArchiveEntry(entry);
      if (!result.ok) {
        window.alert(result.message);
        return;
      }
      refresh();
      router.push(result.redirectPath);
    },
    [refresh, router],
  );

  const closeMenu = useCallback(() => setOpenMenuId(null), []);

  const toggleMenu = useCallback((id: string) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  }, []);

  const handleDeleteFromMenu = useCallback(() => {
    if (!openMenuId) return;
    const entry = archives.find((e) => e.id === openMenuId);
    if (!entry) {
      closeMenu();
      return;
    }
    const ok = window.confirm("このアーカイブを削除しますか？");
    if (!ok) return;
    removeAdminArchiveById(entry.id);
    closeMenu();
    refresh();
  }, [archives, closeMenu, openMenuId, refresh]);

  const openMenuEntry = openMenuId ? archives.find((e) => e.id === openMenuId) : undefined;

  if (!ready) {
    return (
      <AdminShell>
        <div className="rounded-xl border border-neutral-200/90 bg-white p-10 text-center text-sm text-neutral-500 shadow-sm">
          読み込み中…
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <section className="rounded-xl border border-neutral-200/90 bg-white p-6 shadow-sm md:rounded-2xl md:p-8 lg:p-10">
        <header className="border-b border-neutral-100 pb-6 md:pb-8">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">アーカイブ</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-600 md:text-base">
            アーカイブしたデータを確認・復活できます。
          </p>
        </header>

        <div className="mt-8 space-y-10 md:mt-10">
          {ARCHIVE_SOURCE_ORDER.map((source) => {
            const sectionTitle = ARCHIVE_SECTION_LABELS[source];
            const rows = bySource[source];
            return (
              <section
                key={source}
                className="rounded-xl border border-neutral-200 bg-neutral-50/90 p-4 shadow-sm md:p-6"
                aria-labelledby={`archive-section-${source}`}
              >
                <h2 id={`archive-section-${source}`} className="text-lg font-semibold text-neutral-900">
                  {sectionTitle}
                </h2>

                <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-200 [-webkit-overflow-scrolling:touch]">
                  <table className="min-w-[640px] w-full border-collapse text-left md:min-w-0">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50">
                        <th className={thClass}>名前</th>
                        <th className={thClass}>内容</th>
                        <th className={thClass}>アーカイブ日時</th>
                        <th className={`${thClass} w-[1%] whitespace-nowrap`}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-sm text-neutral-500">
                            アーカイブはありません
                          </td>
                        </tr>
                      ) : (
                        rows.map((entry) => (
                          <tr key={entry.id} className="border-b border-neutral-100 last:border-b-0">
                            <td className={`${tdClass} font-medium text-neutral-900`}>{entry.title}</td>
                            <td className={`${tdClass} break-words text-neutral-700`}>{entryContent(entry)}</td>
                            <td className={`${tdClass} whitespace-nowrap text-neutral-600`}>
                              {formatArchivedAt(entry.archivedAt)}
                            </td>
                            <td className={`${tdClass} whitespace-nowrap`}>
                              <div className="flex flex-wrap items-center justify-end gap-2 md:gap-3">
                                {source !== "applicants" ? (
                                  <button
                                    type="button"
                                    onClick={() => handleRestore(entry)}
                                    className="text-sm font-medium text-neutral-800 underline-offset-2 transition hover:text-neutral-950 hover:underline"
                                  >
                                    復活
                                  </button>
                                ) : null}
                                <div
                                  data-archive-row-menu={entry.id}
                                  className="relative inline-flex shrink-0 justify-end"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    className={archiveMenuBtnClass}
                                    ref={(el) => {
                                      menuButtonRefs.current[entry.id] = el;
                                    }}
                                    aria-expanded={openMenuId === entry.id}
                                    aria-haspopup="menu"
                                    aria-label={`${entry.title} の操作メニュー`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleMenu(entry.id);
                                    }}
                                  >
                                    ···
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      </section>
      {openMenuId && openMenuEntry ? (
        <AdminFixedRowMenuPopover
          openMenuId={openMenuId}
          getAnchorEl={() => menuButtonRefs.current[openMenuId] ?? null}
          rowMenuRootAttr="data-archive-row-menu"
          estimatedMenuHeight={48}
          estimatedMenuWidth={140}
          menuPanelClassName="min-w-[10.5rem] py-0.5"
          onClose={closeMenu}
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center px-3 py-2 text-left text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={handleDeleteFromMenu}
          >
            削除
          </button>
        </AdminFixedRowMenuPopover>
      ) : null}
    </AdminShell>
  );
}
