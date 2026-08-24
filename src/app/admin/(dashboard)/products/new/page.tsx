import Link from "next/link";
import { AdminAddProductForm } from "@/components/admin/AdminAddProductForm";
import { getCategories } from "@/lib/products-data";

export default async function AdminAddProductPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold tracking-[0.22em] text-[#bd1115] uppercase">
          Add product
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#141414]">
          Create a new product
        </h1>
        <p className="mt-2 text-sm text-[#6b6b6b]">
          Choose IMPA or direct pricing, then manage IMPA entries from the{" "}
          <Link href="/admin/products" className="font-semibold text-[#bd1115] underline">
            Products
          </Link>{" "}
          page after saving.
        </p>
      </div>

      <AdminAddProductForm categories={categories} />
    </div>
  );
}
