import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/admin";
import { mapDbProductToProduct } from "@/lib/pricing";
import {
  fallbackCategories,
  getCategoryImage,
  type Product,
  type StoreCategory,
} from "@/lib/products";
import { slugify } from "@/lib/slug";
import type { DbCategory, DbLegacyProduct, DbProduct } from "@/types/database";

const NORMALIZED_PRODUCT_SELECT = `
  id,
  name,
  slug,
  description,
  main_image,
  sort_order,
  category_id,
  has_impa,
  price,
  categories ( name, slug ),
  product_impa (
    id,
    impa_number,
    item_description,
    inventory_uom,
    price,
    is_default
  )
`;

const MINIMAL_PRODUCT_SELECT = `
  id,
  name,
  slug,
  description,
  main_image,
  sort_order,
  category_id,
  categories ( name, slug )
`;

function mapDbCategoryToStoreCategory(category: DbCategory): StoreCategory {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? undefined,
    image: getCategoryImage(category.slug, category.image),
  };
}

function mapLegacyProduct(row: DbLegacyProduct): Product {
  return {
    id: row.id,
    name: row.name,
    slug: slugify(row.name),
    category: row.category as Product["category"],
    description: row.description,
    image: row.image,
    hasImpa: false,
    price: 0,
    displayPrice: 0,
  };
}

export const getCategories = cache(async (): Promise<DbCategory[]> => {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) return [];
    return (data as DbCategory[]) ?? [];
  } catch {
    return [];
  }
});

export const getStoreCategories = cache(async (): Promise<StoreCategory[]> => {
  const categories = await getCategories();
  if (categories.length) {
    return categories.map(mapDbCategoryToStoreCategory);
  }

  return fallbackCategories;
});

export const getCategoryBySlug = cache(async (slug: string): Promise<StoreCategory | null> => {
  const normalizedSlug = slug.trim().toLowerCase();
  const categories = await getStoreCategories();
  return categories.find((category) => category.slug === normalizedSlug) ?? null;
});

export const getProducts = cache(async (): Promise<Product[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const supabase = await createSupabaseServerClient();

    const normalized = await supabase
      .from("products")
      .select(NORMALIZED_PRODUCT_SELECT)
      .order("sort_order", { ascending: true });

    if (!normalized.error && normalized.data?.length) {
      const first = normalized.data[0] as Record<string, unknown>;
      if ("category_id" in first && "main_image" in first) {
        return (normalized.data as unknown as DbProduct[]).map(mapDbProductToProduct);
      }
    }

    const legacy = await supabase
      .from("products")
      .select("id, name, category, description, image, sort_order")
      .order("sort_order", { ascending: true });

    if (!legacy.error && legacy.data?.length) {
      return (legacy.data as unknown as DbLegacyProduct[]).map(mapLegacyProduct);
    }

    return [];
  } catch {
    return [];
  }
});

export const getProductsByCategorySlug = cache(async (slug: string): Promise<Product[]> => {
  const normalizedSlug = slug.trim().toLowerCase();
  const category = await getCategoryBySlug(normalizedSlug);
  if (!category) return [];

  if (isSupabaseConfigured() && !category.id.startsWith("fallback-")) {
    try {
      const supabase = await createSupabaseServerClient();
      const normalized = await supabase
        .from("products")
        .select(NORMALIZED_PRODUCT_SELECT)
        .eq("category_id", category.id)
        .order("sort_order", { ascending: true });

      if (!normalized.error && normalized.data?.length) {
        return (normalized.data as unknown as DbProduct[]).map(mapDbProductToProduct);
      }

      const minimal = await supabase
        .from("products")
        .select(MINIMAL_PRODUCT_SELECT)
        .eq("category_id", category.id)
        .order("sort_order", { ascending: true });

      if (!minimal.error && minimal.data?.length) {
        return (minimal.data as unknown as DbProduct[]).map((row) =>
          mapDbProductToProduct({
            ...row,
            has_impa: false,
            price: 0,
            product_impa: [],
          })
        );
      }

      return [];
    } catch {
      return [];
    }
  }

  const products = await getProducts();
  return products.filter(
    (product) =>
      product.categorySlug === normalizedSlug ||
      slugify(product.category) === normalizedSlug
  );
});

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const normalizedSlug = slug.trim().toLowerCase();

  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();

    const normalized = await supabase
      .from("products")
      .select(NORMALIZED_PRODUCT_SELECT)
      .eq("slug", normalizedSlug)
      .maybeSingle();

    if (!normalized.error && normalized.data) {
      return mapDbProductToProduct(normalized.data as unknown as DbProduct);
    }

    const minimal = await supabase
      .from("products")
      .select(MINIMAL_PRODUCT_SELECT)
      .eq("slug", normalizedSlug)
      .maybeSingle();

    if (!minimal.error && minimal.data) {
      const row = minimal.data as unknown as DbProduct;
      return mapDbProductToProduct({
        ...row,
        has_impa: false,
        price: 0,
        product_impa: [],
      });
    }

    const legacy = await supabase
      .from("products")
      .select("id, name, category, description, image, sort_order")
      .order("sort_order", { ascending: true });

    if (!legacy.error && legacy.data?.length) {
      const match = (legacy.data as unknown as DbLegacyProduct[]).find(
        (row) =>
          slugify(row.name) === normalizedSlug ||
          row.name.trim().toLowerCase() === normalizedSlug
      );
      if (match) return mapLegacyProduct(match);
    }
  } catch {
    return null;
  }

  return null;
});

export async function getAdminProducts(): Promise<DbProduct[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(NORMALIZED_PRODUCT_SELECT)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return data as unknown as DbProduct[];
}
