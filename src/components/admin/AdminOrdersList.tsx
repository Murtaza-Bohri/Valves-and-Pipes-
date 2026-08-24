"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import {
  updateCustomerActive,
  updateOrderStatus,
  type AdminActionState,
} from "@/app/admin/actions";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { formatPrice } from "@/lib/products";
import type {
  DbOrder,
  DbOrderItem,
  DbOrderStatusHistory,
  DbProfile,
  OrderStatus,
} from "@/types/database";

const initialState: AdminActionState = {};

export function AdminOrdersList({
  orders,
}: {
  orders: Pick<
    DbOrder,
    | "id"
    | "order_number"
    | "status"
    | "total_amount"
    | "created_at"
    | "customer_name"
    | "customer_email"
    | "user_id"
  >[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<OrderStatus | "all">("all");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = status === "all" || order.status === status;
      const matchesSearch =
        !term ||
        order.order_number.toLowerCase().includes(term) ||
        (order.customer_name ?? "").toLowerCase().includes(term) ||
        (order.customer_email ?? "").toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [orders, query, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 border border-[#e8e8e8] bg-white p-4 lg:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6b6b6b]" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search order ID, customer, email..."
            className="w-full border border-[#e0e0e0] py-2.5 pr-3 pl-10 text-sm outline-none focus:border-[#bd1115]"
          />
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as OrderStatus | "all")}
          className="border border-[#e0e0e0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#bd1115]"
        >
          <option value="all">All statuses</option>
          {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((value) => (
            <option key={value} value={value}>
              {ORDER_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto border border-[#e8e8e8] bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#f7f7f7] text-xs tracking-[0.12em] text-[#6b6b6b] uppercase">
            <tr>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr key={order.id} className="border-t border-[#e8e8e8]">
                <td className="px-4 py-3 font-medium">{order.order_number}</td>
                <td className="px-4 py-3">
                  <p>{order.customer_name ?? (order.user_id ? "Registered" : "Guest")}</p>
                  <p className="text-xs text-[#6b6b6b]">{order.customer_email}</p>
                </td>
                <td className="px-4 py-3">{formatPrice(Number(order.total_amount))}</td>
                <td className="px-4 py-3">{ORDER_STATUS_LABELS[order.status]}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="text-xs font-semibold tracking-[0.14em] text-[#bd1115] uppercase hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminOrderDetail({
  order,
  items,
  history,
}: {
  order: DbOrder;
  items: DbOrderItem[];
  history: DbOrderStatusHistory[];
}) {
  const [state, action, pending] = useActionState(updateOrderStatus, initialState);

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="text-sm text-[#bd1115] hover:underline">
        ← Back to orders
      </Link>

      <section className="border border-[#e8e8e8] bg-white p-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[#141414]">
          {order.order_number}
        </h2>
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="font-semibold">Customer:</span> {order.customer_name ?? "—"}
          </p>
          <p>
            <span className="font-semibold">Email:</span> {order.customer_email ?? "—"}
          </p>
          <p>
            <span className="font-semibold">Phone:</span> {order.customer_phone ?? "—"}
          </p>
          <p>
            <span className="font-semibold">Type:</span>{" "}
            {order.user_id ? "Registered" : "Guest"}
          </p>
          <p>
            <span className="font-semibold">Date:</span>{" "}
            {new Date(order.created_at).toLocaleString()}
          </p>
          <p>
            <span className="font-semibold">Total:</span>{" "}
            {formatPrice(Number(order.total_amount))}
          </p>
        </div>
        <p className="mt-4 text-sm text-[#6b6b6b]">
          {order.shipping_address_line_1}, {order.shipping_city},{" "}
          {order.shipping_country}
        </p>
      </section>

      <section className="border border-[#e8e8e8] bg-white p-6">
        <h3 className="mb-4 text-xs font-semibold tracking-[0.14em] uppercase">Items</h3>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between gap-4 text-sm">
              <span>
                {item.product_name}
                {item.impa_number ? ` · IMPA ${item.impa_number}` : ""} × {item.quantity}
              </span>
              <span className="font-semibold">
                {formatPrice(Number(item.price_at_purchase) * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="border border-[#e8e8e8] bg-white p-6">
        <form action={action} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <input type="hidden" name="order_id" value={order.id} />
          <div className="flex-1">
            <label className="mb-2 block text-xs font-semibold tracking-[0.14em] uppercase">
              Update status
            </label>
            <select
              name="status"
              defaultValue={order.status}
              className="w-full border border-[#e0e0e0] px-3 py-2.5 text-sm outline-none focus:border-[#bd1115]"
            >
              {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((value) => (
                <option key={value} value={value}>
                  {ORDER_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          <input
            name="note"
            placeholder="Optional note"
            className="flex-1 border border-[#e0e0e0] px-3 py-2.5 text-sm outline-none focus:border-[#bd1115]"
          />
          <button
            type="submit"
            disabled={pending}
            className="bg-[#bd1115] px-5 py-2.5 text-xs font-semibold tracking-[0.14em] text-white uppercase hover:bg-[#9a0e12] disabled:opacity-60"
          >
            {pending ? "Saving..." : "Update status"}
          </button>
        </form>
        {state.error ? <p className="mt-3 text-sm text-[#bd1115]">{state.error}</p> : null}
        {state.success ? <p className="mt-3 text-sm text-green-700">{state.success}</p> : null}
      </section>

      <section className="border border-[#e8e8e8] bg-white p-6">
        <h3 className="mb-4 text-xs font-semibold tracking-[0.14em] uppercase">
          Status history
        </h3>
        <div className="space-y-2 text-sm">
          {history.map((entry) => (
            <p key={entry.id}>
              {ORDER_STATUS_LABELS[entry.status]} ·{" "}
              {new Date(entry.created_at).toLocaleString()}
              {entry.note ? ` · ${entry.note}` : ""}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}

export function AdminCustomersList({
  customers,
}: {
  customers: Array<
    Pick<DbProfile, "id" | "user_id" | "full_name" | "phone" | "is_active" | "created_at"> & {
      orderCount: number;
    }
  >;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter(
      (customer) =>
        (customer.full_name ?? "").toLowerCase().includes(term) ||
        (customer.phone ?? "").toLowerCase().includes(term)
    );
  }, [customers, query]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-md border border-[#e8e8e8] bg-white p-4">
        <Search className="pointer-events-none absolute top-1/2 left-7 h-4 w-4 -translate-y-1/2 text-[#6b6b6b]" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name or phone..."
          className="w-full border border-[#e0e0e0] py-2.5 pr-3 pl-10 text-sm outline-none focus:border-[#bd1115]"
        />
      </div>

      <div className="overflow-x-auto border border-[#e8e8e8] bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#f7f7f7] text-xs tracking-[0.12em] uppercase text-[#6b6b6b]">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((customer) => (
              <CustomerRow key={customer.id} customer={customer} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CustomerRow({
  customer,
}: {
  customer: Pick<DbProfile, "id" | "user_id" | "full_name" | "phone" | "is_active"> & {
    orderCount: number;
  };
}) {
  const [state, action, pending] = useActionState(updateCustomerActive, initialState);

  return (
    <tr className="border-t border-[#e8e8e8]">
      <td className="px-4 py-3">{customer.full_name ?? "—"}</td>
      <td className="px-4 py-3">{customer.phone ?? "—"}</td>
      <td className="px-4 py-3">{customer.orderCount}</td>
      <td className="px-4 py-3">
        {customer.is_active === false ? "Inactive" : "Active"}
      </td>
      <td className="px-4 py-3">
        <form action={action}>
          <input type="hidden" name="profile_id" value={customer.id} />
          <input
            type="hidden"
            name="is_active"
            value={customer.is_active === false ? "yes" : "no"}
          />
          <button
            type="submit"
            disabled={pending}
            className="text-xs font-semibold tracking-[0.14em] text-[#bd1115] uppercase hover:underline disabled:opacity-60"
          >
            {customer.is_active === false ? "Activate" : "Deactivate"}
          </button>
        </form>
        {state.error ? <p className="text-xs text-[#bd1115]">{state.error}</p> : null}
      </td>
    </tr>
  );
}
