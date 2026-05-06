import type { Metadata } from "next";
import { ApplicationsPage } from "./ApplicationsPage";

export const metadata: Metadata = {
  title: "掲載申請一覧 | Libra 管理",
};

export default function AdminApplicationsRoutePage() {
  return <ApplicationsPage />;
}
