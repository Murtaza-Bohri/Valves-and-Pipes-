"use client";

import Image from "next/image";
import Link from "next/link";
import { SectionPageLink } from "@/components/SectionPageLink";
import { getCategoryImage, type StoreCategory } from "@/lib/products";

type CategoriesSectionProps = {
  categories: StoreCategory[];
  compact?: boolean;
  pageLink?: { href: string; label: string };
};

export function CategoriesSection({
  categories,
  compact = false,
  pageLink,
}: CategoriesSectionProps) {
  return (
    <section
      id="categories"
      className={`relative px-6 sm:px-10 ${
        compact ? "py-8 sm:py-10" : "bg-[#f7f7f7] py-24 sm:py-32"
      }`}
      aria-labelledby={compact ? undefined : "categories-heading"}
    >
      <div className="mx-auto max-w-6xl">
        {!compact && (
          <div className="mb-10 max-w-2xl sm:mb-14">
            <p className="mb-4 text-xs font-semibold tracking-[0.28em] text-[#bd1115] uppercase">
              Categories
            </p>
            <h2
              id="categories-heading"
              className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[#141414] sm:text-4xl"
            >
              Browse by category
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#6b6b6b]">
              Explore our product ranges. Individual products are listed inside each category.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              data-category
              className="group overflow-hidden border border-[#e8e8e8] bg-white transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-square overflow-hidden bg-white">
                <Image
                  src={getCategoryImage(category.slug, category.image)}
                  alt={`${category.name} category at Himmat Oil Fields`}
                  fill
                  loading="lazy"
                  className="object-contain p-3 transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              </div>
              <div className="p-3 sm:p-4">
                <h3 className="mb-1 font-[family-name:var(--font-display)] text-sm tracking-wide text-[#141414] sm:text-base">
                  {category.name}
                </h3>
                {category.description ? (
                  <p className="line-clamp-2 text-xs leading-relaxed text-[#6b6b6b]">
                    {category.description}
                  </p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>

        {pageLink ? (
          <SectionPageLink href={pageLink.href} label={pageLink.label} />
        ) : null}
      </div>
    </section>
  );
}
