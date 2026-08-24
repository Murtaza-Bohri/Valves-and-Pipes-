import { AdminCustomersList } from "@/components/admin/AdminOrdersList";
import { getAdminCustomers } from "@/lib/orders";

export default async function AdminCustomersPage() {
  const customers = await getAdminCustomers();

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold tracking-[0.22em] text-[#bd1115] uppercase">
          Customers
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#141414]">
          Customer management
        </h1>
      </div>
      <AdminCustomersList customers={customers} />
    </div>
  );
}
