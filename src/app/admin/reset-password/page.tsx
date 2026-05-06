import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "新しいパスワード設定 | Libra 管理",
};

export default function AdminResetPasswordPage() {
  return (
    <AuthLayout>
      <ResetPasswordForm />
    </AuthLayout>
  );
}
