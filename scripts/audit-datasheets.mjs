#!/usr/bin/env node

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import {
  assertSupabaseReachable,
  getSupabaseServiceConfig,
  loadEnvLocal,
} from "./lib/load-env.mjs";

loadEnvLocal();

const __dirname = dirname(fileURLToPath(import.meta.url));

function extractDriveId(url) {
  const match = String(url).match(/\/file\/d\/([^/]+)/i);
  return match?.[1] ?? null;
}

async function checkDatasheet(sourceUrl) {
  const driveId = extractDriveId(sourceUrl);
  if (driveId) {
    const candidates = [
      `https://drive.usercontent.google.com/download?id=${driveId}&export=download&confirm=t`,
      `https://drive.google.com/uc?export=download&id=${driveId}&confirm=t`,
    ];
    for (const candidate of candidates) {
      const response = await fetch(candidate, { redirect: "follow" });
      const contentType = response.headers.get("content-type") ?? "";
      if (!response.ok || contentType.includes("text/html")) continue;
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength > 500) {
        return { status: "ok", detail: "PDF downloadable from Drive" };
      }
    }
    return {
      status: "problem",
      detail:
        "Drive link only (preview may show Google sign-in until file is shared publicly)",
    };
  }

  if (sourceUrl.includes("/storage/v1/object/public/product-media/")) {
    const response = await fetch(sourceUrl, { method: "HEAD" });
    if (response.ok) {
      return { status: "ok", detail: "Hosted on Supabase Storage" };
    }
    return { status: "problem", detail: `Supabase file missing (${response.status})` };
  }

  return { status: "problem", detail: "Unsupported or broken datasheet URL" };
}

await assertSupabaseReachable();
const { url, serviceRoleKey } = getSupabaseServiceConfig();
const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: products, error } = await supabase
  .from("products")
  .select("name, slug, datasheet_url, categories(name, slug)")
  .eq("is_active", true)
  .order("name");

if (error) {
  throw new Error(error.message);
}

const notShowing = [];
const working = [];

for (const product of products ?? []) {
  const datasheetUrl = String(product.datasheet_url ?? "").trim();
  const category =
    product.categories?.name ?? product.categories?.slug ?? "Uncategorized";
  const entry = {
    name: product.name,
    slug: product.slug,
    category,
    productUrl: `/products/${product.slug}`,
  };

  if (!datasheetUrl) {
    notShowing.push({
      ...entry,
      reason: "No datasheet URL saved",
    });
    continue;
  }

  const result = await checkDatasheet(datasheetUrl);
  if (result.status === "ok") {
    working.push({ ...entry, detail: result.detail });
  } else {
    notShowing.push({ ...entry, reason: result.detail });
  }
}

const outPath = join(__dirname, "..", "data", "datasheet-audit.json");
writeFileSync(
  outPath,
  `${JSON.stringify({ notShowing, working, generatedAt: new Date().toISOString() }, null, 2)}\n`
);

console.log(`Active products: ${products?.length ?? 0}`);
console.log(`Datasheets OK: ${working.length}`);
console.log(`Not showing reliably: ${notShowing.length}`);
console.log("");
console.log("Products where datasheet is NOT showing reliably:");
console.log("─".repeat(60));
for (const row of notShowing) {
  console.log(`• [${row.category}] ${row.name}`);
  console.log(`  ${row.reason}`);
  console.log(`  ${row.productUrl}`);
}

console.log("");
console.log(`Full report: ${outPath}`);
