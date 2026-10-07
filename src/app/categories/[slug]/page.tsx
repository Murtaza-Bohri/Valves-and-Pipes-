import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryBreadcrumbs } from "@/components/CategoryBreadcrumbs";
import { CategorySubcategoryNav } from "@/components/CategorySubcategoryNav";
import { ProductsSection } from "@/components/ProductsSection";
import { PageHeader, PageLayout } from "@/components/PageLayout";
import { createPageMetadata } from "@/lib/seo";
import {
  getCategoryBreadcrumbTrail,
  getCategoryBySlug,
  getChildStoreCategories,
  getProductsByCategorySlug,
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

  const [products, childCategories, breadcrumbs] = await Promise.all([
    getProductsByCategorySlug(slug),
    getChildStoreCategories(category.id),
    getCategoryBreadcrumbTrail(category.id),
  ]);

  return (
    <PageLayout className="bg-[#f7f7f7]">
      <CategoryBreadcrumbs items={breadcrumbs} />
      <PageHeader
        eyebrow="Category"
        title={category.name}
        description={
          category.description ??
          `Products in our ${category.name.toLowerCase()} range.`
        }
      />
      <CategorySubcategoryNav categories={childCategories} />
      <div className="mt-10">
        <ProductsSection
          products={products}
          categories={[]}
          compact
          showFilter={false}
          syncUrl={false}
          emptyMessage={`No products in ${category.name} yet. We are updating this category — contact us for availability.`}
        />
      </div>
    </PageLayout>
  );
}
