export const ADMIN_VENDOR_REVIEWS_STORAGE_KEY = "libra_vendor_reviews";
export const VENDOR_REVIEW_EVENT_NAMES_STORAGE_KEY = "libra_vendor_review_event_names";

export type VendorReviewDraft = {
  vendorName: string;
  eventName: string;
  instagramUrl: string;
  score1: number;
  score2: number;
  score3: number;
  reason: string;
};

export type StoredVendorReview = {
  id: string;
  createdAt: string;
  vendorName: string;
  eventName: string;
  instagramUrl: string;
  score1: number;
  score2: number;
  score3: number;
  reason: string;
};

export const EMPTY_VENDOR_REVIEW_DRAFT: VendorReviewDraft = {
  vendorName: "",
  eventName: "",
  instagramUrl: "",
  score1: 0,
  score2: 0,
  score3: 0,
  reason: "",
};

function isScore(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 5;
}

/** レガシーJSONを正規化し、eventName がない場合は空文字で補完して返す */
function parseStoredVendorReview(value: unknown): StoredVendorReview | null {
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  const eventName = typeof o.eventName === "string" ? o.eventName : "";
  if (
    typeof o.id !== "string" ||
    typeof o.createdAt !== "string" ||
    typeof o.vendorName !== "string" ||
    typeof o.instagramUrl !== "string" ||
    !isScore(o.score1) ||
    !isScore(o.score2) ||
    !isScore(o.score3) ||
    typeof o.reason !== "string"
  ) {
    return null;
  }
  return {
    id: o.id,
    createdAt: o.createdAt,
    vendorName: o.vendorName,
    eventName,
    instagramUrl: o.instagramUrl,
    score1: o.score1,
    score2: o.score2,
    score3: o.score3,
    reason: o.reason,
  };
}

/** アーカイブ復元など、任意のJSONから1件だけ正規化する用途 */
export function tryParseStoredVendorReview(value: unknown): StoredVendorReview | null {
  return parseStoredVendorReview(value);
}

export function loadVendorReviews(): StoredVendorReview[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ADMIN_VENDOR_REVIEWS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(parseStoredVendorReview).filter((r): r is StoredVendorReview => r !== null);
  } catch {
    return [];
  }
}

export function saveVendorReviews(reviews: StoredVendorReview[]): void {
  localStorage.setItem(ADMIN_VENDOR_REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
}

export function appendVendorReview(review: StoredVendorReview): void {
  const current = loadVendorReviews();
  saveVendorReviews([review, ...current]);
}

export function loadVendorReviewEventNames(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(VENDOR_REVIEW_EVENT_NAMES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((name): name is string => typeof name === "string")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);
  } catch {
    return [];
  }
}

export function saveVendorReviewEventNames(names: string[]): void {
  const unique = Array.from(
    new Set(names.map((name) => name.trim()).filter((name) => name.length > 0)),
  );
  localStorage.setItem(VENDOR_REVIEW_EVENT_NAMES_STORAGE_KEY, JSON.stringify(unique));
}

export type VendorReviewSummary = {
  id: string;
  vendorName: string;
  averageScore1: number;
  averageScore2: number;
  averageScore3: number;
  overallScore: number;
  commentCount: number;
  reviewCount: number;
  reviews: StoredVendorReview[];
};

export function vendorIdFromName(vendorName: string): string {
  return encodeURIComponent(vendorName.trim().toLowerCase());
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

export function summarizeVendorReviews(reviews: StoredVendorReview[]): VendorReviewSummary[] {
  const groups = new Map<string, StoredVendorReview[]>();
  for (const review of reviews) {
    const key = vendorIdFromName(review.vendorName);
    if (!key) continue;
    const list = groups.get(key);
    if (list) {
      list.push(review);
    } else {
      groups.set(key, [review]);
    }
  }

  const summaries: VendorReviewSummary[] = [];
  for (const [id, group] of groups) {
    const avg1 = average(group.map((r) => r.score1));
    const avg2 = average(group.map((r) => r.score2));
    const avg3 = average(group.map((r) => r.score3));
    const overall = average([avg1, avg2, avg3]);
    const commentCount = group.filter((r) => r.reason.trim().length > 0).length;
    summaries.push({
      id,
      vendorName: group[0].vendorName,
      averageScore1: avg1,
      averageScore2: avg2,
      averageScore3: avg3,
      overallScore: overall,
      commentCount,
      reviewCount: group.length,
      reviews: group,
    });
  }

  return summaries;
}

export function findVendorSummaryById(
  reviews: StoredVendorReview[],
  id: string,
): VendorReviewSummary | null {
  const summaries = summarizeVendorReviews(reviews);
  return summaries.find((s) => s.id === id) ?? null;
}

export function formatScore(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0.0";
  return value.toFixed(1);
}
