import type { Metadata } from "next";
import { SimpleNewEventPage } from "./SimpleNewEventPage";

export const metadata: Metadata = {
  title: "イベント登録 | Libra 管理",
};

export default function AdminEventsNewPage() {
  return <SimpleNewEventPage />;
}
