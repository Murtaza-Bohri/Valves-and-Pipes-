#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import {
  assertSupabaseReachable,
  getSupabaseServiceConfig,
} from "./lib/load-env.mjs";
import {
  ensureProductMediaBucket,
  mirrorProductMediaToStorage,
} from "./lib/product-media-storage.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = join(__dirname, "..", "data", "valve-products.json");
const descriptionsPath = join(__dirname, "..", "data", "valve-product-descriptions.json");
const impaSheetPath = join(__dirname, "..", "data", "valve-impa-sheet.json");
const seed = JSON.parse(readFileSync(dataPath, "utf8"));
const descriptions = JSON.parse(readFileSync(descriptionsPath, "utf8"));

await assertSupabaseReachable();
const { url: supabaseUrl, serviceRoleKey } = getSupabaseServiceConfig();

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildImpaDescription(productName, entry) {
  const raw = String(entry.description ?? "").trim();
  if (!raw) return productName;

  if (/HOSE VALVE/i.test(raw)) {
    return raw.toUpperCase();
  }

  if (/^\d+\s*MM$/i.test(raw)) {
    return `${productName} — ${raw.toUpperCase()}`;
  }

  return raw;
}

const { data: category, error: categoryError } = await supabase
  .from("categories")
  .select("id, name, slug")
  .eq("slug", seed.categorySlug)
  .maybeSingle();

if (categoryError || !category) {
  console.error(
    `Category "${seed.categorySlug}" not found. Run SQL steps 1-12 first.`
  );
  process.exit(1);
}

const { error: removePlaceholderError } = await supabase
  .from("products")
  .delete()
  .eq("slug", "valves")
  .eq("name", "Valves");

if (removePlaceholderError) {
  console.warn("Could not remove placeholder Valves product:", removePlaceholderError.message);
}

await ensureProductMediaBucket(supabase);

let productsCreated = 0;
let impaCreated = 0;
const impaSheet = [];

for (let index = 0; index < seed.products.length; index += 1) {
  const item = seed.products[index];
  const slug = slugify(item.name);
  const description =
    item.description ??
    descriptions[item.name] ??
    `${item.name}. Bronze industrial valve with IMPA-coded sizes and AED pricing.`;
  let mainImage = item.image ?? seed.defaultImage;
  const sortOrder = index + 1;

  try {
    const storedImage = await mirrorProductMediaToStorage(supabase, supabaseUrl, {
      productSlug: slug,
      sourceUrl: mainImage,
      kind: "image",
    });
    if (storedImage) mainImage = storedImage;
  } catch (mirrorError) {
    console.warn(`  Image upload failed for "${item.name}": ${mirrorError.message}`);
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .upsert(
      {
        name: item.name,
        slug,
        description,
        category_id: category.id,
        main_image: mainImage,
        sort_order: sortOrder,
        has_impa: true,
        price: null,
        is_active: true,
      },
      { onConflict: "slug" }
    )
    .select("id, slug, name")
    .single();

  if (productError || !product) {
    console.error(`Failed product "${item.name}":`, productError?.message);
    process.exit(1);
  }

  productsCreated += 1;

  await supabase.from("product_images").delete().eq("product_id", product.id);
  await supabase.from("product_images").insert({
    product_id: product.id,
    image_url: mainImage,
    is_primary: true,
    sort_order: 0,
  });

  await supabase.from("product_impa").delete().eq("product_id", product.id);

  const impaRows = item.impa.map((entry, impaIndex) => {
    const itemDescription = buildImpaDescription(item.name, entry);

    impaSheet.push({
      productName: item.name,
      impaNumber: entry.number,
      itemDescription,
      inventoryUom: entry.uom ?? "PCS",
      priceAed: entry.price,
    });

    return {
      product_id: product.id,
      impa_number: entry.number,
      item_description: itemDescription,
      inventory_uom: entry.uom ?? "PCS",
      price: entry.price,
      is_default: impaIndex === 0,
    };
  });

  const { error: impaError } = await supabase.from("product_impa").insert(impaRows);

  if (impaError) {
    console.error(`Failed IMPA for "${item.name}":`, impaError.message);
    process.exit(1);
  }

  impaCreated += impaRows.length;
  console.log(`✓ ${product.name} (${impaRows.length} IMPA)`);
}

console.log("");
console.log(`Done: ${productsCreated} products, ${impaCreated} IMPA rows in "${category.name}".`);

writeFileSync(
  impaSheetPath,
  `${JSON.stringify({ category: category.name, rows: impaSheet }, null, 2)}\n`
);
console.log(`IMPA sheet written to ${impaSheetPath}`);
