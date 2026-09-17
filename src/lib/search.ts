import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/admin";
import { getCategoryBreadcrumbs } from "@/lib/categories";
import type { DbCategory } from "@/types/database";

export type CatalogSearchResult = {
  kind: "product" | "category";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  image?: string;
  impaNumber?: string;
};

type CategoryCache = {
  categories: DbCategory[];
  pathById: Map<string, string>;
  expiresAt: number;
};

const CATEGORIES_TTL_MS = 5 * 60 * 1000;
let categoryCache: CategoryCache | null = null;

function sanitizeSearchQuery(query: string) {
  return query.replace(/[%_,]/g, " ").replace(/\s+/g, " ").trim();
}

function buildCategoryPathMap(categories: DbCategory[]) {
  const pathById = new Map<string, string>();
  for (const category of categories) {
    pathById.set(
      category.id,
      getCategoryBreadcrumbs(categories, category.id)
        .map((item) => item.name)
        .join(" › ")
    );
  }
  return pathById;
}

async function getCachedCategories(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
) {
  const now = Date.now();
  if (categoryCache && categoryCache.expiresAt > now) {
    return categoryCache;
  }

  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const categories = (data ?? []) as DbCategory[];
  categoryCache = {
    categories,
    pathById: buildCategoryPathMap(categories),
    expiresAt: now + CATEGORIES_TTL_MS,
  };

  return categoryCache;
}

function quotedIlikePattern(value: string) {
  const pattern = `%${value}%`;
  return `"${pattern.replace(/"/g, '""')}"`;
}

export async function searchCatalog(
  query: string,
  limit = 8
): Promise<CatalogSearchResult[]> {
  const sanitized = sanitizeSearchQuery(query);
  if (sanitized.length < 2 || !isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const quotedPattern = quotedIlikePattern(sanitized);
  const textOrFilter = `name.ilike.${quotedPattern},description.ilike.${quotedPattern}`;
  const impaDigits = sanitized.replace(/\D/g, "");
  const isImpaQuery = impaDigits.length >= 2;
  const impaOrFilter = isImpaQuery
    ? `impa_number.ilike.${quotedIlikePattern(impaDigits)}`
    : `impa_number.ilike.${quotedPattern},item_description.ilike.${quotedPattern}`;

  const [{ pathById }, categoryResult, impaResult, productResult] = await Promise.all([
    getCachedCategories(supabase),
    supabase
      .from("categories")
      .select("id, name, slug")
      .eq("is_active", true)
      .ilike("name", `%${sanitized}%`)
      .order("sort_order", { ascending: true })
      .limit(4),
    supabase
      .from("product_impa")
      .select("impa_number, item_description, product_id")
      .or(impaOrFilter)
      .limit(limit),
    supabase
      .from("products")
      .select("id, name, slug, main_image, category_id")
      .eq("is_active", true)
      .or(textOrFilter)
      .order("sort_order", { ascending: true })
      .limit(limit),
  ]);

  const categoryResults: CatalogSearchResult[] = [];
  const productResults: CatalogSearchResult[] = [];
  const impaProductResults: CatalogSearchResult[] = [];
  const seenProductIds = new Set<string>();

  for (const category of categoryResult.data ?? []) {
    categoryResults.push({
      kind: "category",
      id: category.id,
      title: category.name,
      subtitle: pathById.get(category.id),
      href: `/categories/${category.slug}`,
    });
  }

  const productMatches = productResult.data ?? [];
  for (const product of productMatches) {
    seenProductIds.add(product.id);
    productResults.push({
      kind: "product",
      id: product.id,
      title: product.name,
      subtitle: pathById.get(product.category_id),
      href: `/products/${product.slug}`,
      image: product.main_image,
    });
  }

  const impaMatches = impaResult.data ?? [];
  const missingImpaProductIds = [
    ...new Set(
      impaMatches
        .map((row) => row.product_id)
        .filter((productId) => !seenProductIds.has(productId))
    ),
  ];

  if (missingImpaProductIds.length > 0) {
    const { data: impaProducts } = await supabase
      .from("products")
      .select("id, name, slug, main_image, category_id")
      .eq("is_active", true)
      .in("id", missingImpaProductIds);

    const impaByProductId = new Map(
      impaMatches.map((row) => [row.product_id, row])
    );

    for (const product of impaProducts ?? []) {
      const impa = impaByProductId.get(product.id);
      if (!impa) continue;

      seenProductIds.add(product.id);
      impaProductResults.push({
        kind: "product",
        id: product.id,
        title: product.name,
        subtitle: impa.item_description || pathById.get(product.category_id),
        href: `/products/${product.slug}`,
        image: product.main_image,
        impaNumber: impa.impa_number,
      });
    }
  }

  // Also surface IMPA hits for products already matched by name.
  for (const product of productMatches) {
    const impa = impaMatches.find((row) => row.product_id === product.id);
    if (!impa) continue;
    const index = productResults.findIndex((item) => item.id === product.id);
    if (index >= 0) {
      productResults[index] = {
        ...productResults[index],
        impaNumber: impa.impa_number,
        subtitle: impa.item_description || productResults[index].subtitle,
      };
    }
  }

  const merged = isImpaQuery
    ? [...impaProductResults, ...productResults, ...categoryResults]
    : [...productResults, ...impaProductResults, ...categoryResults];

  return merged.slice(0, limit);
}
