import { AdminCategoriesManager } from "@/components/admin/AdminCategoriesManager";
import { getCategories } from "@/lib/products-data";

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold tracking-[0.22em] text-[#bd1115] uppercase">
          Categories
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#141414]">
          Category management
        </h1>
        <p className="mt-2 text-sm text-[#6b6b6b]">
          Add and manage product categories. Each product belongs to one category.
        </p>
      </div>

      <AdminCategoriesManager categories={categories} />
    </div>
  );
}
