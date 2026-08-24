import Link from "next/link";
import { getCustomerSession } from "@/app/auth/actions";
import { getCustomerOrders } from "@/lib/orders";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { formatPrice } from "@/lib/products";

export default async function AccountOrdersPage() {
  const session = await getCustomerSession();
  const orders = session ? await getCustomerOrders(session.user.id) : [];

  return (
    <div className="space-y-4">
      {orders.length === 0 ? (
        <p className="text-sm text-[#6b6b6b]">You have no orders yet.</p>
      ) : (
        orders.map((order) => (
          <article
            key={order.id}
            className="flex flex-col gap-3 border border-[#e8e8e8] bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-lg text-[#141414]">
                {order.order_number}
              </h2>
              <p className="text-sm text-[#6b6b6b]">
                {new Date(order.created_at).toLocaleDateString()} ·{" "}
                {ORDER_STATUS_LABELS[order.status]}
              </p>
              <p className="mt-1 font-semibold text-[#141414]">
                {formatPrice(Number(order.total_amount))}
              </p>
            </div>
            <Link
              href={`/account/orders/${encodeURIComponent(order.order_number)}`}
              className="text-xs font-semibold tracking-[0.14em] text-[#bd1115] uppercase hover:underline"
            >
              View order
            </Link>
          </article>
        ))
      )}
    </div>
  );
}
