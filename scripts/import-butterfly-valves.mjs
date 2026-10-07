#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";
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
const defaultXlsxPath = join(
  __dirname,
  "..",
  "data",
  "Product List - Butterfly Valves.xlsx"
);
const args = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const exportOnly = process.argv.includes("--export-only");
const xlsxPath = args[0] ?? defaultXlsxPath;
const jsonOutPath = join(__dirname, "..", "data", "butterfly-valve-products.json");

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

function normalizeImpa(value) {
  const digits = String(value ?? "")
    .replace(/^IMPA/i, "")
    .replace(/\D/g, "");
  return digits || null;
}

function parsePrice(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(value ?? "").trim();
  if (!text || /update/i.test(text)) return null;
  const parsed = Number(text.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

const DEFAULT_PRODUCT_IMAGE = "/products/valves.png";

function extractDriveFileId(url) {
  const match = String(url).match(/\/file\/d\/([^/]+)/i);
  return match?.[1] ?? null;
}

/** Shared Drive links must be converted; raw `/view` URLs are not image files. */
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

/** One row per IMPA number (Excel often repeats the same IMPA across sheets). */
function dedupeImpaEntries(impaList) {
  const byNumber = new Map();
  for (const entry of impaList) {
    const key = String(entry.number ?? "").trim();
    if (!key) continue;
    if (!byNumber.has(key)) {
      byNumber.set(key, entry);
    }
  }
  return [...byNumber.values()];
}

function stripTrailingSize(description) {
  let text = String(description ?? "").trim();
  text = text.replace(/\s+\d+(?:-\d+\/\d+|\d+\/\d+|\.\d+)?\s*(?:\"|IN)?\s*$/i, "");
  text = text.replace(/\s+\d+\s*MM(?:\s*-?\s*\d+K)?\s*$/i, "");
  text = text.replace(/\s+SERIES\s+\d+\s+\d+MM\s*$/i, " SERIES");
  text = text.replace(/\s+;\s*/g, " ");
  return text.trim();
}

function inferCategorySlug(sheetName, description, technical) {
  const desc = `${description} ${technical}`.toUpperCase();
  const sheet = sheetName.toUpperCase();

  if (/WAFER/.test(desc) || sheet.includes("WAFER")) {
    if (/EPDM/.test(desc) && /AL\+?BRONZE|AL\+Bronze/i.test(technical)) {
      return "butterfly-wafer-di-al-bronze-epdm";
    }
    if (/EPDM/.test(desc) || /EPDM/.test(technical)) {
      return "butterfly-wafer-di-ss304-epdm";
    }
    if (/PTFE|TEFLON/.test(desc) || /PTFE|TEFLON/.test(technical)) {
      return "butterfly-wafer-ss-ss304-ptfe";
    }
    return "butterfly-wafer-di-ss304-nbr";
  }

  if (/LUG/.test(desc)) {
    if (/PN6\b/.test(desc)) return "butterfly-lug-type-pn6";
    if (/PN10\b/.test(desc)) return "butterfly-lug-type-pn10";
    if (/PN16\b/.test(desc)) return "butterfly-lug-type-pn16";
    if (/\b5K\b/.test(desc)) return "butterfly-lug-type-5k";
    if (/\b10K\b/.test(desc)) return "butterfly-lug-type-10k";
    if (/SEMI LUG/.test(desc)) return "butterfly-semi-lug-type";
  }

  if (/DOUBLE FLANGE/.test(desc)) {
    if (/SHORT BODY/.test(desc)) return "butterfly-double-flange-short-body";
    return "butterfly-double-flange-long-body";
  }

  if (sheet.includes("DIN")) return "butterfly-valves";
  if (sheet.includes("JIS")) return "butterfly-valves";

  return "butterfly-valves";
}

function findHeaderRow(rows) {
  for (let index = 0; index < rows.length; index += 1) {
    const joined = rows[index].map((cell) => String(cell).toUpperCase()).join("|");
    if (joined.includes("IMPA") && joined.includes("DESCRIPTION")) {
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

  const impaCol = columnIndex(headers, ["IMPA"]);
  const descCol = columnIndex(headers, ["DESCRIPTION"]);
  const techCol = columnIndex(headers, ["TECHNICAL"]);
  const notesCol = columnIndex(headers, ["NOTES"]);
  const priceCol = columnIndex(headers, ["PRICE", "PRICES"]);
  const sheetCol = columnIndex(headers, ["DATA SHEET"]);
  const photoCol = columnIndex(headers, ["PHOTO"]);

  const lineItems = [];

  for (let index = headerRowIndex + 1; index < rows.length; index += 1) {
    const row = rows[index];
    if (!row || row.every((cell) => !String(cell).trim())) continue;

    const firstCell = String(row[impaCol] ?? row[0] ?? "").toUpperCase();
    if (firstCell.includes("IMPA NO")) continue;

    const description = String(row[descCol >= 0 ? descCol : 1] ?? "").trim();
    const technical = String(row[techCol >= 0 ? techCol : 2] ?? "").trim();
    const notes = notesCol >= 0 ? String(row[notesCol] ?? "").trim() : "";
    const price = parsePrice(priceCol >= 0 ? row[priceCol] : row[3]);

    if (!description) continue;

    const impaNumber = normalizeImpa(impaCol >= 0 ? row[impaCol] : row[0]);
    const productBase = stripTrailingSize(description) || description;
    const groupKey = `${sheetName}::${productBase}::${technical}`;

    lineItems.push({
      sheetName,
      groupKey,
      productName: titleCase(productBase),
      categorySlug: inferCategorySlug(sheetName, description, technical),
      impaNumber,
      itemDescription: description,
      technical,
      notes,
      price,
      datasheetUrl:
        sheetCol >= 0 ? String(row[sheetCol] ?? "").trim() : String(row[4] ?? "").trim(),
      photoUrl:
        photoCol >= 0 ? String(row[photoCol] ?? "").trim() : String(row[5] ?? "").trim(),
    });
  }

  return lineItems;
}

function parseWorkbook(path) {
  if (!existsSync(path)) {
    throw new Error(`Excel file not found: ${path}`);
  }

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
        description: [item.technical, item.notes].filter(Boolean).join(" "),
        image: DEFAULT_PRODUCT_IMAGE,
        datasheetUrl: null,
        impa: [],
      });
    }

    const product = grouped.get(item.groupKey);
    product.image = preferProductImage(product.image, item.photoUrl);
    product.datasheetUrl = preferFirstLink(product.datasheetUrl, item.datasheetUrl);
    if (item.price == null) continue;

    if (item.impaNumber) {
      product.impa.push({
        number: item.impaNumber,
        description: item.itemDescription,
        uom: "PCS",
        price: item.price,
      });
    } else {
      const syntheticImpa = slugify(item.itemDescription)
        .replace(/-/g, "")
        .slice(0, 12)
        .toUpperCase();
      product.impa.push({
        number: syntheticImpa || `BFV${product.impa.length + 1}`,
        description: item.itemDescription,
        uom: "PCS",
        price: item.price,
      });
    }
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
      if (!existing.description && product.description) {
        existing.description = product.description;
      }
      continue;
    }
    product.impa = dedupeImpaEntries(product.impa);
    mergedBySlug.set(slug, product);
  }

  const products = [...mergedBySlug.values()].map((product) => ({
    ...product,
    impa: dedupeImpaEntries(product.impa),
  }));

  return {
    sourceFile: path,
    defaultImage: "/products/valves.png",
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

  if (!supportsDatasheetColumn) {
    console.warn("");
    console.warn(
      "Note: products.datasheet_url column is missing. Run this in Supabase SQL Editor:"
    );
    console.warn(
      "  alter table public.products add column if not exists datasheet_url text;"
    );
    console.warn("Datasheet links are still saved in data/butterfly-valve-products.json.");
    console.warn("");
  }

  await ensureProductMediaBucket(supabase);

  let productsCreated = 0;
  let impaCreated = 0;

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
      `${item.name}. Butterfly valve with IMPA-coded sizes and AED pricing.`;

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
      sort_order: index + 100,
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
    const impaRows = uniqueImpa.map((entry, impaIndex) => ({
      product_id: product.id,
      impa_number: String(entry.number),
      item_description: entry.description,
      inventory_uom: entry.uom ?? "PCS",
      price: entry.price,
      is_default: impaIndex === 0,
    }));

    const { error: impaError } = await supabase.from("product_impa").insert(impaRows);
    if (impaError) {
      throw new Error(`Failed IMPA for "${item.name}": ${impaError.message}`);
    }

    impaCreated += impaRows.length;
    console.log(`✓ ${product.name} (${impaRows.length} IMPA)`);
  }

  console.log("");
  console.log(`Done: ${productsCreated} products, ${impaCreated} IMPA rows.`);
}

const seed = parseWorkbook(xlsxPath);

writeFileSync(jsonOutPath, `${JSON.stringify(seed, null, 2)}\n`);
console.log(`Parsed ${seed.products.length} butterfly products from Excel.`);
console.log(`JSON written to ${jsonOutPath}`);

if (exportOnly) {
  process.exit(0);
}

await seedProducts(seed);
