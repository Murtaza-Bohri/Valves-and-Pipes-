#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import {
  assertSupabaseReachable,
  getSupabaseServiceConfig,
  loadEnvLocal,
} from "./lib/load-env.mjs";
import {
  ensureProductMediaBucket,
  mirrorProductMediaToStorage,
} from "./lib/product-media-storage.mjs";
import { resolveReadableExcelPath } from "./prepare-jis-excel.mjs";

loadEnvLocal();

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultSourcePath = join(
  __dirname,
  "..",
  "data",
  "Product List_Bronze Valve_JIS.xlsx"
);
const defaultUnlockedPath = join(
  __dirname,
  "..",
  "data",
  "Product List_Bronze Valve_JIS.unlocked.xlsx"
);
const args = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const exportOnly = process.argv.includes("--export-only");
const sourcePath = args[0] ?? defaultSourcePath;
const jsonOutPath = join(__dirname, "..", "data", "jis-bronze-valve-products.json");
const SORT_ORDER_BASE = 300;

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleCase(value) {
  return value
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeItemNumber(value) {
  const digits = String(value ?? "")
    .replace(/^IMPA/i, "")
    .replace(/\D/g, "");
  return digits || null;
}

function fallbackItemNumber(description, rowIndex) {
  const size = description.match(/,\s*(\d+)\s*MM/i)?.[1];
  const standard = description.match(/JIS\s+([A-Z0-9-]+)/i)?.[1]?.replace(/\s/g, "");
  if (size && standard) {
    return `${standard}${size}`.replace(/\W/g, "").toUpperCase();
  }
  const sizeOnly = description.match(/(\d+)\s*MM\s*$/i)?.[1];
  if (sizeOnly) return `SZ${sizeOnly}`;
  const slug = slugify(description).replace(/-/g, "").slice(0, 16).toUpperCase();
  return slug || `ROW${rowIndex}`;
}

function parsePrice(value) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  const text = String(value ?? "").trim();
  if (!text || /update|inquir|request|tbd|n\/a/i.test(text)) return null;
  const parsed = Number(text.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

const DEFAULT_PRODUCT_IMAGE = "/products/valves.png";

function extractDriveFileId(url) {
  const match = String(url).match(/\/file\/d\/([^/]+)/i);
  return match?.[1] ?? null;
}

function resolveProductImageUrl(url) {
  const trimmed = String(url ?? "").trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/")) return trimmed;
  const driveId = extractDriveFileId(trimmed);
  if (driveId) {
    return `https://drive.google.com/uc?export=view&id=${driveId}`;
  }
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return null;
}

function preferProductImage(current, candidate) {
  const resolved = resolveProductImageUrl(candidate);
  if (!resolved) return current;
  if (!current || current === DEFAULT_PRODUCT_IMAGE) return resolved;
  return current;
}

function preferFirstLink(current, candidate) {
  if (current) return current;
  const trimmed = String(candidate ?? "").trim();
  return trimmed || null;
}

function dedupeImpaEntries(impaList) {
  const byNumber = new Map();
  for (const entry of impaList) {
    const key = String(entry.number ?? "").trim();
    if (!key) continue;
    const existing = byNumber.get(key);
    if (!existing || (existing.price <= 0 && entry.price > 0)) {
      byNumber.set(key, entry);
    }
  }
  return [...byNumber.values()];
}

function stripTrailingSize(description) {
  let text = String(description ?? "").trim();
  text = text.replace(/,\s*\d+\s*MM\s*,/gi, ",");
  text = text.replace(/(F\d+\s+)(\d+)K-\d+MM\s*$/i, "$1$2KG");
  text = text.replace(/(F\d+\s+\d+KG)-\d+MM\s*$/i, "$1");
  text = text.replace(/(F\d+\s+\d+)K-\d+MM\s*$/i, "$1KG");
  text = text.replace(
    /(SVII-FCD-[A-Z0-9-]+)-\d+MM\s*,?\s*\d+K\s*$/i,
    "$1"
  );
  text = text.replace(/-\d+MM\s*,?\s*\d+K\s*$/i, "");
  text = text.replace(/\s+\d+(?:-\d+\/\d+|\d+\/\d+|\.\d+)?\s*(?:\"|IN)?\s*$/i, "");
  text = text.replace(/\s+\d+\s*MM(?:\s*-?\s*\d+K)?\s*$/i, "");
  text = text.replace(/\s+;\s*/g, " ");
  text = text.replace(/\s*\.\s+/g, ", ");
  return text.trim();
}

function inferMaterial(description, technical) {
  const desc = description.toUpperCase();
  if (/BRONZE/.test(desc)) return "bronze";
  if (/CAST\s*-?\s*IRON|C-IRON/.test(desc)) return "cast-iron";
  if (/CAST\s*-?\s*STEEL/.test(desc)) return "cast-steel";

  const blob = `${description} ${technical}`.toUpperCase();
  if (/BRONZE/.test(blob)) return "bronze";
  if (/CAST\s*-?\s*STEEL|CARBON\s+STEEL|\bWCB\b/.test(blob)) return "cast-steel";
  if (/CAST\s*-?\s*IRON|FC200/.test(blob)) return "cast-iron";
  return "bronze";
}

function inferValveFamily(description) {
  const d = description.toUpperCase();
  if (/AIR\s+VENT/.test(d)) return "storm";
  if (/SCREW\s+DOWN\s+CHECK/.test(d)) return "storm";
  if (/GATE\s+VALVE/.test(d)) return "gate";
  if (/GLOBE\s+VALVE/.test(d)) return "globe";
  if (/ANGLE\s+VALVE/.test(d)) return "angle";
  if (/HOSE/.test(d)) return "hose";
  if (/CHECK|STORM/.test(d)) return "storm";
  return "globe";
}

function inferCategorySlug(description, technical) {
  const family = inferValveFamily(description);
  const material = inferMaterial(description, technical);

  if (family === "storm") return "jis-storm-valves";

  if (family === "hose") {
    return material === "bronze"
      ? "jis-hose-valves-bronze"
      : "jis-hose-valves-cast-iron";
  }

  const materialSlug =
    material === "bronze"
      ? "bronze"
      : material === "cast-steel"
        ? "cast-steel"
        : "cast-iron";

  return `jis-${family}-valves-${materialSlug}`;
}

function findHeaderRow(rows) {
  for (let index = 0; index < rows.length; index += 1) {
    const joined = rows[index].map((cell) => String(cell).toUpperCase()).join("|");
    if (
      (joined.includes("ITEM") && joined.includes("DESCRIPTION")) ||
      (joined.includes("IMPA") && joined.includes("DESCRIPTION"))
    ) {
      return index;
    }
  }
  return 0;
}

function columnIndex(headers, candidates) {
  for (const candidate of candidates) {
    const index = headers.findIndex((header) => header.includes(candidate));
    if (index >= 0) return index;
  }
  return -1;
}

function parseSheetRows(sheetName, rows) {
  const headerRowIndex = findHeaderRow(rows);
  const headers = rows[headerRowIndex].map((cell) =>
    String(cell).trim().toUpperCase()
  );

  const itemCol = columnIndex(headers, ["IMPA", "ITEM NO", "ITEM"]);
  const descCol = columnIndex(headers, ["DESCRIPTION"]);
  const techCol = columnIndex(headers, ["TECHNICAL"]);
  const uomCol = columnIndex(headers, ["UOM", "INVENTORY"]);
  const priceCol = columnIndex(headers, ["PRICE"]);
  const sheetCol = columnIndex(headers, ["DATA SHEET"]);
  const photoCol = columnIndex(headers, ["PHOTO"]);

  const lineItems = [];

  for (let index = headerRowIndex + 1; index < rows.length; index += 1) {
    const row = rows[index];
    if (!row || row.every((cell) => !String(cell).trim())) continue;

    const description = String(row[descCol >= 0 ? descCol : 1] ?? "").trim();
    if (!description) continue;

    const technical = techCol >= 0 ? String(row[techCol] ?? "").trim() : "";
    const uom =
      uomCol >= 0 ? String(row[uomCol] ?? "PCS").trim() || "PCS" : "PCS";
    const parsedPrice = parsePrice(priceCol >= 0 ? row[priceCol] : row[3]);
    const price = parsedPrice == null ? 0 : parsedPrice;

    const itemNumber =
      normalizeItemNumber(itemCol >= 0 ? row[itemCol] : row[0]) ||
      fallbackItemNumber(description, index);
    const productBase = stripTrailingSize(description) || description;
    const groupKey = `${sheetName}::${productBase}::${technical}`;

    lineItems.push({
      sheetName,
      groupKey,
      productName: titleCase(productBase),
      categorySlug: inferCategorySlug(description, technical),
      itemNumber,
      itemDescription: description,
      technical,
      uom,
      price,
      priceInquiry: parsedPrice == null,
      datasheetUrl:
        sheetCol >= 0 ? String(row[sheetCol] ?? "").trim() : "",
      photoUrl:
        photoCol >= 0 ? String(row[photoCol] ?? "").trim() : "",
    });
  }

  return lineItems;
}

function parseWorkbook(path) {
  const workbook = XLSX.read(readFileSync(path));
  const lineItems = [];

  for (const sheetName of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      defval: "",
    });
    lineItems.push(...parseSheetRows(sheetName, rows));
  }

  const grouped = new Map();
  for (const item of lineItems) {
    if (!grouped.has(item.groupKey)) {
      grouped.set(item.groupKey, {
        name: item.productName,
        categorySlug: item.categorySlug,
        description: item.technical,
        image: DEFAULT_PRODUCT_IMAGE,
        datasheetUrl: null,
        impa: [],
      });
    }

    const product = grouped.get(item.groupKey);
    product.image = preferProductImage(product.image, item.photoUrl);
    product.datasheetUrl = preferFirstLink(product.datasheetUrl, item.datasheetUrl);

    product.impa.push({
      number: item.itemNumber,
      description: item.itemDescription,
      uom: item.uom,
      price: item.price,
      priceInquiry: item.priceInquiry,
    });
  }

  const mergedBySlug = new Map();
  for (const product of grouped.values()) {
    if (!product.impa.length) continue;
    const slug = slugify(product.name);
    const existing = mergedBySlug.get(slug);
    if (existing) {
      existing.impa = dedupeImpaEntries([...existing.impa, ...product.impa]);
      existing.image = preferProductImage(existing.image, product.image);
      existing.datasheetUrl = preferFirstLink(
        existing.datasheetUrl,
        product.datasheetUrl
      );
      continue;
    }
    product.impa = dedupeImpaEntries(product.impa);
    mergedBySlug.set(slug, product);
  }

  const products = [...mergedBySlug.values()].map((product) => ({
    name: product.name,
    categorySlug: product.categorySlug,
    description: product.description,
    image: product.image,
    datasheetUrl: product.datasheetUrl,
    impa: product.impa.map(({ number, description, uom, price, priceInquiry }) => ({
      number,
      description,
      uom,
      price,
      priceInquiry,
    })),
  }));

  return {
    sourceFile: path,
    defaultImage: DEFAULT_PRODUCT_IMAGE,
    products,
  };
}

async function seedProducts(seed) {
  await assertSupabaseReachable();
  const { url: supabaseUrl, serviceRoleKey } = getSupabaseServiceConfig();

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const categorySlugs = [...new Set(seed.products.map((product) => product.categorySlug))];
  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, slug, name")
    .in("slug", categorySlugs);

  if (categoriesError) {
    throw new Error(categoriesError.message);
  }

  const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));

  const { error: datasheetProbeError } = await supabase
    .from("products")
    .select("datasheet_url")
    .limit(0);

  const supportsDatasheetColumn = !(
    datasheetProbeError?.message?.includes("datasheet_url")
  );

  await ensureProductMediaBucket(supabase);

  let productsCreated = 0;
  let impaCreated = 0;
  let inquiryLines = 0;

  for (let index = 0; index < seed.products.length; index += 1) {
    const item = seed.products[index];
    const category = categoryBySlug.get(item.categorySlug);

    if (!category) {
      console.warn(`Skip "${item.name}": category "${item.categorySlug}" not found`);
      continue;
    }

    const slug = slugify(item.name);
    const description =
      item.description ||
      `${item.name}. JIS bronze valve with IMPA sizes; AED pricing or price on inquiry.`;

    let mainImage = item.image ?? seed.defaultImage;
    let datasheetUrl = item.datasheetUrl ?? null;

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

    if (supportsDatasheetColumn && datasheetUrl) {
      try {
        const storedSheet = await mirrorProductMediaToStorage(supabase, supabaseUrl, {
          productSlug: slug,
          sourceUrl: datasheetUrl,
          kind: "datasheet",
        });
        if (storedSheet) datasheetUrl = storedSheet;
      } catch (mirrorError) {
        console.warn(`  Datasheet upload failed for "${item.name}": ${mirrorError.message}`);
      }
    }

    const productRow = {
      name: item.name,
      slug,
      description,
      category_id: category.id,
      main_image: mainImage,
      sort_order: index + SORT_ORDER_BASE,
      has_impa: true,
      price: null,
      is_active: true,
    };

    if (supportsDatasheetColumn) {
      productRow.datasheet_url = datasheetUrl;
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .upsert(productRow, { onConflict: "slug" })
      .select("id, slug, name")
      .single();

    if (productError || !product) {
      throw new Error(`Failed product "${item.name}": ${productError?.message ?? "unknown"}`);
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

    const uniqueImpa = dedupeImpaEntries(item.impa);
    const impaRows = uniqueImpa.map((entry, impaIndex) => {
      if (entry.price <= 0) inquiryLines += 1;
      return {
        product_id: product.id,
        impa_number: String(entry.number),
        item_description: entry.description,
        inventory_uom: entry.uom ?? "PCS",
        price: entry.price,
        is_default: impaIndex === 0,
      };
    });

    const { error: impaError } = await supabase.from("product_impa").insert(impaRows);
    if (impaError) {
      throw new Error(`Failed IMPA for "${item.name}": ${impaError.message}`);
    }

    impaCreated += impaRows.length;
    console.log(`✓ ${product.name} (${impaRows.length} sizes)`);
  }

  console.log("");
  console.log(
    `Done: ${productsCreated} products, ${impaCreated} IMPA rows (${inquiryLines} priced on inquiry).`
  );
}

const readablePath = existsSync(sourcePath)
  ? resolveReadableExcelPath(sourcePath, defaultUnlockedPath)
  : resolveReadableExcelPath(
      join(
        process.env.USERPROFILE ?? "",
        "Downloads",
        "Product List_Bronze Valve_JIS.xlsx"
      ),
      defaultUnlockedPath
    );

const seed = parseWorkbook(readablePath);

writeFileSync(jsonOutPath, `${JSON.stringify(seed, null, 2)}\n`);
console.log(`Parsed ${seed.products.length} JIS bronze products from Excel.`);
console.log(`JSON written to ${jsonOutPath}`);

if (exportOnly) {
  process.exit(0);
}

await seedProducts(seed);
