"use client";

import { useActionState, useState } from "react";
import {
  createImpaEntry,
  deleteImpaEntry,
  updateImpaEntry,
  type AdminActionState,
} from "@/app/admin/actions";
import {
  DirectPriceField,
  HasImpaSelector,
  ImpaRemovalConfirm,
} from "@/components/admin/HasImpaSelector";
import type { DbCategory, DbProduct, DbProductImpa } from "@/types/database";

const initialState: AdminActionState = {};

export function ProductForm({
  action,
  pending,
  state,
  product,
  categories,
  submitLabel,
  hasImpa: controlledHasImpa,
  onHasImpaChange,
}: {
  action: (payload: FormData) => void;
  pending: boolean;
  state: AdminActionState;
  product?: DbProduct;
  categories: DbCategory[];
  submitLabel: string;
  hasImpa?: boolean;
  onHasImpaChange?: (value: boolean) => void;
}) {
  const [localHasImpa, setLocalHasImpa] = useState(product?.has_impa ?? false);
  const hasImpa = controlledHasImpa ?? localHasImpa;

  const setHasImpa = (value: boolean) => {
    setLocalHasImpa(value);
    onHasImpaChange?.(value);
  };
  const previousHasImpa = product?.has_impa ?? false;
  const switchingOffImpa = previousHasImpa && !hasImpa;

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      {product ? (
        <input
          type="hidden"
          name="previous_has_impa"
          value={previousHasImpa ? "yes" : "no"}
        />
      ) : null}

      <Field label="Product name" name="name" defaultValue={product?.name} />
      <Field label="Slug" name="slug" defaultValue={product?.slug} />

      <div>
        <label className="mb-2 block text-xs font-semibold tracking-[0.14em] text-[#141414] uppercase">
          Category
        </label>
        <select
          name="category_id"
          defaultValue={product?.category_id ?? categories[0]?.id}
          required
          className="w-full border border-[#e0e0e0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#bd1115]"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <Field
        label="Sort order"
        name="sort_order"
        type="number"
        defaultValue={String(product?.sort_order ?? 0)}
      />

      <div className="sm:col-span-2">
        <label className="mb-2 block text-xs font-semibold tracking-[0.14em] text-[#141414] uppercase">
          Description
        </label>
        <textarea
          name="description"
          rows={3}
          defaultValue={product?.description}
          required
          className="w-full border border-[#e0e0e0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#bd1115]"
        />
      </div>

      <Field
        label="Main image path"
        name="main_image"
        defaultValue={product?.main_image}
      />

      <HasImpaSelector defaultValue={hasImpa} onChange={setHasImpa} />

      <label className="flex items-center gap-2 text-sm text-[#141414] sm:col-span-2">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={product?.is_active !== false}
        />
        Active on storefront
      </label>

      <DirectPriceField
        visible={!hasImpa}
        defaultValue={product?.has_impa ? null : product?.price}
      />

      <ImpaRemovalConfirm visible={Boolean(product && switchingOffImpa)} />

      {hasImpa && !product ? (
        <p className="sm:col-span-2 text-sm text-[#6b6b6b]">
          After creating the product, add IMPA entries from the Products page.
        </p>
      ) : null}

      {hasImpa && product ? (
        <p className="sm:col-span-2 text-sm text-[#6b6b6b]">
          Direct price is disabled. Each IMPA entry carries its own price.
        </p>
      ) : null}

      {state.error ? (
        <p className="sm:col-span-2 text-sm text-[#bd1115]">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="sm:col-span-2 text-sm text-green-700">{state.success}</p>
      ) : null}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-[#bd1115] px-5 py-2.5 text-xs font-semibold tracking-[0.14em] text-white uppercase hover:bg-[#9a0e12] disabled:opacity-60"
        >
          {pending ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function ImpaManager({
  product,
  hasImpa,
}: {
  product: DbProduct;
  hasImpa: boolean;
}) {
  const entries = product.product_impa ?? [];

  if (!hasImpa) {
    return (
      <p className="mt-6 border-t border-[#e8e8e8] pt-6 text-sm text-[#6b6b6b]">
        IMPA entries are hidden because this product uses direct pricing. Select
        &quot;Yes&quot; above to manage IMPA options.
      </p>
    );
  }

  return (
    <div className="mt-8 border-t border-[#e8e8e8] pt-6">
      <h4 className="mb-4 font-[family-name:var(--font-display)] text-lg text-[#141414]">
        IMPA entries
      </h4>

      {entries.length === 0 ? (
        <p className="mb-4 text-sm text-[#bd1115]">
          Add at least one IMPA entry before customers can purchase this product.
        </p>
      ) : (
        <div className="mb-6 space-y-4">
          {entries.map((entry) => (
            <ImpaEditor key={entry.id} productId={product.id} entry={entry} />
          ))}
        </div>
      )}

      <ImpaCreateForm productId={product.id} />
    </div>
  );
}

function ImpaCreateForm({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState(createImpaEntry, initialState);

  return (
    <form
      action={action}
      className="grid gap-3 border border-[#e8e8e8] bg-white p-4 sm:grid-cols-2"
    >
      <input type="hidden" name="product_id" value={productId} />
      <Field label="IMPA No." name="impa_number" />
      <Field label="Inventory UoM" name="inventory_uom" defaultValue="PCS" />
      <div className="sm:col-span-2">
        <label className="mb-2 block text-xs font-semibold tracking-[0.14em] text-[#141414] uppercase">
          Item description
        </label>
        <input
          name="item_description"
          required
          className="w-full border border-[#e0e0e0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#bd1115]"
        />
      </div>
      <Field label="Price (AED)" name="price" type="number" />
      <label className="flex items-center gap-2 text-sm text-[#141414]">
        <input type="checkbox" name="is_default" />
        Default IMPA
      </label>
      {state.error ? (
        <p className="sm:col-span-2 text-sm text-[#bd1115]">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="sm:col-span-2 text-sm text-green-700">{state.success}</p>
      ) : null}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-[#141414] px-4 py-2 text-xs font-semibold tracking-[0.14em] text-white uppercase hover:bg-[#bd1115] disabled:opacity-60"
        >
          {pending ? "Adding..." : "+ Add IMPA"}
        </button>
      </div>
    </form>
  );
}

function ImpaEditor({
  productId,
  entry,
}: {
  productId: string;
  entry: DbProductImpa;
}) {
  const [state, action, pending] = useActionState(updateImpaEntry, initialState);

  return (
    <div className="border border-[#e8e8e8] bg-white p-4">
      <form action={action} className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="id" value={entry.id} />
        <input type="hidden" name="product_id" value={productId} />
        <Field
          label="IMPA No."
          name="impa_number"
          defaultValue={entry.impa_number}
        />
        <Field
          label="Inventory UoM"
          name="inventory_uom"
          defaultValue={entry.inventory_uom}
        />
        <div className="sm:col-span-2">
          <label className="mb-2 block text-xs font-semibold tracking-[0.14em] text-[#141414] uppercase">
            Item description
          </label>
          <input
            name="item_description"
            defaultValue={entry.item_description}
            required
            className="w-full border border-[#e0e0e0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#bd1115]"
          />
        </div>
        <Field
          label="Price (AED)"
          name="price"
          type="number"
          defaultValue={String(entry.price)}
        />
        <label className="flex items-center gap-2 text-sm text-[#141414]">
          <input
            type="checkbox"
            name="is_default"
            defaultChecked={entry.is_default}
          />
          Default IMPA
        </label>
        {state.error ? (
          <p className="sm:col-span-2 text-sm text-[#bd1115]">{state.error}</p>
        ) : null}
        {state.success ? (
          <p className="sm:col-span-2 text-sm text-green-700">{state.success}</p>
        ) : null}
        <div className="flex gap-4 sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="bg-[#bd1115] px-4 py-2 text-xs font-semibold tracking-[0.14em] text-white uppercase hover:bg-[#9a0e12] disabled:opacity-60"
          >
            {pending ? "Saving..." : "Save IMPA"}
          </button>
        </div>
      </form>
      <form action={deleteImpaEntry} className="mt-3">
        <input type="hidden" name="id" value={entry.id} />
        <input type="hidden" name="product_id" value={productId} />
        <button
          type="submit"
          className="text-xs font-semibold tracking-[0.14em] text-[#bd1115] uppercase hover:underline"
        >
          Remove
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
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
        required={name !== "sort_order" && name !== "slug"}
        className="w-full border border-[#e0e0e0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#bd1115]"
      />
    </div>
  );
}
