import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/CustomerAuthForms";
import { PageHeader, PageLayout } from "@/components/PageLayout";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Login | Himmat Oilfields & Marines",
  description: "Sign in to your Himmat customer account.",
  path: "/login",
});

type LoginPageProps = {
  searchParams: Promise<{ returnTo?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { returnTo } = await searchParams;

  return (
    <PageLayout className="bg-[#f7f7f7]">
      <PageHeader eyebrow="Account" title="Login" />
      <div className="mx-auto mt-10 max-w-md px-6 sm:px-10">
        <LoginForm returnTo={returnTo ?? "/account"} />
      </div>
    </PageLayout>
  );
}
