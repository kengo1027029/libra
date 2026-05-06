import type { Metadata } from "next";
import { SettingsPage } from "./settings-page";

export const metadata: Metadata = {
  title: "設定 | Libra 管理",
};

export default function AdminSettingsRoutePage() {
  return <SettingsPage />;
}
