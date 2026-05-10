import type { Metadata } from "next";
import { VendorReviewsListPage } from "./VendorReviewsListPage";

export const metadata: Metadata = {
  title: "出店者評価リスト | Libra 管理",
};

export default function AdminVendorReviewsRoutePage() {
  return <VendorReviewsListPage />;
}
