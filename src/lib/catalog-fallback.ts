import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getDescendantCategoryIds } from "@/lib/categories";
import type { Product } from "@/lib/products";
import { resolveProductImageUrl } from "@/lib/image-url";
import { slugify } from "@/lib/slug";
import type { DbCategory } from "@/types/database";

type SeedProductFile = {
  categorySlug?: string;
  defaultImage?: string;
  products: Array<{
    name: string;
    slug?: string;
    categorySlug?: string;
    description?: string;
    image?: string;
    datasheetUrl?: string | null;
    impa: Array<{
      number: string;
      description: string;
      uom?: string;
      price: number;
    }>;
  }>;
};

type HierarchyFile = {
  roots: Array<{
    name: string;
    slug: string;
    description?: string;
    image?: string;
    sortOrder?: number;
    children?: HierarchyFile["roots"];
  }>;
};

export function dedupeProducts(products: Product[]) {
  const seen = new Set<string>();
  return products.filter((product) => {
    const key = product.slug ?? product.id ?? product.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
let fallbackCategoriesCache: DbCategory[] | null = null;
let fallbackProductsCache: Product[] | null = null;

function readJson<T>(filename: string): T | null {
  try {
    const raw = readFileSync(join(process.cwd(), "data", filename), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function flattenHierarchy(
  nodes: HierarchyFile["roots"],
  parentId: string | null = null,
  sortOffset = 0
): DbCategory[] {
  const categories: DbCategory[] = [];

  nodes.forEach((node, index) => {
    const id = `fallback-${node.slug}`;
    categories.push({
      id,
      name: node.name,
      slug: node.slug,
      parent_id: parentId,
      description: node.description ?? null,
      image: node.image ?? null,
      sort_order: node.sortOrder ?? sortOffset + index,
      is_active: true,
      created_at: "",
      updated_at: "",
    });

    if (node.children?.length) {
      categories.push(...flattenHierarchy(node.children, id));
    }
  });

  return categories;
}

export function isSupabaseConnectivityError(message: string | undefined) {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes("fetch failed") ||
    normalized.includes("network") ||
    normalized.includes("econnrefused") ||
    normalized.includes("enotfound") ||
    normalized.includes("etimedout")
  );
}

export function getFallbackCategories(): DbCategory[] {
  if (fallbackCategoriesCache) return fallbackCategoriesCache;

  const hierarchy = readJson<HierarchyFile>("category-hierarchy.json");
  fallbackCategoriesCache = hierarchy?.roots?.length
    ? flattenHierarchy(hierarchy.roots)
    : [];

  return fallbackCategoriesCache;
}

function mapSeedFileToProducts(
  seed: SeedProductFile,
  defaultCategorySlug: string,
  categorySlugByProductSlug?: Record<string, string>
) {
  const defaultImage = seed.defaultImage ?? "/products/valves.png";

  return seed.products.map((item) => {
    const slug = item.slug ?? slugify(item.name);
    const categorySlug =
      item.categorySlug ??
      categorySlugByProductSlug?.[slug] ??
      defaultCategorySlug;
    const impaEntries = item.impa.map((entry, index) => ({
      id: `fallback-impa-${slug}-${entry.number}`,
      impaNumber: String(entry.number),
      description: entry.description,
      uom: entry.uom ?? "PCS",
      price: Number(entry.price),
      isDefault: index === 0,
    }));

    return {
      id: `fallback-product-${slug}`,
      name: item.name,
      slug,
      category: categorySlug,
      categoryId: `fallback-${categorySlug}`,
      categorySlug,
      description:
        item.description ??
        `${item.name}. Industrial valve with IMPA-coded sizes and AED pricing.`,
      image: resolveProductImageUrl(item.image ?? defaultImage, defaultImage),
      hasImpa: true,
      displayPrice: impaEntries[0]?.price,
      impaEntries,
    } satisfies Product;
  });
}

export function getFallbackProducts(): Product[] {
  if (fallbackProductsCache) return fallbackProductsCache;

  const valveSeed = readJson<SeedProductFile>("valve-products.json");
  const butterflySeed = readJson<SeedProductFile>("butterfly-valve-products.json");
  const hierarchy = readJson<{ productCategoryBySlug?: Record<string, string> }>(
    "category-hierarchy.json"
  );

  fallbackProductsCache = dedupeProducts([
    ...(valveSeed
      ? mapSeedFileToProducts(
          valveSeed,
          valveSeed.categorySlug ?? "valves",
          hierarchy?.productCategoryBySlug
        )
      : []),
    ...(butterflySeed
      ? mapSeedFileToProducts(
          butterflySeed,
          butterflySeed.categorySlug ?? "butterfly-valves"
        )
      : []),
  ]);

  return fallbackProductsCache;
}

export function getFallbackProductsByCategorySlug(slug: string): Product[] {
  const normalizedSlug = slug.trim().toLowerCase();
  const categories = getFallbackCategories();
  const products = getFallbackProducts();

  if (!categories.length) {
    return dedupeProducts(
      products.filter(
        (product) =>
          product.categorySlug === normalizedSlug ||
          slugify(String(product.category)) === normalizedSlug
      )
    );
  }

  const category = categories.find((item) => item.slug === normalizedSlug);
  if (!category) return [];

  const categoryIds = getDescendantCategoryIds(categories, category.id, true);
  const slugById = new Map(categories.map((item) => [item.id, item.slug]));

  return dedupeProducts(
    products.filter((product) => {
      const productCategoryId = product.categoryId ?? "";
      if (categoryIds.includes(productCategoryId)) return true;
      const productCategorySlug = product.categorySlug ?? slugify(String(product.category));
      return (
        productCategorySlug === normalizedSlug ||
        slugById.get(productCategoryId) === normalizedSlug
      );
    })
  );
}
