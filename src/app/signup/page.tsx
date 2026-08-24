import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/CustomerAuthForms";
import { PageHeader, PageLayout } from "@/components/PageLayout";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Create Account | Himmat Oilfields & Marines",
  description: "Create a Himmat customer account.",
  path: "/signup",
});

export default function SignupPage() {
  return (
    <PageLayout className="bg-[#f7f7f7]">
      <PageHeader eyebrow="Account" title="Create account" />
      <div className="mx-auto mt-10 max-w-md px-6 sm:px-10">
        <SignupForm />
      </div>
    </PageLayout>
  );
}
