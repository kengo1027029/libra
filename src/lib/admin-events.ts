export const ADMIN_EVENTS_STORAGE_KEY = "libra_admin_events";

export type VisitorScale = "500〜1,000" | "1,001〜3,000" | "3,001〜5,000" | "5,001〜";

export type AdminEventStatus = "申請中" | "掲載中" | "下書き" | "差し戻し";

export type AdminEventDraft = {
  topImageName: string;
  title: string;
  description: string;
  eventStartDate: string;
  eventEndDate: string;
  eventStartTime: string;
  eventEndTime: string;
  visitorScale: VisitorScale | "";
  boothFee: string;
  paymentMethod: string;
  rentalEquipment: string;
  hpUrl: string;
  snsUrl: string;
  applicationStartDate: string;
  applicationEndDate: string;
  cancellationPolicy: string;
  emergencyContact: string;
  messageToExhibitors: string;
};

export type StoredAdminEvent = {
  id: string;
  createdAt: string;
  publishedAt: string;
  status: AdminEventStatus;
  topImageName: string;
  title: string;
  description: string;
  eventStartDate: string;
  eventEndDate: string;
  eventStartTime: string;
  eventEndTime: string;
  visitorScale: VisitorScale;
  boothFee: string;
  paymentMethod: string;
  rentalEquipment: string;
  hpUrl: string;
  snsUrl: string;
  applicationStartDate: string;
  applicationEndDate: string;
  cancellationPolicy: string;
  emergencyContact: string;
  messageToExhibitors: string;
};

export const EMPTY_ADMIN_EVENT_DRAFT: AdminEventDraft = {
  topImageName: "",
  title: "",
  description: "",
  eventStartDate: "",
  eventEndDate: "",
  eventStartTime: "",
  eventEndTime: "",
  visitorScale: "",
  boothFee: "",
  paymentMethod: "",
  rentalEquipment: "",
  hpUrl: "",
  snsUrl: "",
  applicationStartDate: "",
  applicationEndDate: "",
  cancellationPolicy: "",
  emergencyContact: "",
  messageToExhibitors: "",
};

function isVisitorScale(value: unknown): value is VisitorScale {
  return value === "500〜1,000" || value === "1,001〜3,000" || value === "3,001〜5,000" || value === "5,001〜";
}

function isStoredAdminEvent(value: unknown): value is StoredAdminEvent {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.createdAt === "string" &&
    typeof o.publishedAt === "string" &&
    (o.status === "申請中" || o.status === "掲載中" || o.status === "下書き" || o.status === "差し戻し") &&
    typeof o.topImageName === "string" &&
    typeof o.title === "string" &&
    typeof o.description === "string" &&
    typeof o.eventStartDate === "string" &&
    typeof o.eventEndDate === "string" &&
    typeof o.eventStartTime === "string" &&
    typeof o.eventEndTime === "string" &&
    isVisitorScale(o.visitorScale) &&
    typeof o.boothFee === "string" &&
    typeof o.paymentMethod === "string" &&
    typeof o.rentalEquipment === "string" &&
    typeof o.hpUrl === "string" &&
    typeof o.snsUrl === "string" &&
    typeof o.applicationStartDate === "string" &&
    typeof o.applicationEndDate === "string" &&
    typeof o.cancellationPolicy === "string" &&
    typeof o.emergencyContact === "string" &&
    typeof o.messageToExhibitors === "string"
  );
}

function pickStringField(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string") return value;
  }
  return "";
}

function normalizeStoredAdminEvent(value: unknown): StoredAdminEvent | null {
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  const candidate: Record<string, unknown> = {
    ...o,
    publishedAt: typeof o.publishedAt === "string" ? o.publishedAt : "",
    applicationStartDate: pickStringField(o, [
      "applicationStartDate",
      "applicationPeriodStart",
      "recruitmentStartDate",
      "applicationStart",
    ]),
    applicationEndDate: pickStringField(o, [
      "applicationEndDate",
      "applicationPeriodEnd",
      "recruitmentEndDate",
      "applicationEnd",
    ]),
  };
  return isStoredAdminEvent(candidate) ? (candidate as StoredAdminEvent) : null;
}

/** アーカイブ復元など、任意のJSONから1件だけ正規化する用途 */
export function tryParseStoredAdminEvent(value: unknown): StoredAdminEvent | null {
  return normalizeStoredAdminEvent(value);
}

export function loadAdminEvents(): StoredAdminEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ADMIN_EVENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeStoredAdminEvent).filter((e): e is StoredAdminEvent => e !== null);
  } catch {
    return [];
  }
}

export function saveAdminEvents(events: StoredAdminEvent[]): void {
  localStorage.setItem(ADMIN_EVENTS_STORAGE_KEY, JSON.stringify(events));
}

export function appendAdminEvent(event: StoredAdminEvent): void {
  const current = loadAdminEvents();
  saveAdminEvents([event, ...current]);
}
