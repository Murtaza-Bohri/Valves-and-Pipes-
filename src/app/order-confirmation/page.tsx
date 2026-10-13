import type { Metadata } from "next";
import Link from "next/link";
import { ClearCartOnOrderConfirmation } from "@/components/ClearCartOnOrderConfirmation";
import { PageLayout } from "@/components/PageLayout";
import { formatPrice } from "@/lib/products";
import { createPageMetadata } from "@/lib/seo";
import { getOrderByOrderNumber, syncOrderFromZiinaIntent } from "@/lib/ziina-orders";
import { getZiinaPaymentIntent } from "@/lib/ziina";

export const metadata: Metadata = createPageMetadata({
  title: "Order Confirmation | Himmat Oilfields & Marines",
  description: "Your order has been placed successfully.",
  path: "/order-confirmation",
});

type OrderConfirmationPageProps = {
  searchParams: Promise<{
    order?: string;
    total?: string;
    payment_intent_id?: string;
    payment?: string;
  }>;
};

function paymentStatusMessage(
  paymentStatus: string,
  paymentQuery?: string
): { title: string; subtitle: string; tone: "success" | "pending" | "error" } {
  if (paymentQuery === "cancelled" || paymentStatus === "cancelled") {
    return {
      tone: "error",
      title: "Payment cancelled",
      subtitle:
        "Your order was saved but payment was not completed. You can return to checkout or contact us for assistance.",
    };
  }

  if (paymentQuery === "failed" || paymentStatus === "failed") {
    return {
      tone: "error",
      title: "Payment failed",
      subtitle:
        "We could not process your payment. Your order is on hold until payment succeeds.",
    };
  }

  if (paymentStatus === "paid") {
    return {
      tone: "success",
      title: "Thank you for your order",
      subtitle: "Your payment was received. We will confirm shipping details by email.",
    };
  }

  return {
    tone: "pending",
    title: "Order received — payment pending",
    subtitle:
      "Complete payment on Ziina if you were redirected back without paying, or wait a moment while we confirm your payment.",
  };
}

export default async function OrderConfirmationPage({
  searchParams,
}: OrderConfirmationPageProps) {
  const params = await searchParams;
  const orderNumber = params.order?.trim();
  const paymentIntentId = params.payment_intent_id?.trim();

  let order = orderNumber ? await getOrderByOrderNumber(orderNumber) : null;

  if (paymentIntentId) {
    const fetched = await getZiinaPaymentIntent(paymentIntentId);
    if (fetched.ok) {
      const synced = await syncOrderFromZiinaIntent(fetched.intent);
      if (synced.ok) {
        order = synced.order;
      }
    }
  }

  const totalAmount =
    order != null
      ? Number(order.total_amount)
      : params.total
        ? Number(params.total)
        : null;

  const paymentStatus = order?.payment_status ?? "unpaid";
  const copy = paymentStatusMessage(paymentStatus, params.payment);
  const shouldClearCart = paymentStatus === "paid";

  const eyebrow =
    copy.tone === "success"
      ? "Order confirmed"
      : copy.tone === "error"
        ? "Payment issue"
        : "Order placed";

  return (
    <PageLayout className="bg-[#f7f7f7]">
      <ClearCartOnOrderConfirmation shouldClear={shouldClearCart} />
      <div className="mx-auto max-w-2xl px-6 py-16 sm:px-10">
        <p className="mb-4 text-xs font-semibold tracking-[0.28em] text-[#bd1115] uppercase">
          {eyebrow}
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#141414]">
          {copy.title}
        </h1>
        <p className="mt-3 text-sm text-[#6b6b6b]">{copy.subtitle}</p>
        <div className="mt-8 space-y-3 border border-[#e8e8e8] bg-white p-6 text-sm">
          <p>
            <span className="font-semibold text-[#141414]">Order ID:</span>{" "}
            {order?.order_number ?? orderNumber ?? "—"}
          </p>
          {totalAmount != null && Number.isFinite(totalAmount) ? (
            <p>
              <span className="font-semibold text-[#141414]">Total:</span>{" "}
              {formatPrice(totalAmount)}
            </p>
          ) : null}
          {order ? (
            <p>
              <span className="font-semibold text-[#141414]">Payment:</span>{" "}
              {paymentStatus === "paid"
                ? "Paid"
                : paymentStatus === "failed"
                  ? "Failed"
                  : paymentStatus === "cancelled"
                    ? "Cancelled"
                    : "Awaiting payment"}
            </p>
          ) : null}
          <p className="text-[#6b6b6b]">
            Save your Order ID to track your order later.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-4">
          {paymentStatus !== "paid" ? (
            <Link
              href="/checkout"
              className="bg-[#bd1115] px-5 py-2.5 text-xs font-semibold tracking-[0.14em] text-white uppercase hover:bg-[#9a0e12]"
            >
              Return to checkout
            </Link>
          ) : null}
          <Link
            href={`/track-order${orderNumber ? `?order=${encodeURIComponent(orderNumber)}` : ""}`}
            className="border border-[#141414] px-5 py-2.5 text-xs font-semibold tracking-[0.14em] text-[#141414] uppercase hover:border-[#bd1115] hover:text-[#bd1115]"
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
