import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import { AuthLayout } from "@/components/auth/AuthLayout";

export const metadata: Metadata = {
  title: "ログイン | Libra 管理",
};

export default function AdminLoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
