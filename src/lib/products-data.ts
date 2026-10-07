import { cache } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/admin";
import {
  buildCategoryTree,
  findCategoryBySlug,
  getCategoryBreadcrumbs,
  getDescendantCategoryIds,
  getDirectChildCategories,
  type CategoryTreeNode,
} from "@/lib/categories";
import { mapDbProductToProduct } from "@/lib/pricing";
import {
  getFallbackCategories,
  dedupeProducts,
  getFallbackProducts,
  getFallbackProductsByCategorySlug,
  isSupabaseConnectivityError,
} from "@/lib/catalog-fallback";
import {
  fallbackCategories,
  getCategoryImage,
  type Product,
  type StoreCategory,
} from "@/lib/products";
import { slugify } from "@/lib/slug";
import type { DbCategory, DbLegacyProduct, DbProduct } from "@/types/database";

const PRODUCT_IMPA_SELECT = `
  product_impa (
    id,
    impa_number,
    item_description,
    inventory_uom,
    price,
    is_default
  )
`;

const NORMALIZED_PRODUCT_SELECT = `
  id,
  name,
  slug,
  description,
  main_image,
  datasheet_url,
  sort_order,
  category_id,
  has_impa,
  price,
  categories ( name, slug ),
  ${PRODUCT_IMPA_SELECT}
`;

const NORMALIZED_PRODUCT_SELECT_NO_DATASHEET = `
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
  ${PRODUCT_IMPA_SELECT}
`;

/** Category / listing pages — no nested IMPA rows (much faster). */
const LIST_PRODUCT_SELECT = `
  id,
  name,
  slug,
  description,
  main_image,
  sort_order,
  category_id,
  has_impa,
  price,
  categories ( name, slug )
`;

const LIST_PRODUCT_SELECT_WITH_DATASHEET = `
  id,
  name,
  slug,
  description,
  main_image,
  datasheet_url,
  sort_order,
  category_id,
  has_impa,
  price,
  categories ( name, slug )
`;

const MINIMAL_PRODUCT_SELECT = `
  id,
  name,
  slug,
  description,
  main_image,
  datasheet_url,
  sort_order,
  category_id,
  categories ( name, slug )
`;

const MINIMAL_PRODUCT_SELECT_NO_DATASHEET = `
  id,
  name,
  slug,
  description,
  main_image,
  sort_order,
  category_id,
  categories ( name, slug )
`;

function isMissingDatasheetColumnError(message: string | undefined) {
  return Boolean(message?.includes("datasheet_url"));
}

let catalogSupportsDatasheetUrl: boolean | null = null;

async function ensureDatasheetColumnKnown(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
) {
  if (catalogSupportsDatasheetUrl != null) {
    return catalogSupportsDatasheetUrl;
  }

  const { error } = await supabase.from("products").select("datasheet_url").limit(0);
  catalogSupportsDatasheetUrl = !isMissingDatasheetColumnError(error?.message);
  return catalogSupportsDatasheetUrl;
}

function mapDbCategoryToStoreCategory(category: DbCategory): StoreCategory {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    parentId: category.parent_id,
    description: category.description ?? undefined,
    image: getCategoryImage(category.slug, category.image),
  };
}

function mapTreeNodeToStoreCategory(node: CategoryTreeNode): StoreCategory {
  return {
    id: node.id,
    name: node.name,
    slug: node.slug,
    parentId: node.parentId,
    description: node.description,
    image: node.image,
    children: node.children.map(mapTreeNodeToStoreCategory),
  };
}

function enrichProductCategories(
  product: Product,
  categories: DbCategory[]
): Product {
  if (!product.categoryId || !categories.length) return product;

  const breadcrumbs = getCategoryBreadcrumbs(categories, product.categoryId);
  const root = breadcrumbs[0];

  return {
    ...product,
    categoryPath: breadcrumbs.map((item) => item.name),
    rootCategoryName: root?.name,
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
  noStore();

  if (!isSupabaseConfigured()) {
    return getFallbackCategories();
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      if (isSupabaseConnectivityError(error.message)) {
        return getFallbackCategories();
      }
      return [];
    }

    if (data?.length) {
      return data as DbCategory[];
    }

    return getFallbackCategories();
  } catch {
    return getFallbackCategories();
  }
});

export const getCategoryTree = cache(async (): Promise<CategoryTreeNode[]> => {
  const categories = await getCategories();
  return buildCategoryTree(categories);
});

export const getRootStoreCategories = cache(async (): Promise<StoreCategory[]> => {
  const tree = await getCategoryTree();
  if (tree.length) {
    return tree.map(mapTreeNodeToStoreCategory);
  }

  return fallbackCategories;
});

export const getStoreCategories = getRootStoreCategories;

export const getCategoryBySlug = cache(async (slug: string): Promise<StoreCategory | null> => {
  const normalizedSlug = slug.trim().toLowerCase();
  const categories = await getCategories();

  if (categories.length) {
    const match = findCategoryBySlug(categories, normalizedSlug);
    return match ? mapDbCategoryToStoreCategory(match) : null;
  }

  return (
    fallbackCategories.find((category) => category.slug === normalizedSlug) ?? null
  );
});

