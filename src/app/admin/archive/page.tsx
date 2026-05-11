import type { Metadata } from "next";
import { ArchiveListPage } from "./ArchiveListPage";

export const metadata: Metadata = {
  title: "アーカイブ | Libra 管理",
};

export default function AdminArchiveRoutePage() {
  return <ArchiveListPage />;
}
