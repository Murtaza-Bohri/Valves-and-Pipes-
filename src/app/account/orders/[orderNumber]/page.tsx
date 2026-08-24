import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerSession } from "@/app/auth/actions";
import { getCustomerOrderDetail } from "@/lib/orders";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { formatPrice } from "@/lib/products";

type AccountOrderDetailPageProps = {
  params: Promise<{ orderNumber: string }>;
};

export default async function AccountOrderDetailPage({
  params,
}: AccountOrderDetailPageProps) {
  const { orderNumber } = await params;
  const session = await getCustomerSession();
  if (!session) notFound();

  const detail = await getCustomerOrderDetail(session.user.id, orderNumber);
  if (!detail) notFound();

  return (
    <div className="space-y-6">
      <Link href="/account/orders" className="text-sm text-[#bd1115] hover:underline">
        ← Back to orders
      </Link>
      <div className="border border-[#e8e8e8] bg-white p-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[#141414]">
          {detail.order.order_number}
        </h2>
        <p className="mt-2 text-sm text-[#6b6b6b]">
          Status: {ORDER_STATUS_LABELS[detail.order.status]}
        </p>
        <p className="mt-1 font-semibold text-[#141414]">
          Total: {formatPrice(Number(detail.order.total_amount))}
        </p>
      </div>
      <div className="border border-[#e8e8e8] bg-white p-6">
        <h3 className="mb-4 text-xs font-semibold tracking-[0.14em] uppercase">Items</h3>
        <div className="space-y-3">
          {detail.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-4 text-sm">
              <span>
                {item.product_name}
                {item.impa_number ? ` (IMPA ${item.impa_number})` : ""} × {item.quantity}
              </span>
              <span className="font-semibold">
                {formatPrice(Number(item.price_at_purchase) * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
