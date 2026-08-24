import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/admin";

export type DatabaseStatus = {
  connected: boolean;
  migrated: boolean;
  counts: {
    categories: number;
    products: number;
    productImages: number;
    productImpa: number;
    orders: number;
  };
};

export async function getDatabaseStatus(): Promise<DatabaseStatus> {
  const empty: DatabaseStatus = {
    connected: false,
    migrated: false,
    counts: {
      categories: 0,
      products: 0,
      productImages: 0,
      productImpa: 0,
      orders: 0,
    },
  };

  if (!isSupabaseConfigured()) return empty;

  try {
    const supabase = await createSupabaseServerClient();

    const [categories, products, images, impa, orders] = await Promise.all([
      supabase.from("categories").select("*", { count: "exact", head: true }),
      supabase.from("products").select("category_id, main_image", { count: "exact", head: true }),
      supabase.from("product_images").select("*", { count: "exact", head: true }),
      supabase.from("product_impa").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }),
    ]);

    const migrated =
      !categories.error &&
      !products.error &&
      products.count !== null &&
      categories.count !== null;

    return {
      connected: true,
      migrated,
      counts: {
        categories: categories.count ?? 0,
        products: products.count ?? 0,
        productImages: images.count ?? 0,
        productImpa: impa.count ?? 0,
        orders: orders.count ?? 0,
      },
    };
  } catch {
    return empty;
  }
}
