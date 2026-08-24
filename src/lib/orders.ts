import type { CartLine } from "@/lib/products";
import { resolveCartPrice } from "@/lib/pricing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type {
  DbAddress,
  DbOrder,
  DbOrderItem,
  DbOrderStatusHistory,
  DbProfile,
  OrderStatus,
} from "@/types/database";

export { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS } from "@/lib/order-status";

export type ShippingInput = {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
};

export type PlaceOrderInput = {
  lines: CartLine[];
  shipping: ShippingInput;
  shippingAmount?: number;
  addressId?: string | null;
};

export type PlacedOrder = {
  orderNumber: string;
  totalAmount: number;
};

export async function validateCartLinesForCheckout(lines: CartLine[]) {
  if (!lines.length) {
    return { ok: false as const, error: "Your cart is empty." };
  }

  const validated: CartLine[] = [];

  for (const line of lines) {
    const resolved = await resolveCartPrice(
      line.productId,
      line.impaId ?? null
    );

    if ("error" in resolved) {
      return { ok: false as const, error: resolved.error };
    }

    validated.push({
      ...line,
      productName: resolved.productName,
      imageUrl: resolved.imageUrl,
      price: resolved.price,
      impaId: resolved.impaId,
      impaNumber: resolved.impaNumber,
      inventoryUom: resolved.inventoryUom,
      itemDescription: resolved.itemDescription,
    });
  }

  return { ok: true as const, lines: validated };
}

export async function placeOrder(input: PlaceOrderInput): Promise<
  | { ok: true; order: PlacedOrder }
  | { ok: false; error: string }
> {
  const validation = await validateCartLinesForCheckout(input.lines);
  if (!validation.ok) {
    return validation;
  }

  const lines = validation.lines;
  const subtotal = lines.reduce(
    (total, line) => total + line.price * line.quantity,
    0
  );
  const shippingAmount = input.shippingAmount ?? 0;
  const taxAmount = 0;
  const discountAmount = 0;
  const totalAmount = subtotal + shippingAmount + taxAmount - discountAmount;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let shippingAddressId: string | null = input.addressId ?? null;
  let customerName = input.shipping.fullName;
  let customerEmail = input.shipping.email.trim().toLowerCase();
  let customerPhone = input.shipping.phone;
  let guestShipping = input.shipping;

  if (user) {
    customerEmail = user.email ?? customerEmail;

    if (shippingAddressId) {
      const { data: address } = await supabase
        .from("addresses")
        .select("*")
        .eq("id", shippingAddressId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!address) {
        return { ok: false, error: "Selected address was not found." };
      }

      const typedAddress = address as DbAddress;
      customerName = typedAddress.full_name;
      customerPhone = typedAddress.phone ?? customerPhone;
      guestShipping = {
        fullName: typedAddress.full_name,
        email: customerEmail,
        phone: typedAddress.phone ?? "",
        addressLine1: typedAddress.address_line_1,
        addressLine2: typedAddress.address_line_2 ?? undefined,
        city: typedAddress.city,
        state: typedAddress.state ?? undefined,
        country: typedAddress.country,
        postalCode: typedAddress.postal_code ?? undefined,
      };
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone, is_active")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile && profile.is_active === false) {
        return { ok: false, error: "This account has been deactivated." };
      }

      if (profile?.full_name) {
        customerName = profile.full_name;
      }
      if (profile?.phone) {
        customerPhone = profile.phone;
      }
    }
  } else if (!customerEmail) {
    return { ok: false, error: "Email is required for guest checkout." };
  }

  const service = createSupabaseServiceClient();

  const orderPayload = {
    user_id: user?.id ?? null,
    status: "pending" as OrderStatus,
    subtotal,
    shipping_amount: shippingAmount,
    tax_amount: taxAmount,
    discount_amount: discountAmount,
    total_amount: totalAmount,
    shipping_address_id: user ? shippingAddressId : null,
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone || null,
    shipping_address_line_1: guestShipping.addressLine1,
    shipping_address_line_2: guestShipping.addressLine2 ?? null,
    shipping_city: guestShipping.city,
    shipping_state: guestShipping.state ?? null,
    shipping_country: guestShipping.country || "UAE",
    shipping_postal_code: guestShipping.postalCode ?? null,
  };

  const { data: order, error: orderError } = await service
    .from("orders")
    .insert(orderPayload)
    .select("id, order_number, total_amount")
    .single();

  if (orderError || !order) {
    return { ok: false, error: orderError?.message ?? "Could not create order." };
  }

  const orderItems = lines.map((line) => ({
    order_id: order.id,
    product_id: line.productId,
    impa_id: line.impaId ?? null,
    product_name: line.productName,
    impa_number: line.impaNumber ?? null,
    item_description: line.itemDescription ?? null,
    inventory_uom: line.inventoryUom ?? null,
    price_at_purchase: line.price,
    quantity: line.quantity,
    image_url: line.imageUrl,
  }));

  const { error: itemsError } = await service.from("order_items").insert(orderItems);

  if (itemsError) {
    await service.from("orders").delete().eq("id", order.id);
    return { ok: false, error: itemsError.message };
  }

  return {
    ok: true,
    order: {
      orderNumber: order.order_number,
      totalAmount: Number(order.total_amount),
    },
  };
}

