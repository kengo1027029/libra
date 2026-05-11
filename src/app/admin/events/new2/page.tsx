import type { Metadata } from "next";
import { NewEventPage } from "../new/NewEventPage";

export const metadata: Metadata = {
  title: "イベント登録2 | Libra 管理",
};

export default function AdminEventsNew2Page() {
  return <NewEventPage />;
}
