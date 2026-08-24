export const ALL_PRODUCTS_CATEGORY = "All" as const;

export type ProductCategory = string;

export const PRODUCT_CATEGORY_EVENT = "himmat:product-category";

export type StoreCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string | null;
};

export type ProductImpa = {
  id: string;
  impaNumber: string;
  description: string;
  uom: string;
  price: number;
  isDefault: boolean;
};

export type Product = {
  id?: string;
  name: string;
  slug?: string;
  category: ProductCategory;
  categoryId?: string;
  categorySlug?: string;
  description: string;
  image: string;
  hasImpa?: boolean;
  price?: number;
  displayPrice?: number;
  impaEntries?: ProductImpa[];
};

export type CartLine = {
  productId: string;
  productName: string;
  imageUrl: string;
  quantity: number;
  price: number;
  impaId?: string | null;
  impaNumber?: string | null;
  inventoryUom?: string | null;
  itemDescription?: string | null;
};

const CATEGORY_IMAGE_BY_SLUG: Record<string, string> = {
  pipes: "/products/pipes.png",
  valves: "/products/valves.png",
};

export function getCategoryImage(slug: string, image?: string | null) {
  if (image) return image;
  return CATEGORY_IMAGE_BY_SLUG[slug.trim().toLowerCase()] ?? "/products/pipes.png";
}

/** Static category browse tiles when Supabase categories are not loaded yet. */
export const fallbackCategories: StoreCategory[] = [
  {
    id: "fallback-pipes",
    name: "Pipes",
    slug: "pipes",
    description:
      "Industrial pipe supply for oil & gas, refining, petrochemical, and utility projects.",
    image: "/products/pipes.png",
  },
  {
    id: "fallback-valves",
    name: "Valves",
    slug: "valves",
    description:
      "Comprehensive valve solutions for upstream and downstream oil & gas operations.",
    image: "/products/valves.png",
  },
];

export function setProductCategory(category: ProductCategory) {
  window.dispatchEvent(
    new CustomEvent(PRODUCT_CATEGORY_EVENT, { detail: category })
  );
}

export function formatPrice(amount: number) {
  return `AED ${amount.toFixed(2)}`;
}

export function buildCategoryFilterList(categories: StoreCategory[]) {
  return [ALL_PRODUCTS_CATEGORY, ...categories.map((category) => category.name)];
}
