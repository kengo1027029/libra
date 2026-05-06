import type { Metadata } from "next";
import { EventsListPage } from "./EventsListPage";

export const metadata: Metadata = {
  title: "イベント一覧 | Libra 管理",
};

export default function AdminEventsPage() {
  return <EventsListPage />;
}
