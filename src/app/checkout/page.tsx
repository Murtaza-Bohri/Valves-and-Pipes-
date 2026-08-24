import type { Metadata } from "next";
import { getCustomerAddresses, getCustomerSession } from "@/app/auth/actions";
import { CheckoutClient } from "@/components/CheckoutClient";
import { PageHeader, PageLayout } from "@/components/PageLayout";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Checkout | Himmat Oilfields & Marines",
  description: "Complete your order securely.",
  path: "/checkout",
});

export default async function CheckoutPage() {
  const session = await getCustomerSession();
  const addresses = session ? await getCustomerAddresses() : [];

  return (
    <PageLayout className="bg-[#f7f7f7]">
      <PageHeader
        eyebrow="Checkout"
        title="Complete your order"
        description="Prices are validated on the server when your order is placed."
      />
      <div className="mt-10">
        <CheckoutClient
          isLoggedIn={Boolean(session)}
          customerEmail={session?.user.email}
          customerName={session?.profile?.full_name}
          customerPhone={session?.profile?.phone}
          addresses={addresses}
        />
      </div>
    </PageLayout>
  );
}
