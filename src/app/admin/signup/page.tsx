import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
  title: "サインアップ | Libra 管理",
};

export default function AdminSignupPage() {
  return (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  );
}
