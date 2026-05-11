import { loadAdminEvents, saveAdminEvents, tryParseStoredAdminEvent } from "@/lib/admin-events";
import type { Applicant } from "@/lib/admin-event-applicants";
import { loadVendorReviews, saveVendorReviews, tryParseStoredVendorReview } from "@/lib/admin-vendor-reviews";

export const ADMIN_ARCHIVES_STORAGE_KEY = "libra_admin_archives";

export type ArchiveSource = "events" | "vendorReviews" | "applicants";

export type AdminArchiveEntry = {
  id: string;
  source: ArchiveSource;
  sourceLabel: string;
  title: string;
  description?: string;
  archivedAt: string;
  originalData: unknown;
};

export const ARCHIVE_SECTION_LABELS: Record<ArchiveSource, string> = {
  events: "イベント掲載一覧",
  vendorReviews: "出店者評価",
  applicants: "応募管理",
};

export const ARCHIVE_SOURCE_ORDER: readonly ArchiveSource[] = ["events", "vendorReviews", "applicants"];

function isArchiveSource(value: unknown): value is ArchiveSource {
  return value === "events" || value === "vendorReviews" || value === "applicants";
}

function parseAdminArchiveEntry(value: unknown): AdminArchiveEntry | null {
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  if (typeof o.id !== "string" || !isArchiveSource(o.source)) return null;
  if (typeof o.sourceLabel !== "string" || typeof o.title !== "string") return null;
  if (typeof o.archivedAt !== "string") return null;
  const description = typeof o.description === "string" ? o.description : undefined;
  return {
    id: o.id,
    source: o.source,
    sourceLabel: o.sourceLabel,
    title: o.title,
    description,
    archivedAt: o.archivedAt,
    originalData: o.originalData,
  };
}

export function loadAdminArchives(): AdminArchiveEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ADMIN_ARCHIVES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(parseAdminArchiveEntry).filter((e): e is AdminArchiveEntry => e !== null);
  } catch {
    return [];
  }
}

export function saveAdminArchives(entries: AdminArchiveEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_ARCHIVES_STORAGE_KEY, JSON.stringify(entries));
}

function newArchiveId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `arc_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/** アーカイブを先頭に追加して保存する */
export function appendAdminArchiveEntry(
  partial: Omit<AdminArchiveEntry, "id" | "archivedAt">,
): AdminArchiveEntry {
  const entry: AdminArchiveEntry = {
    ...partial,
    id: newArchiveId(),
    archivedAt: new Date().toISOString(),
  };
  saveAdminArchives([entry, ...loadAdminArchives()]);
  return entry;
}

function extractEntityIdFromOriginalData(originalData: unknown): string | null {
  if (!originalData || typeof originalData !== "object") return null;
  const id = (originalData as Record<string, unknown>).id;
  return typeof id === "string" ? id : null;
}

/** 一覧から除外するイベント id（source: events のアーカイブ） */
export function getArchivedEventIds(): Set<string> {
  const out = new Set<string>();
  for (const e of loadAdminArchives()) {
    if (e.source !== "events") continue;
    const id = extractEntityIdFromOriginalData(e.originalData);
    if (id) out.add(id);
  }
  return out;
}

export type ArchivedApplicantOriginalData = {
  eventId: string;
  applicant: Applicant;
};

/** 応募管理から除外するキー `${eventId}:${applicantId}` */
export function getArchivedApplicantKeys(): Set<string> {
  const out = new Set<string>();
  for (const e of loadAdminArchives()) {
    if (e.source !== "applicants") continue;
    const od = e.originalData;
    if (!od || typeof od !== "object") continue;
    const rec = od as Record<string, unknown>;
    if (typeof rec.eventId !== "string") continue;
    const applicant = rec.applicant;
    if (!applicant || typeof applicant !== "object") continue;
    const aid = (applicant as Record<string, unknown>).id;
    if (typeof aid === "string") out.add(`${rec.eventId}:${aid}`);
  }
  return out;
}

export function removeAdminArchiveById(id: string): void {
  const next = loadAdminArchives().filter((e) => e.id !== id);
  saveAdminArchives(next);
}

export function groupArchivesBySource(entries: AdminArchiveEntry[]): Record<ArchiveSource, AdminArchiveEntry[]> {
  const grouped: Record<ArchiveSource, AdminArchiveEntry[]> = {
    events: [],
    vendorReviews: [],
    applicants: [],
  };
  for (const e of entries) {
    grouped[e.source].push(e);
  }
  return grouped;
}

function upsertById<T extends { id: string }>(list: T[], item: T): T[] {
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx >= 0) {
    return list.map((x, i) => (i === idx ? item : x));
  }
  return [item, ...list];
}

export type RestoreArchiveResult =
  | { ok: true; redirectPath: string }
  | { ok: false; message: string };

export function restoreAdminArchiveEntry(entry: AdminArchiveEntry): RestoreArchiveResult {
  if (entry.source === "applicants") {
    return { ok: false, message: "応募管理の復活は準備中です。" };
  }

  if (entry.source === "events") {
    const event = tryParseStoredAdminEvent(entry.originalData);
    if (!event) {
      return { ok: false, message: "イベントデータの形式が正しくないため復活できません。" };
    }
    const list = loadAdminEvents();
    saveAdminEvents(upsertById(list, event));
    removeAdminArchiveById(entry.id);
    return { ok: true, redirectPath: "/admin/events" };
  }

  if (entry.source === "vendorReviews") {
    const review = tryParseStoredVendorReview(entry.originalData);
    if (!review) {
      return { ok: false, message: "出店者評価データの形式が正しくないため復活できません。" };
    }
    const list = loadVendorReviews();
    saveVendorReviews(upsertById(list, review));
    removeAdminArchiveById(entry.id);
    return { ok: true, redirectPath: "/admin/vendor-reviews" };
  }

  return { ok: false, message: "不明なアーカイブ種別です。" };
}
