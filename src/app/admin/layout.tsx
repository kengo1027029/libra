import { AdminLayoutGate } from "./AdminLayoutGate";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutGate>{children}</AdminLayoutGate>;
}
