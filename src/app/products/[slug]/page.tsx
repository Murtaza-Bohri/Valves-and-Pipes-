import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDetailClient } from "@/components/ProductDetailClient";
import { RelatedProducts } from "@/components/RelatedProducts";
import { PageLayout } from "@/components/PageLayout";
import { createPageMetadata } from "@/lib/seo";
import { getProductBySlug, getRelatedProducts } from "@/lib/products-data";
import { slugify } from "@/lib/slug";

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

  const relatedProducts = await getRelatedProducts(product);
  const categorySlug = product.categorySlug ?? slugify(product.category);
  const categoryHref = categorySlug ? `/categories/${categorySlug}` : "/products";

  return (
    <PageLayout className="bg-[#f7f7f7]">
      <div className="pb-16 pt-8">
        <ProductDetailClient
          product={product}
          categoryLink={
            <Link
              href={categoryHref}
              className="inline-block text-xs font-semibold tracking-[0.28em] text-[#bd1115] uppercase hover:underline"
            >
              {product.category}
            </Link>
          }
        />
        <RelatedProducts
          products={relatedProducts}
          categoryName={product.category}
          categorySlug={categorySlug}
        />
      </div>
    </PageLayout>
  );
}
