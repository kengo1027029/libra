export type ContactStatus = "返信待ち" | "出店確定" | "入金待ち";

export type Applicant = {
  id: string;
  entryDate: string;
  name: string;
  genre: string;
  contactStatus: ContactStatus;
};

export type ApplicantProfile = {
  applicantId: string;
  shopName: string;
  sns: string;
  productGenre: string;
  contactName: string;
  kana: string;
  email: string;
  phone: string;
};

const APPLICANTS: Applicant[] = [
  { id: "1", entryDate: "2025.00.00", name: "Libra", genre: "キーホルダー", contactStatus: "返信待ち" },
  { id: "2", entryDate: "2025.00.00", name: "coco brand", genre: "衣類", contactStatus: "出店確定" },
  { id: "3", entryDate: "2025.00.00", name: "わんわんマルシェ", genre: "おやつ", contactStatus: "入金待ち" },
  { id: "4", entryDate: "2025.00.00", name: "Mugi Works", genre: "雑貨", contactStatus: "出店確定" },
  { id: "5", entryDate: "2025.00.00", name: "にくきゅう工房", genre: "おやつ", contactStatus: "入金待ち" },
  { id: "6", entryDate: "2025.00.00", name: "Paw Studio", genre: "アクセサリー", contactStatus: "出店確定" },
  { id: "7", entryDate: "2025.00.00", name: "犬服 atelier", genre: "衣類", contactStatus: "出店確定" },
  { id: "8", entryDate: "2025.00.00", name: "しっぽの時間", genre: "おやつ", contactStatus: "入金待ち" },
  { id: "9", entryDate: "2025.00.00", name: "わんにゃん堂", genre: "雑貨", contactStatus: "出店確定" },
  { id: "10", entryDate: "2025.00.00", name: "COCO PAW", genre: "アクセサリー", contactStatus: "返信待ち" },
];

const APPLICANT_PROFILE_MAP: Record<string, ApplicantProfile> = {
  "1": {
    applicantId: "1",
    shopName: "LIBRA",
    sns: "https://example.com/libra",
    productGenre: "キーホルダー",
    contactName: "山田太郎",
    kana: "やまだたろう",
    email: "email@example.com",
    phone: "09001234567",
  },
  "2": {
    applicantId: "2",
    shopName: "COCO BRAND",
    sns: "http://example.com/cocobrand",
    productGenre: "衣類",
    contactName: "山田太郎",
    kana: "やまだたろう",
    email: "email@example.com",
    phone: "09001234567",
  },
  "3": {
    applicantId: "3",
    shopName: "わんわんマルシェ",
    sns: "https://example.com/wanwan",
    productGenre: "おやつ",
    contactName: "田中花子",
    kana: "たなかはなこ",
    email: "hanako@example.com",
    phone: "08012345678",
  },
};

const fallbackProfile: ApplicantProfile = {
  applicantId: "0",
  shopName: "COCO BRAND",
  sns: "http://example.com",
  productGenre: "キーホルダー",
  contactName: "山田太郎",
  kana: "やまだたろう",
  email: "email@example.com",
  phone: "09001234567",
};

export function getApplicantsForEvent(eventId: string): Applicant[] {
  void eventId;
  return APPLICANTS;
}

export function getApplicantProfileForEvent(eventId: string, applicantId: string): ApplicantProfile {
  void eventId;
  return APPLICANT_PROFILE_MAP[applicantId] ?? {
    ...fallbackProfile,
    applicantId,
  };
}
