import type { Metadata } from "next";
import { EventDetailPage } from "./EventDetailPage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "イベント詳細 | Libra 管理",
};

export default async function AdminEventDetailRoutePage({ params }: PageProps) {
  const { id } = await params;
  return <EventDetailPage eventId={id} />;
}
