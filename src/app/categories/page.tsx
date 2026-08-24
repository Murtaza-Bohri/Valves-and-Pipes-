import type { Metadata } from "next";
import { CategoriesSection } from "@/components/CategoriesSection";
import { PageHeader, PageLayout } from "@/components/PageLayout";
import { createPageMetadata } from "@/lib/seo";
import { getStoreCategories } from "@/lib/products-data";

export const metadata: Metadata = createPageMetadata({
  title: "Categories | Himmat Oilfields & Marines",
  description:
    "Browse pipes, valves, and other industrial supply categories for oil & gas and marine projects.",
  path: "/categories",
});

export default async function CategoriesPage() {
  const categories = await getStoreCategories();

  return (
    <PageLayout className="bg-[#f7f7f7]">
      <PageHeader
        eyebrow="Categories"
        title="Browse by category"
        description="Select a category to view the products available in that range."
      />
      <div className="mt-10">
        <CategoriesSection categories={categories} compact />
      </div>
    </PageLayout>
  );
}
