"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { submitCheckout, type CheckoutActionState } from "@/app/checkout/actions";
import { revalidateCartLines } from "@/app/cart/actions";
import {
  getCartSubtotal,
  readGuestCart,
} from "@/lib/cart";
import { formatPrice, type CartLine } from "@/lib/products";
import type { DbAddress } from "@/types/database";

const initialState: CheckoutActionState = {};

type CheckoutClientProps = {
  isLoggedIn: boolean;
  customerEmail?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  addresses: DbAddress[];
  shippingAmount?: number;
};

export function CheckoutClient({
  isLoggedIn,
  customerEmail,
  customerName,
  customerPhone,
  addresses,
  shippingAmount = 0,
}: CheckoutClientProps) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [mode, setMode] = useState<"guest" | "account">(isLoggedIn ? "account" : "guest");
  const [selectedAddressId, setSelectedAddressId] = useState(
    addresses.find((address) => address.is_default)?.id ?? addresses[0]?.id ?? ""
  );
  const [state, action, pending] = useActionState(submitCheckout, initialState);
  const [loading, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const stored = readGuestCart();
      if (!stored.length) {
        setLines([]);
        return;
      }
      const result = await revalidateCartLines(stored);
      setLines(result.ok ? result.lines : stored);
    });
  }, []);

  useEffect(() => {
    const url = state.paymentRedirectUrl?.trim();
    if (url) {
      window.location.assign(url);
    }
  }, [state.paymentRedirectUrl]);

  const subtotal = getCartSubtotal(lines);
  const total = subtotal + shippingAmount;
  const defaultAddress = addresses.find((address) => address.id === selectedAddressId);

  if (loading && !lines.length) {
    return <p className="text-sm text-[#6b6b6b]">Loading checkout...</p>;
  }

  if (!lines.length) {
    return (
      <div className="mx-auto max-w-3xl px-6 sm:px-10">
        <p className="text-sm text-[#6b6b6b]">Your cart is empty.</p>
        <Link href="/products" className="mt-4 inline-flex text-[#bd1115] underline">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-6 sm:px-10 lg:grid-cols-[1fr_360px]">
      <div>
        {!isLoggedIn ? (
          <div className="mb-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setMode("guest")}
              className={`px-4 py-2 text-xs font-semibold tracking-[0.14em] uppercase ${
                mode === "guest"
                  ? "bg-[#bd1115] text-white"
                  : "border border-[#e0e0e0] bg-white text-[#141414]"
              }`}
            >
              Continue as guest
            </button>
            <Link
              href="/login?returnTo=/checkout"
              className="border border-[#141414] px-4 py-2 text-xs font-semibold tracking-[0.14em] text-[#141414] uppercase hover:border-[#bd1115] hover:text-[#bd1115]"
            >
              Login / Signup
            </Link>
          </div>
        ) : null}

        <form action={action} className="space-y-4 border border-[#e8e8e8] bg-white p-6">
          <input type="hidden" name="lines" value={JSON.stringify(lines)} />
          <input type="hidden" name="shipping_amount" value={String(shippingAmount)} />
          {isLoggedIn && selectedAddressId ? (
            <input type="hidden" name="address_id" value={selectedAddressId} />
          ) : null}

          {isLoggedIn && addresses.length > 0 && mode === "account" ? (
            <div>
              <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-[#141414] uppercase">
                Shipping address
              </p>
              <div className="space-y-2">
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    className="flex cursor-pointer gap-3 border border-[#e8e8e8] p-3"
                  >
                    <input
                      type="radio"
                      name="address_selector"
                      checked={selectedAddressId === address.id}
                      onChange={() => setSelectedAddressId(address.id)}
                    />
                    <span className="text-sm text-[#141414]">
                      {address.full_name}, {address.address_line_1}, {address.city},{" "}
                      {address.country}
                    </span>
                  </label>
                ))}
              </div>
              <input type="hidden" name="full_name" value={defaultAddress?.full_name ?? customerName ?? ""} />
              <input type="hidden" name="email" value={customerEmail ?? ""} />
              <input type="hidden" name="phone" value={defaultAddress?.phone ?? customerPhone ?? ""} />
              <input type="hidden" name="address_line_1" value={defaultAddress?.address_line_1 ?? ""} />
              <input type="hidden" name="address_line_2" value={defaultAddress?.address_line_2 ?? ""} />
              <input type="hidden" name="city" value={defaultAddress?.city ?? ""} />
              <input type="hidden" name="state" value={defaultAddress?.state ?? ""} />
              <input type="hidden" name="country" value={defaultAddress?.country ?? "UAE"} />
              <input type="hidden" name="postal_code" value={defaultAddress?.postal_code ?? ""} />
            </div>
          ) : (
            <>
              <CheckoutField label="Full name" name="full_name" defaultValue={customerName ?? ""} />
              <CheckoutField label="Email" name="email" type="email" defaultValue={customerEmail ?? ""} />
              <CheckoutField label="Phone" name="phone" defaultValue={customerPhone ?? ""} />
              <CheckoutField label="Address line 1" name="address_line_1" />
              <CheckoutField label="Address line 2" name="address_line_2" required={false} />
              <div className="grid gap-4 sm:grid-cols-2">
                <CheckoutField label="City" name="city" />
                <CheckoutField label="State / Emirate" name="state" required={false} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <CheckoutField label="Country" name="country" defaultValue="UAE" />
                <CheckoutField label="Postal code" name="postal_code" required={false} />
              </div>
            </>
          )}

          {state.error ? <p className="text-sm text-[#bd1115]">{state.error}</p> : null}
          {state.paymentRedirectUrl ? (
            <p className="text-sm text-[#6b6b6b]">Redirecting to secure payment…</p>
          ) : null}

          <button
            type="submit"
            disabled={pending || Boolean(state.paymentRedirectUrl)}
            className="w-full bg-[#bd1115] px-5 py-3 text-xs font-semibold tracking-[0.14em] text-white uppercase hover:bg-[#9a0e12] disabled:opacity-60"
          >
            {pending || state.paymentRedirectUrl
              ? "Placing order..."
              : "Place order"}
          </button>
        </form>
      </div>

      <aside className="h-fit border border-[#e8e8e8] bg-white p-6">
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl text-[#141414]">
          Order summary
        </h2>
        <div className="space-y-3 text-sm">
          {lines.map((line) => (
            <div key={`${line.productId}:${line.impaId ?? "direct"}`} className="flex justify-between gap-4">
              <span className="text-[#6b6b6b]">
                {line.productName}
                {line.impaNumber ? ` (${line.impaNumber})` : ""} × {line.quantity}
              </span>
              <span className="font-semibold text-[#141414]">
                {formatPrice(line.price * line.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-6 space-y-2 border-t border-[#e8e8e8] pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-[#6b6b6b]">Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6b6b6b]">Shipping</span>
            <span>{shippingAmount > 0 ? formatPrice(shippingAmount) : "Free"}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-[#141414]">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

function CheckoutField({
  label,
  name,
  type = "text",
  defaultValue,
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
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
        required={required}
        className="w-full border border-[#e0e0e0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#bd1115]"
      />
    </div>
  );
}
