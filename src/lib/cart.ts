import type { CartLine } from "@/lib/products";

export const CART_STORAGE_KEY = "himmat-cart";

export function readGuestCart(): CartLine[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeGuestCart(lines: CartLine[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  window.dispatchEvent(new CustomEvent("himmat:cart-updated"));
}

export function getCartLineKey(line: Pick<CartLine, "productId" | "impaId">) {
  return `${line.productId}:${line.impaId ?? "direct"}`;
}

export function upsertCartLine(line: CartLine) {
  const cart = readGuestCart();
  const key = getCartLineKey(line);
  const index = cart.findIndex((item) => getCartLineKey(item) === key);

  if (index >= 0) {
    cart[index] = {
      ...cart[index],
      ...line,
      quantity: cart[index].quantity + line.quantity,
    };
  } else {
    cart.push(line);
  }

  writeGuestCart(cart);
  return cart;
}

export function updateCartLineQuantity(
  productId: string,
  impaId: string | null | undefined,
  quantity: number
) {
  const cart = readGuestCart();
  const key = getCartLineKey({ productId, impaId });
  const next = cart
    .map((line) =>
      getCartLineKey(line) === key ? { ...line, quantity } : line
    )
    .filter((line) => line.quantity > 0);

  writeGuestCart(next);
  return next;
}

export function removeCartLine(
  productId: string,
  impaId: string | null | undefined
) {
  const cart = readGuestCart();
  const key = getCartLineKey({ productId, impaId });
  const next = cart.filter((line) => getCartLineKey(line) !== key);
  writeGuestCart(next);
  return next;
}

export function getCartCount(lines: CartLine[] = readGuestCart()) {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

export function getCartSubtotal(lines: CartLine[] = readGuestCart()) {
  return lines.reduce((total, line) => total + line.price * line.quantity, 0);
}