export const getChildStoreCategories = cache(
  async (parentId: string): Promise<StoreCategory[]> => {
    const categories = await getCategories();
    return getDirectChildCategories(categories, parentId).map(mapDbCategoryToStoreCategory);
  }
);

export const getCategoryBreadcrumbTrail = cache(
  async (categoryId: string) => {
    const categories = await getCategories();
    return getCategoryBreadcrumbs(categories, categoryId);
  }
);

function enrichProducts(products: Product[], categories: DbCategory[]) {
  return products.map((product) => enrichProductCategories(product, categories));
}

function logCatalogIssue(message: string) {
  if (process.env.NODE_ENV === "development") {
    console.warn(`[catalog] ${message}`);
  }
}

export const getProducts = cache(async (): Promise<Product[]> => {
  noStore();

  if (!isSupabaseConfigured()) {
    const categories = getFallbackCategories();
    return enrichProducts(getFallbackProducts(), categories);
  }

  const categories = await getCategories();

  try {
    const supabase = await createSupabaseServerClient();
    const hasDatasheetColumn = await ensureDatasheetColumnKnown(supabase);

    const normalized = hasDatasheetColumn
      ? await supabase
          .from("products")
          .select(LIST_PRODUCT_SELECT_WITH_DATASHEET)
          .order("sort_order", { ascending: true })
      : await supabase
          .from("products")
          .select(LIST_PRODUCT_SELECT)
          .order("sort_order", { ascending: true });

    if (!normalized.error && normalized.data?.length) {
      return (normalized.data as unknown as DbProduct[])
        .map(mapDbProductToProduct)
        .map((product) => enrichProductCategories(product, categories));
    }

    if (normalized.error && isSupabaseConnectivityError(normalized.error.message)) {
      logCatalogIssue(
        "Supabase is unreachable. Using local catalog fallback. Verify NEXT_PUBLIC_SUPABASE_URL in .env.local."
      );
      return enrichProducts(getFallbackProducts(), categories);
    }

    const minimal = hasDatasheetColumn
      ? await supabase
          .from("products")
          .select(MINIMAL_PRODUCT_SELECT)
          .order("sort_order", { ascending: true })
      : await supabase
          .from("products")
          .select(MINIMAL_PRODUCT_SELECT_NO_DATASHEET)
          .order("sort_order", { ascending: true });

    if (!minimal.error && minimal.data?.length) {
      return (minimal.data as unknown as DbProduct[])
        .map((row) =>
          mapDbProductToProduct({
            ...row,
            has_impa: false,
            price: 0,
            product_impa: [],
          })
        )
        .map((product) => enrichProductCategories(product, categories));
    }

    if (minimal.error && isSupabaseConnectivityError(minimal.error.message)) {
      return enrichProducts(getFallbackProducts(), categories);
    }

    const legacy = await supabase
      .from("products")
      .select("id, name, category, description, image, sort_order")
      .order("sort_order", { ascending: true });

    if (!legacy.error && legacy.data?.length) {
      return (legacy.data as unknown as DbLegacyProduct[]).map(mapLegacyProduct);
    }

    return enrichProducts(getFallbackProducts(), categories);
  } catch {
    return enrichProducts(getFallbackProducts(), categories);
  }
});

