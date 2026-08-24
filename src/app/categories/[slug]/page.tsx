import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductsSection } from "@/components/ProductsSection";
import { PageHeader, PageLayout } from "@/components/PageLayout";
import { createPageMetadata } from "@/lib/seo";
import {
  getCategoryBySlug,
  getProductsByCategorySlug,
  getStoreCategories,
} from "@/lib/products-data";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return createPageMetadata({
      title: "Category not found | Himmat Oilfields & Marines",
      description: "The requested category could not be found.",
      path: `/categories/${slug}`,
    });
  }

  return createPageMetadata({
    title: `${category.name} | Himmat Oilfields & Marines`,
    description:
      category.description ??
      `Browse ${category.name.toLowerCase()} products from Himmat Oilfields & Marines.`,
    path: `/categories/${slug}`,
  });
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const [products, categories] = await Promise.all([
    getProductsByCategorySlug(slug),
    getStoreCategories(),
  ]);

  return (
    <PageLayout className="bg-[#f7f7f7]">
      <PageHeader
        eyebrow="Category"
        title={category.name}
        description={
          category.description ??
          `Products in our ${category.name.toLowerCase()} range.`
        }
      />
      <div className="mt-10">
        <ProductsSection
          products={products}
          categories={categories}
          compact
          showFilter={false}
          syncUrl={false}
          emptyMessage={`No products in ${category.name} yet. We are updating this category — contact us for availability.`}
        />
      </div>
    </PageLayout>
  );
}
