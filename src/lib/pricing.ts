import type { DbProduct, DbProductImpa } from "@/types/database";
import type { Product } from "@/lib/products";
import { resolveProductImageUrl } from "@/lib/image-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export function getDefaultImpaEntry(
  entries: DbProductImpa[] | undefined
): DbProductImpa | undefined {
  if (!entries?.length) return undefined;
  return entries.find((entry) => entry.is_default) ?? entries[0];
}

export function getProductDisplayPrice(product: {
  has_impa: boolean;
  price: number | null;
  product_impa?: DbProductImpa[];
}): number | undefined {
  if (product.has_impa) {
    const impa = getDefaultImpaEntry(product.product_impa);
    return impa ? Number(impa.price) : undefined;
  }

  return product.price != null ? Number(product.price) : undefined;
}

export function validateProductPricing(input: {
  hasImpa: boolean;
  price: number | null;
  impaCount: number;
}): string | null {
  if (input.hasImpa) {
    if (input.price != null) {
      return "IMPA products must not have a direct product price.";
    }
    if (input.impaCount < 1) {
      return "Add at least one IMPA entry before saving an IMPA product.";
    }
    return null;
  }

  if (input.price == null || !Number.isFinite(input.price) || input.price < 0) {
    return "Direct price is required for products without IMPA.";
  }

  return null;
}

export function mapDbProductToProduct(row: DbProduct): Product {
  const categoryName = row.categories?.name ?? "Pipes";
  const displayPrice = getProductDisplayPrice(row);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: categoryName as Product["category"],
    categoryId: row.category_id,
    categorySlug: row.categories?.slug,
    description: row.description,
    image: resolveProductImageUrl(row.main_image),
    datasheetUrl: row.datasheet_url ?? null,
    hasImpa: row.has_impa,
    price: row.has_impa ? undefined : displayPrice,
    displayPrice,
    impaEntries: row.product_impa?.map((entry) => ({
      id: entry.id,
      impaNumber: entry.impa_number,
      description: entry.item_description,
      uom: entry.inventory_uom,
      price: Number(entry.price),
      isDefault: entry.is_default,
    })),
  };
}

export type ResolvedCartPrice = {
  productId: string;
  impaId: string | null;
  impaNumber: string | null;
  itemDescription: string | null;
  inventoryUom: string | null;
  price: number;
  productName: string;
  imageUrl: string;
};

export async function resolveCartPrice(
  productId: string,
  impaId?: string | null
): Promise<ResolvedCartPrice | { error: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, main_image, has_impa, price, product_impa(id, impa_number, item_description, inventory_uom, price, is_default)"
    )
    .eq("id", productId)
    .single();

  if (error || !data) {
    return { error: "Product not found." };
  }

  const product = data as unknown as DbProduct;

  if (product.has_impa) {
    if (!impaId) {
      return { error: "Select an IMPA option for this product." };
    }

    const impa = product.product_impa?.find((entry) => entry.id === impaId);
    if (!impa) {
      return { error: "Invalid IMPA selection." };
    }

    return {
      productId: product.id,
      impaId: impa.id,
      impaNumber: impa.impa_number,
      itemDescription: impa.item_description,
      inventoryUom: impa.inventory_uom,
      price: Number(impa.price),
      productName: product.name,
      imageUrl: product.main_image,
    };
  }

  if (impaId) {
    return { error: "This product does not use IMPA pricing." };
  }

  if (product.price == null) {
    return { error: "Product price is not set." };
  }

  return {
    productId: product.id,
    impaId: null,
    impaNumber: null,
    itemDescription: null,
    inventoryUom: null,
    price: Number(product.price),
    productName: product.name,
    imageUrl: product.main_image,
  };
}
