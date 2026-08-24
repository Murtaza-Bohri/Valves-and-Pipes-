import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/CustomerAuthForms";
import { PageHeader, PageLayout } from "@/components/PageLayout";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Forgot Password | Himmat Oilfields & Marines",
  description: "Reset your Himmat account password.",
  path: "/forgot-password",
});

export default function ForgotPasswordPage() {
  return (
    <PageLayout className="bg-[#f7f7f7]">
      <PageHeader eyebrow="Account" title="Forgot password" />
      <div className="mx-auto mt-10 max-w-md px-6 sm:px-10">
        <ForgotPasswordForm />
      </div>
    </PageLayout>
  );
}
