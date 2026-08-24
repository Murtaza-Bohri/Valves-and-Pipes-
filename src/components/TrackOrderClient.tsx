"use client";

import { useActionState } from "react";
import Link from "next/link";
import { trackOrderAction } from "@/app/checkout/actions";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS } from "@/lib/order-status";
import { formatPrice } from "@/lib/products";
import type { DbOrder, DbOrderStatusHistory } from "@/types/database";

type TrackResult = Awaited<ReturnType<typeof trackOrderAction>>;

const initialState: TrackResult | null = null;

export function TrackOrderClient({ initialOrderNumber = "" }: { initialOrderNumber?: string }) {
  const [result, action, pending] = useActionState(trackOrderAction, initialState);

  return (
    <div className="mx-auto max-w-3xl px-6 sm:px-10">
      <form action={action} className="space-y-4 border border-[#e8e8e8] bg-white p-6">
        <Field label="Order ID" name="order_number" defaultValue={initialOrderNumber} />
        <Field label="Email" name="email" type="email" />
        <button
          type="submit"
          disabled={pending}
          className="w-full bg-[#bd1115] px-5 py-3 text-xs font-semibold tracking-[0.14em] text-white uppercase hover:bg-[#9a0e12] disabled:opacity-60"
        >
          {pending ? "Searching..." : "Track order"}
        </button>
      </form>

      {result && !result.ok ? (
        <p className="mt-4 text-sm text-[#bd1115]">{result.error}</p>
      ) : null}

      {result && result.ok ? (
        <div className="mt-8 space-y-6">
          <div className="border border-[#e8e8e8] bg-white p-6">
            <h2 className="font-[family-name:var(--font-display)] text-xl text-[#141414]">
              {result.order.order_number}
            </h2>
            <p className="mt-2 text-sm text-[#6b6b6b]">
              Status: {ORDER_STATUS_LABELS[result.order.status]}
            </p>
            <p className="mt-1 text-sm font-semibold text-[#141414]">
              Total: {formatPrice(Number(result.order.total_amount))}
            </p>
          </div>

          <OrderTimeline currentStatus={result.order.status} history={result.history} />

          <div className="border border-[#e8e8e8] bg-white p-6">
            <h3 className="mb-4 text-xs font-semibold tracking-[0.14em] text-[#141414] uppercase">
              Items
            </h3>
            <div className="space-y-3">
              {result.items.map((item) => (
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
      ) : null}

      <p className="mt-8 text-center text-sm text-[#6b6b6b]">
        Have an account?{" "}
        <Link href="/account/orders" className="text-[#bd1115] hover:underline">
          View my orders
        </Link>
      </p>
    </div>
  );
}

function OrderTimeline({
  currentStatus,
  history,
}: {
  currentStatus: DbOrder["status"];
  history: DbOrderStatusHistory[];
}) {
  const currentIndex = ORDER_STATUS_FLOW.indexOf(currentStatus);

  return (
    <div className="border border-[#e8e8e8] bg-white p-6">
      <h3 className="mb-4 text-xs font-semibold tracking-[0.14em] text-[#141414] uppercase">
        Order progress
      </h3>
      <ol className="space-y-3">
        {ORDER_STATUS_FLOW.filter((status) => status !== "cancelled").map((status, index) => {
          const reached =
            currentStatus === "cancelled"
              ? history.some((entry) => entry.status === status)
              : index <= currentIndex;
          const historyEntry = history.find((entry) => entry.status === status);

          return (
            <li key={status} className="flex items-center gap-3 text-sm">
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  reached ? "bg-[#bd1115] text-white" : "bg-[#e8e8e8] text-[#6b6b6b]"
                }`}
              >
                {reached ? "✓" : "○"}
              </span>
              <span className={reached ? "font-semibold text-[#141414]" : "text-[#6b6b6b]"}>
                {ORDER_STATUS_LABELS[status]}
              </span>
              {historyEntry ? (
                <span className="text-xs text-[#6b6b6b]">
                  {new Date(historyEntry.created_at).toLocaleString()}
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold tracking-[0.14em] text-[#141414] uppercase">
        {label}
      </label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required
        className="w-full border border-[#e0e0e0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#bd1115]"
      />
    </div>
  );
}
