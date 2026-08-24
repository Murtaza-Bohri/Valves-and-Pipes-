"use server";

import { redirect } from "next/navigation";
import { placeOrder, type ShippingInput } from "@/lib/orders";
import type { CartLine } from "@/lib/products";

export type CheckoutActionState = {
  error?: string;
};

export async function submitCheckout(
  _prev: CheckoutActionState,
  formData: FormData
): Promise<CheckoutActionState> {
  const linesRaw = String(formData.get("lines") ?? "[]");

  let lines: CartLine[] = [];
  try {
    lines = JSON.parse(linesRaw) as CartLine[];
  } catch {
    return { error: "Invalid cart data." };
  }

  const shipping: ShippingInput = {
    fullName: String(formData.get("full_name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    addressLine1: String(formData.get("address_line_1") ?? "").trim(),
    addressLine2: String(formData.get("address_line_2") ?? "").trim() || undefined,
    city: String(formData.get("city") ?? "").trim(),
    state: String(formData.get("state") ?? "").trim() || undefined,
    country: String(formData.get("country") ?? "UAE").trim() || "UAE",
    postalCode: String(formData.get("postal_code") ?? "").trim() || undefined,
  };

  if (!shipping.fullName || !shipping.email || !shipping.addressLine1 || !shipping.city) {
    return { error: "Please complete all required shipping fields." };
  }

  const addressId = String(formData.get("address_id") ?? "").trim() || null;
  const shippingAmount = Number(formData.get("shipping_amount") ?? 0);

  const result = await placeOrder({
    lines,
    shipping,
    addressId,
    shippingAmount: Number.isFinite(shippingAmount) ? shippingAmount : 0,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  redirect(
    `/order-confirmation?order=${encodeURIComponent(result.order.orderNumber)}&total=${result.order.totalAmount}`
  );
}

export async function trackOrderAction(
  _prev: { ok: boolean; error?: string } | null,
  formData: FormData
) {
  const { trackGuestOrder } = await import("@/lib/orders");

  const orderNumber = String(formData.get("order_number") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  return trackGuestOrder(orderNumber, email);
}
