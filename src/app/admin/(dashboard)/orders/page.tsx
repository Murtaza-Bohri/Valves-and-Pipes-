import { AdminOrdersList } from "@/components/admin/AdminOrdersList";
import { getAdminOrders } from "@/lib/orders";

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold tracking-[0.22em] text-[#bd1115] uppercase">
          Orders
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#141414]">
          Order management
        </h1>
      </div>
      <AdminOrdersList orders={orders} />
    </div>
  );
}
