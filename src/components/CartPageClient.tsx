"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { revalidateCartLines } from "@/app/cart/actions";
import {
  getCartSubtotal,
  readGuestCart,
  removeCartLine,
  updateCartLineQuantity,
} from "@/lib/cart";
import { formatPrice, type CartLine } from "@/lib/products";

export function CartPageClient() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const load = () => {
      startTransition(async () => {
        const stored = readGuestCart();
        if (stored.length === 0) {
          setLines([]);
          return;
        }

        const result = await revalidateCartLines(stored);
        if (!result.ok) {
          setError(result.error);
          setLines(stored);
          return;
        }

        setError(null);
        setLines(result.lines);
      });
    };

    load();
    window.addEventListener("himmat:cart-updated", load);
    return () => window.removeEventListener("himmat:cart-updated", load);
  }, []);

  const subtotal = getCartSubtotal(lines);

  const changeQuantity = (
    line: CartLine,
    quantity: number
  ) => {
    const next = updateCartLineQuantity(
      line.productId,
      line.impaId,
      quantity
    );
    setLines(next);
  };

  const removeLine = (line: CartLine) => {
    const next = removeCartLine(line.productId, line.impaId);
    setLines(next);
  };

  if (pending && lines.length === 0) {
    return <p className="text-sm text-[#6b6b6b]">Loading cart...</p>;
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 sm:px-10">
        <p className="text-sm text-[#6b6b6b]">Your cart is empty.</p>
        <Link
          href="/products"
          className="mt-6 inline-flex bg-[#bd1115] px-5 py-2.5 text-xs font-semibold tracking-[0.14em] text-white uppercase hover:bg-[#9a0e12]"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 sm:px-10">
      {error ? (
        <p className="mb-4 text-sm text-[#bd1115]">{error}</p>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
        {lines.map((line) => (
          <article
            key={`${line.productId}:${line.impaId ?? "direct"}`}
            className="grid gap-4 border border-[#e8e8e8] bg-white p-4 sm:grid-cols-[96px_1fr_auto]"
          >
            <div className="relative h-24 w-24 overflow-hidden border border-[#e8e8e8] bg-[#f7f7f7]">
              <Image
                src={line.imageUrl}
                alt={line.productName}
                fill
                className="object-contain p-2"
              />
            </div>

            <div>
              <h2 className="font-[family-name:var(--font-display)] text-lg text-[#141414]">
                {line.productName}
              </h2>
              {line.impaNumber ? (
                <div className="mt-2 space-y-1 text-sm text-[#6b6b6b]">
                  <p>
                    <span className="font-semibold text-[#141414]">
                      IMPA No:
                    </span>{" "}
                    {line.impaNumber}
                  </p>
                  {line.inventoryUom ? (
                    <p>
                      <span className="font-semibold text-[#141414]">UoM:</span>{" "}
                      {line.inventoryUom}
                    </p>
                  ) : null}
                </div>
              ) : null}
              <p className="mt-2 font-semibold text-[#141414]">
                {formatPrice(line.price)}
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 sm:items-end">
              <div className="inline-flex items-center border border-[#e0e0e0]">
                <button
                  type="button"
                  onClick={() =>
                    changeQuantity(line, Math.max(1, line.quantity - 1))
                  }
                  className="px-3 py-2 text-[#141414] hover:bg-[#f7f7f7]"
                >
                  -
                </button>
                <span className="min-w-10 px-3 py-2 text-center text-sm">
                  {line.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => changeQuantity(line, line.quantity + 1)}
                  className="px-3 py-2 text-[#141414] hover:bg-[#f7f7f7]"
                >
                  +
                </button>
              </div>
              <p className="text-sm font-semibold text-[#141414]">
                Subtotal: {formatPrice(line.price * line.quantity)}
              </p>
              <button
                type="button"
                onClick={() => removeLine(line)}
                className="text-xs font-semibold tracking-[0.14em] text-[#bd1115] uppercase hover:underline"
              >
                Remove
              </button>
            </div>
          </article>
        ))}
        </div>

        <aside className="h-fit border border-[#e8e8e8] bg-white p-6">
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl text-[#141414]">
            Order summary
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#6b6b6b]">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-[#141414]">
              <span>Total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
          </div>
          <Link
            href="/checkout"
            className="mt-6 block bg-[#bd1115] px-5 py-3 text-center text-xs font-semibold tracking-[0.14em] text-white uppercase hover:bg-[#9a0e12]"
          >
            Proceed to checkout
          </Link>
        </aside>
      </div>
    </div>
  );
}
