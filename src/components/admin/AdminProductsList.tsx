"use client";

import { useActionState, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import {
  deleteProduct,
  updateProduct,
  type AdminActionState,
} from "@/app/admin/actions";
import { ImpaManager, ProductForm } from "@/components/admin/AdminProductForm";
import type { DbCategory, DbProduct } from "@/types/database";

const initialState: AdminActionState = {};

type AdminProductsListProps = {
  products: DbProduct[];
  categories: DbCategory[];
};

export function AdminProductsList({
  products,
  categories,
}: AdminProductsListProps) {
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) =>
      product.name.toLowerCase().includes(term)
    );
  }, [products, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border border-[#e8e8e8] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6b6b6b]" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by product name..."
            className="w-full border border-[#e0e0e0] bg-white py-2.5 pr-3 pl-10 text-sm outline-none focus:border-[#bd1115]"
          />
        </div>
        <div className="flex items-center gap-4 text-sm text-[#6b6b6b]">
          <span>
            {filtered.length} of {products.length} product
            {products.length === 1 ? "" : "s"}
          </span>
          <Link
            href="/admin/products/new"
            className="bg-[#bd1115] px-4 py-2 text-xs font-semibold tracking-[0.14em] text-white uppercase hover:bg-[#9a0e12]"
          >
            Add product
          </Link>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="border border-[#e8e8e8] bg-white p-6 text-sm text-[#6b6b6b]">
          No products yet.{" "}
          <Link href="/admin/products/new" className="font-semibold text-[#bd1115] underline">
            Add your first product
          </Link>
          .
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-[#e8e8e8] bg-white p-6 text-sm text-[#6b6b6b]">
          No products match &quot;{query.trim()}&quot;.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              categories={categories}
              expanded={expandedId === product.id}
              onToggle={() =>
                setExpandedId((current) =>
                  current === product.id ? null : product.id
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductRow({
  product,
  categories,
  expanded,
  onToggle,
}: {
  product: DbProduct;
  categories: DbCategory[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const pricingLabel = product.has_impa
    ? `IMPA (${product.product_impa?.length ?? 0} entries)`
    : product.price != null
      ? `AED ${Number(product.price).toFixed(2)}`
      : "Price not set";

  return (
    <article className="border border-[#e8e8e8] bg-white">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden border border-[#e8e8e8] bg-[#f7f7f7]">
            <Image
              src={product.main_image}
              alt={product.name}
              fill
              className="object-contain p-2"
            />
          </div>
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-lg text-[#141414]">
              {product.name}
            </h3>
            <p className="text-xs tracking-[0.12em] text-[#bd1115] uppercase">
              {product.categories?.name ?? "Uncategorized"}
            </p>
            <p className="mt-1 text-sm text-[#6b6b6b]">{pricingLabel}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="self-start border border-[#141414] px-4 py-2 text-xs font-semibold tracking-[0.14em] text-[#141414] uppercase hover:border-[#bd1115] hover:text-[#bd1115] sm:self-center"
        >
          {expanded ? "Close" : "Edit"}
        </button>
      </div>

      {expanded ? (
        <ProductEditor product={product} categories={categories} />
      ) : null}
    </article>
  );
}

function ProductEditor({
  product,
  categories,
}: {
  product: DbProduct;
  categories: DbCategory[];
}) {
  const [state, action, pending] = useActionState(updateProduct, initialState);
  const [hasImpa, setHasImpa] = useState(product.has_impa);

  return (
    <div className="border-t border-[#e8e8e8] bg-[#f7f7f7] p-5">
      <ProductForm
        action={action}
        pending={pending}
        state={state}
        product={product}
        categories={categories}
        submitLabel="Save changes"
        hasImpa={hasImpa}
        onHasImpaChange={setHasImpa}
      />

      <ImpaManager product={product} hasImpa={hasImpa} />

      <form action={deleteProduct} className="mt-4">
        <input type="hidden" name="id" value={product.id} />
        <button
          type="submit"
          className="text-xs font-semibold tracking-[0.14em] text-[#bd1115] uppercase hover:underline"
        >
          Delete product
        </button>
      </form>
    </div>
  );
}
