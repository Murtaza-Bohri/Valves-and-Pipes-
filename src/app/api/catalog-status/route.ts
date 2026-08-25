import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/admin";
import { getProducts, getStoreCategories } from "@/lib/products-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = isSupabaseConfigured();
  const [categories, products] = configured
    ? await Promise.all([getStoreCategories(), getProducts()])
    : [[], []];

  return NextResponse.json({
    supabaseConfigured: configured,
    categoryCount: categories.length,
    productCount: products.length,
    ok: configured && products.length > 0,
  });
}
