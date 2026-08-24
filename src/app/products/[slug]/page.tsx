import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailClient } from "@/components/ProductDetailClient";
import { PageLayout } from "@/components/PageLayout";
import { createPageMetadata } from "@/lib/seo";
import { getProductBySlug } from "@/lib/products-data";

type ProductDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return createPageMetadata({
      title: "Product not found | Himmat Oilfields & Marines",
      description: "The requested product could not be found.",
      path: `/products/${slug}`,
    });
  }

  return createPageMetadata({
    title: `${product.name} | Himmat Oilfields & Marines`,
    description: product.description,
    path: `/products/${slug}`,
  });
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <PageLayout className="bg-[#f7f7f7]">
      <div className="pb-16 pt-8">
        <ProductDetailClient product={product} />
      </div>
    </PageLayout>
  );
}
