import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/products";

type RelatedProductsProps = {
  products: Product[];
  categoryName: string;
  categorySlug?: string;
};

export function RelatedProducts({
  products,
  categoryName,
  categorySlug,
}: RelatedProductsProps) {
  if (products.length === 0) return null;

  const categoryHref = categorySlug ? `/categories/${categorySlug}` : "/products";

  return (
    <section
      className="mx-auto mt-16 max-w-6xl border-t border-[#e8e8e8] px-6 pt-12 sm:px-10"
      aria-labelledby="related-products-heading"
    >
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-[0.28em] text-[#bd1115] uppercase">
            Same category
          </p>
          <h2
            id="related-products-heading"
            className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[#141414] sm:text-3xl"
          >
            More in {categoryName}
          </h2>
        </div>
        <Link
          href={categoryHref}
          className="text-sm font-semibold tracking-[0.08em] text-[#bd1115] uppercase hover:underline"
        >
          View all {categoryName}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {products.map((product) => (
          <Link
            key={product.id ?? product.slug ?? product.name}
            href={product.slug ? `/products/${product.slug}` : "/products"}
            className="group overflow-hidden border border-[#e8e8e8] bg-white transition-shadow hover:shadow-md"
          >
            <div className="relative aspect-square overflow-hidden bg-white">
              <Image
                src={product.image}
                alt={product.name}
                fill
                loading="lazy"
                className="object-contain p-3 transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </div>
            <div className="p-3 sm:p-4">
              <h3 className="line-clamp-2 font-[family-name:var(--font-display)] text-sm tracking-wide text-[#141414] sm:text-base">
                {product.name}
              </h3>
              {product.description ? (
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#6b6b6b]">
                  {product.description}
                </p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
