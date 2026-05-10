import type { Metadata } from "next";
import { VendorReviewDetailPage } from "./VendorReviewDetailPage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "出店者評価詳細 | Libra 管理",
};

export default async function AdminVendorReviewDetailRoutePage({ params }: PageProps) {
  const { id } = await params;
  return <VendorReviewDetailPage vendorId={id} />;
}
