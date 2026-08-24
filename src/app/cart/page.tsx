import type { Metadata } from "next";
import { CartPageClient } from "@/components/CartPageClient";
import { PageHeader, PageLayout } from "@/components/PageLayout";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Cart | Himmat Oilfields & Marines",
  description: "Review items in your cart before requesting a quote.",
  path: "/cart",
});

export default function CartPage() {
  return (
    <PageLayout className="bg-[#f7f7f7]">
      <PageHeader
        eyebrow="Cart"
        title="Your cart"
        description="Prices are validated on the server when items are added or updated."
      />
      <div className="mt-10">
        <CartPageClient />
      </div>
    </PageLayout>
  );
}
