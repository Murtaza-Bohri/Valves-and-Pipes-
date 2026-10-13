import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { ZiinaPaymentIntent, ZiinaPaymentIntentStatus } from "@/lib/ziina";
import type { DbOrder, OrderStatus, PaymentStatus } from "@/types/database";

export async function attachZiinaPaymentIntentToOrder(
  orderId: string,
  paymentIntentId: string
) {
  const service = createSupabaseServiceClient();
  await service
    .from("orders")
    .update({
      ziina_payment_intent_id: paymentIntentId,
      payment_status: "unpaid",
    })
    .eq("id", orderId);
}

export async function getOrderByOrderNumber(orderNumber: string) {
  const service = createSupabaseServiceClient();
  const normalized = orderNumber.trim().toUpperCase();
  const { data } = await service
    .from("orders")
    .select("*")
    .eq("order_number", normalized)
    .maybeSingle();

  return (data as DbOrder | null) ?? null;
}

export async function syncOrderFromZiinaIntent(intent: ZiinaPaymentIntent) {
  const service = createSupabaseServiceClient();

  let order: DbOrder | null = null;

  const { data: byIntent } = await service
    .from("orders")
    .select("*")
    .eq("ziina_payment_intent_id", intent.id)
    .maybeSingle();

  order = (byIntent as DbOrder | null) ?? null;

  if (!order && intent.operation_id) {
    const { data: byOperation } = await service
      .from("orders")
      .select("*")
      .eq("id", intent.operation_id)
      .maybeSingle();
    order = (byOperation as DbOrder | null) ?? null;
  }

  if (!order) {
    return { ok: false as const, error: "Order not found for payment intent." };
  }

  const paymentStatus = mapZiinaStatusToPaymentStatus(intent.status);
  const updates: Partial<DbOrder> & { paid_at?: string | null } = {
    ziina_payment_intent_id: intent.id,
    payment_status: paymentStatus,
  };

  if (paymentStatus === "paid") {
    updates.paid_at = new Date().toISOString();
  }

  let nextOrderStatus: OrderStatus | null = null;
  if (paymentStatus === "paid" && order.status === "pending") {
    nextOrderStatus = "confirmed";
    updates.status = "confirmed";
  } else if (
    (paymentStatus === "cancelled" || paymentStatus === "failed") &&
    order.status === "pending"
  ) {
    nextOrderStatus = "cancelled";
    updates.status = "cancelled";
  }

  const { error } = await service.from("orders").update(updates).eq("id", order.id);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  if (nextOrderStatus) {
    const note =
      paymentStatus === "paid"
        ? "Payment received via Ziina."
        : paymentStatus === "cancelled"
          ? "Payment cancelled on Ziina checkout."
          : "Payment failed on Ziina.";

    await service.from("order_status_history").insert({
      order_id: order.id,
      status: nextOrderStatus,
      note,
    });
  }

  const refreshed = await getOrderByOrderNumber(order.order_number);
  return { ok: true as const, order: refreshed ?? order };
}

function mapZiinaStatusToPaymentStatus(
  status: ZiinaPaymentIntentStatus
): PaymentStatus {
  switch (status) {
    case "completed":
      return "paid";
    case "failed":
      return "failed";
    case "canceled":
      return "cancelled";
    default:
      return "unpaid";
  }
}