export async function trackGuestOrder(orderNumber: string, email: string) {
  const normalizedNumber = orderNumber.trim().toUpperCase();
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedNumber || !normalizedEmail) {
    return { ok: false as const, error: "Order ID and email are required." };
  }

  const service = createSupabaseServiceClient();
  const { data: order, error } = await service
    .from("orders")
    .select(
      "id, order_number, status, subtotal, shipping_amount, tax_amount, discount_amount, total_amount, customer_name, customer_email, created_at, shipping_address_line_1, shipping_address_line_2, shipping_city, shipping_state, shipping_country, shipping_postal_code"
    )
    .eq("order_number", normalizedNumber)
    .maybeSingle();

  if (error || !order) {
    return { ok: false as const, error: "Order not found." };
  }

  const typedOrder = order as DbOrder;

  if ((typedOrder.customer_email ?? "").toLowerCase() !== normalizedEmail) {
    return { ok: false as const, error: "Order not found." };
  }

  const { data: items } = await service
    .from("order_items")
    .select("*")
    .eq("order_id", typedOrder.id);

  const { data: history } = await service
    .from("order_status_history")
    .select("*")
    .eq("order_id", typedOrder.id)
    .order("created_at", { ascending: true });

  return {
    ok: true as const,
    order: typedOrder,
    items: (items ?? []) as DbOrderItem[],
    history: (history ?? []) as DbOrderStatusHistory[],
  };
}

export async function getCustomerOrders(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, status, total_amount, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as Pick<
    DbOrder,
    "id" | "order_number" | "status" | "total_amount" | "created_at"
  >[];
}

export async function getCustomerOrderDetail(userId: string, orderNumber: string) {
  const supabase = await createSupabaseServerClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .eq("order_number", orderNumber.trim().toUpperCase())
    .maybeSingle();

  if (!order) return null;

  const typedOrder = order as DbOrder;

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", typedOrder.id);

  const { data: history } = await supabase
    .from("order_status_history")
    .select("*")
    .eq("order_id", typedOrder.id)
    .order("created_at", { ascending: true });

  return {
    order: typedOrder,
    items: (items ?? []) as DbOrderItem[],
    history: (history ?? []) as DbOrderStatusHistory[],
  };
}

export async function getAdminOrders(search?: string, status?: OrderStatus | "all") {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("orders")
    .select(
      "id, order_number, status, total_amount, created_at, customer_name, customer_email, user_id"
    )
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const rows = data as Pick<
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

  if (!search?.trim()) return rows;

  const term = search.trim().toLowerCase();
  return rows.filter(
    (row) =>
      row.order_number.toLowerCase().includes(term) ||
      (row.customer_name ?? "").toLowerCase().includes(term) ||
      (row.customer_email ?? "").toLowerCase().includes(term)
  );
}

export async function getAdminOrderDetail(orderId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return null;

  const typedOrder = order as DbOrder;

  const [{ data: items }, { data: history }] = await Promise.all([
    supabase.from("order_items").select("*").eq("order_id", orderId),
    supabase
      .from("order_status_history")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true }),
  ]);

  return {
    order: typedOrder,
    items: (items ?? []) as DbOrderItem[],
    history: (history ?? []) as DbOrderStatusHistory[],
  };
}

export async function getAdminCustomers(search?: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, user_id, full_name, phone, is_active, created_at")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const profiles = data as Array<
    Pick<DbProfile, "id" | "user_id" | "full_name" | "phone" | "is_active" | "created_at"> & {
      email?: string;
    }
  >;

  const enriched = await Promise.all(
    profiles.map(async (profile) => {
      const { count } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.user_id);

      return {
        ...profile,
        orderCount: count ?? 0,
      };
    })
  );

  if (!search?.trim()) return enriched;

  const term = search.trim().toLowerCase();
  return enriched.filter(
    (profile) =>
      (profile.full_name ?? "").toLowerCase().includes(term) ||
      (profile.phone ?? "").toLowerCase().includes(term)
  );
}
