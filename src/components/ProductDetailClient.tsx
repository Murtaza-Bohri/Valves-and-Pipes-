"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { validateCartLine } from "@/app/cart/actions";
import { upsertCartLine } from "@/lib/cart";
import { formatPrice, type Product } from "@/lib/products";

type ProductDetailClientProps = {
  product: Product;
};

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const hasImpa = Boolean(product.hasImpa);
  const impaEntries = product.impaEntries ?? [];
  const defaultImpaId =
    impaEntries.find((entry) => entry.isDefault)?.id ?? impaEntries[0]?.id ?? "";

  const [selectedImpaId, setSelectedImpaId] = useState(defaultImpaId);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedImpa = impaEntries.find((entry) => entry.id === selectedImpaId);
  const activePrice = hasImpa ? selectedImpa?.price : product.price;
  const canPurchase = hasImpa ? Boolean(selectedImpa) : activePrice != null;

  const addToCart = () => {
    if (!product.id || !canPurchase) return;

    setMessage(null);
    startTransition(async () => {
      const result = await validateCartLine({
        productId: product.id!,
        impaId: hasImpa ? selectedImpaId : null,
        quantity,
      });

      if (!result.ok) {
        setMessage(result.error);
        return;
      }

      upsertCartLine(result.line);
      setMessage("Added to cart.");
    });
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 sm:px-10 lg:grid-cols-2">
      <div className="relative aspect-square overflow-hidden border border-[#e8e8e8] bg-white">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-contain p-6"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold tracking-[0.28em] text-[#bd1115] uppercase">
          {product.category}
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[#141414] sm:text-4xl">
          {product.name}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[#6b6b6b]">
          {product.description}
        </p>

        {hasImpa ? (
          <div className="mt-8">
            <h2 className="mb-4 text-xs font-semibold tracking-[0.18em] text-[#141414] uppercase">
              IMPA options
            </h2>
            {impaEntries.length === 0 ? (
              <p className="text-sm text-[#bd1115]">
                IMPA options are not available yet for this product.
              </p>
            ) : (
              <div className="overflow-x-auto border border-[#e8e8e8] bg-white">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#f7f7f7] text-xs tracking-[0.12em] text-[#6b6b6b] uppercase">
                    <tr>
                      <th className="px-4 py-3">Select</th>
                      <th className="px-4 py-3">IMPA No.</th>
                      <th className="px-4 py-3">UoM</th>
                      <th className="px-4 py-3">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {impaEntries.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-t border-[#e8e8e8]"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="radio"
                            name="impa"
                            checked={selectedImpaId === entry.id}
                            onChange={() => setSelectedImpaId(entry.id)}
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-[#141414]">
                          {entry.impaNumber}
                        </td>
                        <td className="px-4 py-3 text-[#6b6b6b]">
                          {entry.uom}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#141414]">
                          {formatPrice(entry.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedImpa ? (
              <div className="mt-4 space-y-1 text-sm text-[#141414]">
                <p>
                  <span className="font-semibold">Selected IMPA:</span>{" "}
                  {selectedImpa.impaNumber}
                </p>
                <p>
                  <span className="font-semibold">Price:</span>{" "}
                  {formatPrice(selectedImpa.price)}
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-8 text-2xl font-semibold text-[#141414]">
            {activePrice != null ? formatPrice(activePrice) : "Price on request"}
          </p>
        )}

        <div className="mt-8 flex items-center gap-4">
          <span className="text-sm font-semibold text-[#141414]">Quantity</span>
          <div className="inline-flex items-center border border-[#e0e0e0]">
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              className="px-3 py-2 text-[#141414] hover:bg-[#f7f7f7]"
            >
              -
            </button>
            <span className="min-w-10 px-3 py-2 text-center text-sm">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((value) => value + 1)}
              className="px-3 py-2 text-[#141414] hover:bg-[#f7f7f7]"
            >
              +
            </button>
          </div>
        </div>

        {message ? (
          <p
            className={`mt-4 text-sm ${
              message === "Added to cart." ? "text-green-700" : "text-[#bd1115]"
            }`}
          >
            {message}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={addToCart}
            disabled={!canPurchase || pending}
            className="bg-[#bd1115] px-6 py-3 text-xs font-semibold tracking-[0.14em] text-white uppercase hover:bg-[#9a0e12] disabled:opacity-60"
          >
            {pending ? "Adding..." : "Add to cart"}
          </button>
          <Link
            href="/cart"
            className="border border-[#141414] px-6 py-3 text-xs font-semibold tracking-[0.14em] text-[#141414] uppercase hover:border-[#bd1115] hover:text-[#bd1115]"
          >
            View cart
          </Link>
        </div>
      </div>
    </div>
  );
}
