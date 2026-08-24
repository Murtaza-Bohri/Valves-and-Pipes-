import type { Metadata } from "next";
import { ProductsSection } from "@/components/ProductsSection";
import { PageHeader, PageLayout } from "@/components/PageLayout";
import { createPageMetadata } from "@/lib/seo";
import { getProducts, getStoreCategories } from "@/lib/products-data";
import { ALL_PRODUCTS_CATEGORY, type ProductCategory } from "@/lib/products";

export const metadata: Metadata = createPageMetadata({
  title: "Products | Himmat Oilfields & Marines",
  description:
    "Browse individual products for oil & gas, marine, power, pipeline, and utility projects across the UAE.",
  path: "/products",
});

type ProductsPageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { category } = await searchParams;
  const [products, categories] = await Promise.all([
    getProducts(),
    getStoreCategories(),
  ]);
  const categoryNames = categories.map((item) => item.name);
  const initialCategory: ProductCategory = categoryNames.includes(category ?? "")
    ? (category as ProductCategory)
    : ALL_PRODUCTS_CATEGORY;

  return (
    <PageLayout className="bg-[#f7f7f7]">
      <PageHeader
        eyebrow="Products"
        title="All products"
        description="Individual SKUs available to order. Browse by category from the menu if you are looking for a specific range."
      />
      <div className="mt-10">
        <ProductsSection
          products={products}
          categories={categories}
          initialCategory={initialCategory}
          compact
        />
      </div>
    </PageLayout>
  );
}
