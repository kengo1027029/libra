import type { Metadata } from "next";
import { ApplicantDetailPage } from "./ApplicantDetailPage";

type PageProps = {
  params: Promise<{ id: string; applicantId: string }>;
};

export const metadata: Metadata = {
  title: "出店者情報 | Libra 管理",
};

export default async function AdminApplicantDetailRoutePage({ params }: PageProps) {
  const { id, applicantId } = await params;
  return <ApplicantDetailPage eventId={id} applicantId={applicantId} />;
}
