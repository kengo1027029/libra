import type { Metadata } from "next";
import { AdminDashboard } from "@/app/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "プロフィール設定 | Libra 管理",
};

export default function AdminDashboardPage() {
  return <AdminDashboard />;
}
