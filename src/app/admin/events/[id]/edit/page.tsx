import type { Metadata } from "next";
import { EditEventPage } from "./EditEventPage";

export const metadata: Metadata = {
  title: "イベント内容修正 | Libra 管理",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEventEditPlaceholderPage({ params }: PageProps) {
  const { id } = await params;
  return <EditEventPage eventId={id} />;
}
