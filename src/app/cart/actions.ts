"use server";

import { resolveCartPrice } from "@/lib/pricing";
import type { CartLine } from "@/lib/products";

export type CartActionResult =
  | { ok: true; line: CartLine }
  | { ok: false; error: string };

export async function validateCartLine(input: {
  productId: string;
  impaId?: string | null;
  quantity: number;
}): Promise<CartActionResult> {
  const quantity = Math.max(1, Math.floor(input.quantity));

  if (!input.productId) {
    return { ok: false, error: "Product is required." };
  }

  const resolved = await resolveCartPrice(input.productId, input.impaId ?? null);

  if ("error" in resolved) {
    return { ok: false, error: resolved.error };
  }

  return {
    ok: true,
    line: {
      productId: resolved.productId,
      productName: resolved.productName,
      imageUrl: resolved.imageUrl,
      quantity,
      price: resolved.price,
      impaId: resolved.impaId,
      impaNumber: resolved.impaNumber,
      inventoryUom: resolved.inventoryUom,
      itemDescription: resolved.itemDescription,
    },
  };
}

export async function revalidateCartLines(
  lines: CartLine[]
): Promise<{ ok: true; lines: CartLine[] } | { ok: false; error: string }> {
  const next: CartLine[] = [];

  for (const line of lines) {
    const resolved = await resolveCartPrice(
      line.productId,
      line.impaId ?? null
    );

    if ("error" in resolved) {
      return { ok: false, error: resolved.error };
    }

    next.push({
      ...line,
      productName: resolved.productName,
      imageUrl: resolved.imageUrl,
      price: resolved.price,
      impaNumber: resolved.impaNumber,
      inventoryUom: resolved.inventoryUom,
      itemDescription: resolved.itemDescription,
    });
  }

  return { ok: true, lines: next };
}
