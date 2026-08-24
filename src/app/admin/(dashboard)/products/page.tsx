import { AdminProductsList } from "@/components/admin/AdminProductsList";
import { getAdminProducts, getCategories } from "@/lib/products-data";

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    getAdminProducts(),
    getCategories(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold tracking-[0.22em] text-[#bd1115] uppercase">
          Products
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#141414]">
          All products
        </h1>
        <p className="mt-2 text-sm text-[#6b6b6b]">
          Search by name, edit pricing, and manage IMPA entries.
        </p>
      </div>

      <AdminProductsList products={products} categories={categories} />
    </div>
  );
}
