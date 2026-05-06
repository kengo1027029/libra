import type { Metadata } from "next";
import { NewEventPage } from "./NewEventPage";

export const metadata: Metadata = {
  title: "イベント登録 | Libra 管理",
};

export default function AdminEventsNewPage() {
  return <NewEventPage />;
}
