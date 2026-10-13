#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import {
  assertSupabaseReachable,
  getSupabaseServiceConfig,
} from "./lib/load-env.mjs";
import {
  ensureProductMediaBucket,
  isRemoteMediaUrl,
  isSupabaseStoragePublicUrl,
  mirrorProductMediaToStorage,
  productImageNeedsOptimization,
} from "./lib/product-media-storage.mjs";

await assertSupabaseReachable();
const { url: supabaseUrl, serviceRoleKey } = getSupabaseServiceConfig();

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { error: datasheetProbeError } = await supabase
  .from("products")
  .select("datasheet_url")
  .limit(0);

const hasDatasheetColumn = !datasheetProbeError?.message?.includes("datasheet_url");

const selectFields = hasDatasheetColumn
  ? "id, slug, name, main_image, datasheet_url"
  : "id, slug, name, main_image";

const { data: products, error } = await supabase
  .from("products")
  .select(selectFields)
  .order("sort_order", { ascending: true });

if (error) {
  throw new Error(error.message);
}

await ensureProductMediaBucket(supabase);

let updated = 0;

for (const product of products ?? []) {
  let mainImage = product.main_image;
  let datasheetUrl = hasDatasheetColumn ? product.datasheet_url : null;
  let changed = false;

    const shouldMirrorImage =
      mainImage &&
      productImageNeedsOptimization(mainImage) &&
      (isRemoteMediaUrl(mainImage) ||
        String(mainImage).startsWith("/") ||
        isSupabaseStoragePublicUrl(mainImage));

  if (shouldMirrorImage) {
    try {
      const stored = await mirrorProductMediaToStorage(supabase, supabaseUrl, {
        productSlug: product.slug,
        sourceUrl: mainImage,
        kind: "image",
      });
      if (stored && stored !== mainImage) {
        mainImage = stored;
        changed = true;
      }
    } catch (mirrorError) {
      console.warn(`  Image skip "${product.name}": ${mirrorError.message}`);
    }
  }

  if (
    hasDatasheetColumn &&
    datasheetUrl &&
    !isSupabaseStoragePublicUrl(datasheetUrl) &&
    isRemoteMediaUrl(datasheetUrl)
  ) {
    try {
      const stored = await mirrorProductMediaToStorage(supabase, supabaseUrl, {
        productSlug: product.slug,
        sourceUrl: datasheetUrl,
        kind: "datasheet",
      });
      if (stored && stored !== datasheetUrl) {
        datasheetUrl = stored;
        changed = true;
      }
    } catch (mirrorError) {
      console.warn(`  Datasheet skip "${product.name}": ${mirrorError.message}`);
    }
  }

  if (!changed) continue;

  const patch = { main_image: mainImage };
  if (hasDatasheetColumn) {
    patch.datasheet_url = datasheetUrl;
  }

  const { error: updateError } = await supabase
    .from("products")
    .update(patch)
    .eq("id", product.id);

  if (updateError) {
    throw new Error(`Update "${product.name}": ${updateError.message}`);
  }

  await supabase.from("product_images").delete().eq("product_id", product.id);
  await supabase.from("product_images").insert({
    product_id: product.id,
    image_url: mainImage,
    is_primary: true,
    sort_order: 0,
  });

  updated += 1;
  console.log(`✓ ${product.name}`);
}

console.log(`\nMirrored media for ${updated} product(s).`);
