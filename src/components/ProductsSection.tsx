"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { gsap } from "@/lib/gsap";
import { SectionPageLink } from "@/components/SectionPageLink";
import {
  ALL_PRODUCTS_CATEGORY,
  buildCategoryFilterList,
  type Product,
  type ProductCategory,
  type StoreCategory,
} from "@/lib/products";

type ProductsSectionProps = {
  products: Product[];
  categories?: StoreCategory[];
  initialCategory?: ProductCategory;
  compact?: boolean;
  syncUrl?: boolean;
  showFilter?: boolean;
  emptyMessage?: string;
  pageLink?: { href: string; label: string };
};

export function ProductsSection({
  products,
  categories = [],
  initialCategory = ALL_PRODUCTS_CATEGORY,
  compact = false,
  syncUrl = true,
  showFilter = true,
  emptyMessage = "No products listed yet. Check back soon or contact us for availability.",
  pageLink,
}: ProductsSectionProps) {
  const categoryOptions = buildCategoryFilterList(categories);
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const [category, setCategory] = useState<ProductCategory>(initialCategory);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () =>
      category === ALL_PRODUCTS_CATEGORY
        ? products
        : products.filter(
            (product) =>
              product.rootCategoryName === category ||
              product.category === category
          ),
    [category, products]
  );

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    if (filtered.length === 0) return;

    let ctx: ReturnType<typeof gsap.context> | undefined;

    const frame = requestAnimationFrame(() => {
      if (!sectionRef.current) return;

      const targets = sectionRef.current.querySelectorAll("[data-product]");
      if (!targets.length) return;

      ctx = gsap.context(() => {
        gsap.from(targets, {
          y: 32,
          opacity: 0,
          duration: 0.6,
          stagger: 0.06,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 78%",
            toggleActions: "play none none none",
          },
        });
      }, sectionRef);
    });

    return () => {
      cancelAnimationFrame(frame);
      ctx?.revert();
    };
  }, [filtered.length, products.length, category]);

  const selectCategory = (next: ProductCategory) => {
    setCategory(next);
    setOpen(false);
    if (!syncUrl) return;
    const query =
      next === ALL_PRODUCTS_CATEGORY
        ? ""
        : `?category=${encodeURIComponent(next)}`;
    router.replace(`/products${query}`, { scroll: false });
  };

  return (
    <section
      id="products"
      ref={sectionRef}
      className={`relative px-6 sm:px-10 ${
        compact ? "py-8 sm:py-10" : "bg-[#f7f7f7] py-24 sm:py-32"
      }`}
      aria-labelledby={compact ? undefined : "products-heading"}
    >
      <div className="mx-auto max-w-6xl">
        {!compact && showFilter && (
          <div className="mb-10 flex flex-col gap-6 sm:mb-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="mb-4 text-xs font-semibold tracking-[0.28em] text-[#bd1115] uppercase">
                Products
              </p>
              <h2
                id="products-heading"
                className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[#141414] sm:text-4xl"
              >
                Oilfields & marine supplies
              </h2>
            </div>

            <CategoryDropdown
              category={category}
              options={categoryOptions}
              open={open}
              setOpen={setOpen}
              dropdownRef={dropdownRef}
              onSelect={selectCategory}
            />
          </div>
        )}

        {compact && showFilter && (
          <div className="mb-8 flex justify-end">
            <CategoryDropdown
              category={category}
              options={categoryOptions}
              open={open}
              setOpen={setOpen}
              dropdownRef={dropdownRef}
              onSelect={selectCategory}
            />
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="border border-[#e8e8e8] bg-white px-6 py-12 text-center">
            <p className="text-sm leading-relaxed text-[#6b6b6b] sm:text-base">
              {emptyMessage}
            </p>
          </div>
        ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {filtered.map((product) => {
            const href = product.slug ? `/products/${product.slug}` : "/products";

            return (
            <Link
              key={product.id ?? product.name}
              href={href}
              data-product
              className="group overflow-hidden border border-[#e8e8e8] bg-white transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-square overflow-hidden bg-white">
                <ProductImage
                  src={product.image}
                  alt={`${product.name} supplied by Himmat Oil Fields`}
                  fill
                  loading="lazy"
                  className="object-contain p-3 transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              </div>
              <div className="p-3 sm:p-4">
                <h3 className="mb-1 font-[family-name:var(--font-display)] text-sm tracking-wide text-[#141414] sm:text-base">
                  {product.name}
                </h3>
                <p className="line-clamp-2 text-xs leading-relaxed text-[#6b6b6b]">
                  {product.description}
                </p>
              </div>
            </Link>
            );
          })}
        </div>
        )}
        {pageLink ? (
          <SectionPageLink href={pageLink.href} label={pageLink.label} />
        ) : null}
      </div>
    </section>
  );
}

function CategoryDropdown({
  category,
  options,
  open,
  setOpen,
  dropdownRef,
  onSelect,
}: {
  category: ProductCategory;
  options: ProductCategory[];
  open: boolean;
  setOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  onSelect: (category: ProductCategory) => void;
}) {
  return (
    <div ref={dropdownRef} className="relative w-full sm:w-52">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between border border-[#e0e0e0] bg-white px-3 py-2.5 text-left text-xs font-semibold tracking-[0.08em] text-[#141414] uppercase transition-colors hover:border-[#bd1115]/40 sm:text-sm"
      >
        <span>{category}</span>
        <ChevronDown
          className={`h-4 w-4 text-[#bd1115] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="absolute z-20 mt-2 w-full border border-[#e0e0e0] bg-white py-2 shadow-lg"
          >
            {options.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  role="option"
                  aria-selected={category === item}
                  onClick={() => onSelect(item)}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                    category === item
                      ? "bg-[#f8e8e8] font-semibold text-[#bd1115]"
                      : "text-[#141414] hover:bg-[#f7f7f7]"
                  }`}
                >
                  {item}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
