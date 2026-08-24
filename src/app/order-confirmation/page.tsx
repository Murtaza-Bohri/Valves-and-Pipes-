import type { Metadata } from "next";
import Link from "next/link";
import { ClearCartOnOrderConfirmation } from "@/components/ClearCartOnOrderConfirmation";
import { PageHeader, PageLayout } from "@/components/PageLayout";
import { formatPrice } from "@/lib/products";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Order Confirmation | Himmat Oilfields & Marines",
  description: "Your order has been placed successfully.",
  path: "/order-confirmation",
});

type OrderConfirmationPageProps = {
  searchParams: Promise<{ order?: string; total?: string }>;
};

export default async function OrderConfirmationPage({
  searchParams,
}: OrderConfirmationPageProps) {
  const { order, total } = await searchParams;
  const totalAmount = total ? Number(total) : null;

  return (
    <PageLayout className="bg-[#f7f7f7]">
      <ClearCartOnOrderConfirmation />
      <div className="mx-auto max-w-2xl px-6 py-16 sm:px-10">
        <p className="mb-4 text-xs font-semibold tracking-[0.28em] text-[#bd1115] uppercase">
          Order placed
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#141414]">
          Thank you for your order
        </h1>
        <div className="mt-8 space-y-3 border border-[#e8e8e8] bg-white p-6 text-sm">
          <p>
            <span className="font-semibold text-[#141414]">Order ID:</span>{" "}
            {order ?? "—"}
          </p>
          {totalAmount != null && Number.isFinite(totalAmount) ? (
            <p>
              <span className="font-semibold text-[#141414]">Total:</span>{" "}
              {formatPrice(totalAmount)}
            </p>
          ) : null}
          <p className="text-[#6b6b6b]">
            Save your Order ID to track your order later.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href={`/track-order${order ? `?order=${encodeURIComponent(order)}` : ""}`}
            className="bg-[#bd1115] px-5 py-2.5 text-xs font-semibold tracking-[0.14em] text-white uppercase hover:bg-[#9a0e12]"
          >
            Track order
          </Link>
          <Link
            href="/products"
            className="border border-[#141414] px-5 py-2.5 text-xs font-semibold tracking-[0.14em] text-[#141414] uppercase hover:border-[#bd1115] hover:text-[#bd1115]"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}
