"use client";

import type { DbCategory } from "@/types/database";
import { buildCategoryTree, flattenCategoryTree, formatCategoryPath } from "@/lib/categories";

type CategoryParentSelectProps = {
  categories: DbCategory[];
  defaultValue?: string | null;
  excludeId?: string;
  name?: string;
};

export function CategoryParentSelect({
  categories,
  defaultValue = "",
  excludeId,
  name = "parent_id",
}: CategoryParentSelectProps) {
  const tree = buildCategoryTree(
    categories.map((category) => ({
      ...category,
      parent_id: category.parent_id ?? null,
    }))
  );

  const options = flattenCategoryTree(tree).filter(
    ({ category }) => category.id !== excludeId
  );

  return (
    <div className="sm:col-span-2">
      <label className="mb-2 block text-xs font-semibold tracking-[0.14em] text-[#141414] uppercase">
        Parent category
      </label>
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        className="w-full border border-[#e0e0e0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#bd1115]"
      >
        <option value="">None (top level)</option>
        {options.map(({ category, depth }) => (
          <option key={category.id} value={category.id}>
            {`${"— ".repeat(depth)}${category.name}`}
          </option>
        ))}
      </select>
      {defaultValue ? (
        <p className="mt-2 text-xs text-[#6b6b6b]">
          Current path: {formatCategoryPath(categories, defaultValue)}
        </p>
      ) : null}
    </div>
  );
}
