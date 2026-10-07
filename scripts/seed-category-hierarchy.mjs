#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import {
  assertSupabaseReachable,
  getSupabaseServiceConfig,
} from "./lib/load-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const hierarchyPath = join(__dirname, "..", "data", "category-hierarchy.json");
const hierarchy = JSON.parse(readFileSync(hierarchyPath, "utf8"));

await assertSupabaseReachable();
const { url: supabaseUrl, serviceRoleKey } = getSupabaseServiceConfig();

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const slugToId = new Map();

async function upsertCategory(node, parentId = null) {
  const payload = {
    name: node.name,
    slug: node.slug,
    description: node.description ?? null,
    image: node.image ?? null,
    sort_order: node.sortOrder ?? 0,
    parent_id: parentId,
    is_active: true,
  };

  const existing = await supabase
    .from("categories")
    .select("id")
    .eq("slug", node.slug)
    .maybeSingle();

  if (existing.error) {
    throw new Error(existing.error.message);
  }

  let categoryId = existing.data?.id;

  if (categoryId) {
    const { error } = await supabase
      .from("categories")
      .update(payload)
      .eq("id", categoryId);

    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabase
      .from("categories")
      .insert(payload)
      .select("id")
      .single();

    if (error || !data) throw new Error(error?.message ?? "Insert failed");
    categoryId = data.id;
  }

  slugToId.set(node.slug, categoryId);
  console.log(`✓ ${node.name} (${node.slug})`);

  for (const child of node.children ?? []) {
    await upsertCategory(child, categoryId);
  }
}

console.log("Seeding category hierarchy...\n");

for (const root of hierarchy.roots) {
  await upsertCategory(root, null);
}

console.log("\nReassigning existing products to leaf categories...\n");

for (const [productSlug, categorySlug] of Object.entries(
  hierarchy.productCategoryBySlug
)) {
  const categoryId = slugToId.get(categorySlug);
  if (!categoryId) {
    console.warn(`Skip ${productSlug}: category ${categorySlug} not found`);
    continue;
  }

  const { error } = await supabase
    .from("products")
    .update({ category_id: categoryId })
    .eq("slug", productSlug);

  if (error) {
    console.warn(`Failed ${productSlug}: ${error.message}`);
  } else {
    console.log(`→ ${productSlug} → ${categorySlug}`);
  }
}

console.log("\nDone.");