async function fetchProductsByCategoryIds(categoryIds: string[]): Promise<Product[]> {
  if (!categoryIds.length) return [];

  const categories = await getCategories();

  if (!isSupabaseConfigured() || categoryIds.some((id) => id.startsWith("fallback-"))) {
    const slugById = new Map(categories.map((category) => [category.id, category.slug]));
    const targetSlugs = new Set(
      categoryIds
        .map((id) => slugById.get(id))
        .filter((slug): slug is string => Boolean(slug))
    );

    return dedupeProducts(
      getFallbackProducts().filter((product) => {
        if (product.categoryId && categoryIds.includes(product.categoryId)) return true;
        return product.categorySlug ? targetSlugs.has(product.categorySlug) : false;
      })
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const hasDatasheetColumn = await ensureDatasheetColumnKnown(supabase);

    const normalized = hasDatasheetColumn
      ? await supabase
          .from("products")
          .select(LIST_PRODUCT_SELECT_WITH_DATASHEET)
          .in("category_id", categoryIds)
          .order("sort_order", { ascending: true })
      : await supabase
          .from("products")
          .select(LIST_PRODUCT_SELECT)
          .in("category_id", categoryIds)
          .order("sort_order", { ascending: true });

    if (!normalized.error && normalized.data?.length) {
      return (normalized.data as unknown as DbProduct[])
        .map(mapDbProductToProduct)
        .map((product) => enrichProductCategories(product, categories));
    }

    if (normalized.error && isSupabaseConnectivityError(normalized.error.message)) {
      return getFallbackProductsByCategorySlug(
        categories.find((category) => category.id === categoryIds[0])?.slug ?? ""
      );
    }

    const minimal = hasDatasheetColumn
      ? await supabase
          .from("products")
          .select(MINIMAL_PRODUCT_SELECT)
          .in("category_id", categoryIds)
          .order("sort_order", { ascending: true })
      : await supabase
          .from("products")
          .select(MINIMAL_PRODUCT_SELECT_NO_DATASHEET)
          .in("category_id", categoryIds)
          .order("sort_order", { ascending: true });

    if (!minimal.error && minimal.data?.length) {
      return (minimal.data as unknown as DbProduct[])
        .map((row) =>
          mapDbProductToProduct({
            ...row,
            has_impa: false,
            price: 0,
            product_impa: [],
          })
        )
        .map((product) => enrichProductCategories(product, categories));
    }

    if (minimal.error && isSupabaseConnectivityError(minimal.error.message)) {
      return getFallbackProductsByCategorySlug(
        categories.find((category) => category.id === categoryIds[0])?.slug ?? ""
      );
    }
  } catch {
    return getFallbackProductsByCategorySlug(
      categories.find((category) => category.id === categoryIds[0])?.slug ?? ""
    );
  }

  return [];
}

export const getProductsByCategorySlug = cache(async (slug: string): Promise<Product[]> => {
  noStore();

  const normalizedSlug = slug.trim().toLowerCase();
  const category = await getCategoryBySlug(normalizedSlug);
  if (!category) return [];

  if (category.id.startsWith("fallback-")) {
    return getFallbackProductsByCategorySlug(normalizedSlug);
  }

  if (isSupabaseConfigured() && !category.id.startsWith("fallback-")) {
    try {
      const allCategories = await getCategories();
      const descendantIds = getDescendantCategoryIds(allCategories, category.id, true);
      return fetchProductsByCategoryIds(descendantIds);
    } catch {
      return [];
    }
  }

  const products = await getProducts();
  return products.filter(
    (product) =>
      product.categorySlug === normalizedSlug ||
      slugify(product.category) === normalizedSlug ||
      product.rootCategoryName?.toLowerCase() === normalizedSlug
  );
});

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  noStore();

  const normalizedSlug = slug.trim().toLowerCase();

  if (!isSupabaseConfigured()) {
    return null;
  }

  const categories = await getCategories();

  try {
    const supabase = await createSupabaseServerClient();
    const hasDatasheetColumn = await ensureDatasheetColumnKnown(supabase);

    const normalized = hasDatasheetColumn
      ? await supabase
          .from("products")
          .select(NORMALIZED_PRODUCT_SELECT)
          .eq("slug", normalizedSlug)
          .maybeSingle()
      : await supabase
          .from("products")
          .select(NORMALIZED_PRODUCT_SELECT_NO_DATASHEET)
          .eq("slug", normalizedSlug)
          .maybeSingle();

    if (!normalized.error && normalized.data) {
      return enrichProductCategories(
        mapDbProductToProduct(normalized.data as unknown as DbProduct),
        categories
      );
    }

    const minimal = hasDatasheetColumn
      ? await supabase
          .from("products")
          .select(MINIMAL_PRODUCT_SELECT)
          .eq("slug", normalizedSlug)
          .maybeSingle()
      : await supabase
          .from("products")
          .select(MINIMAL_PRODUCT_SELECT_NO_DATASHEET)
          .eq("slug", normalizedSlug)
          .maybeSingle();

    if (!minimal.error && minimal.data) {
      const row = minimal.data as unknown as DbProduct;
      return enrichProductCategories(
        mapDbProductToProduct({
          ...row,
          has_impa: false,
          price: 0,
          product_impa: [],
        }),
        categories
      );
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

export const getRelatedProducts = cache(
  async (product: Product, limit = 4): Promise<Product[]> => {
    noStore();

    if (!product.categoryId) {
      const categorySlug = product.categorySlug ?? slugify(product.category);
      if (!categorySlug) return [];
      const categoryProducts = await getProductsByCategorySlug(categorySlug);
      return categoryProducts
        .filter(
          (item) =>
            item.slug !== product.slug &&
            (product.id ? item.id !== product.id : item.name !== product.name)
        )
        .slice(0, limit);
    }

    const categories = await getCategories();
    const categoryProducts = await fetchProductsByCategoryIds([product.categoryId]);

    return categoryProducts
      .filter(
        (item) =>
          item.slug !== product.slug &&
          (product.id ? item.id !== product.id : item.name !== product.name)
      )
      .slice(0, limit);
  }
);

export async function getAdminProducts(): Promise<DbProduct[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createSupabaseServerClient();
  const hasDatasheetColumn = await ensureDatasheetColumnKnown(supabase);
  const { data, error } = hasDatasheetColumn
    ? await supabase
        .from("products")
        .select(NORMALIZED_PRODUCT_SELECT)
        .order("sort_order", { ascending: true })
    : await supabase
        .from("products")
        .select(NORMALIZED_PRODUCT_SELECT_NO_DATASHEET)
        .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return data as unknown as DbProduct[];
}
