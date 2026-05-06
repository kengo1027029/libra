import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "パスワード再設定 | Libra 管理",
};

export default function AdminForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
