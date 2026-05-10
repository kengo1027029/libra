import type { Metadata } from "next";
import { NewVendorReviewPage } from "./NewVendorReviewPage";

export const metadata: Metadata = {
  title: "出店者評価入力 | Libra 管理",
};

export default function AdminVendorReviewNewRoutePage() {
  return <NewVendorReviewPage />;
}
