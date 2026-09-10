import Link from "next/link";
import type { StoreCategory } from "@/lib/products";

type CategorySubcategoryNavProps = {
  categories: StoreCategory[];
};

export function CategorySubcategoryNav({ categories }: CategorySubcategoryNavProps) {
  if (categories.length === 0) return null;

  return (
    <section className="mx-auto mt-8 max-w-6xl px-6 sm:px-10">
      <h2 className="mb-4 text-xs font-semibold tracking-[0.18em] text-[#141414] uppercase">
        Subcategories
      </h2>
      <div className="flex flex-wrap gap-3">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className="border border-[#e0e0e0] bg-white px-4 py-2.5 text-sm font-semibold tracking-wide text-[#141414] transition-colors hover:border-[#bd1115] hover:bg-[#f8e8e8] hover:text-[#bd1115]"
          >
            {category.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
