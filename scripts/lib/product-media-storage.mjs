import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

export const PRODUCT_MEDIA_BUCKET = "product-media";

function extractDriveFileId(url) {
  const match = String(url).match(/\/file\/d\/([^/]+)/i);
  return match?.[1] ?? null;
}

export function isSupabaseStoragePublicUrl(url) {
  return String(url).includes("/storage/v1/object/public/product-media/");
}

export function isRemoteMediaUrl(url) {
  const value = String(url ?? "").trim();
  return /^https?:\/\//i.test(value);
}

const PRODUCT_IMAGE_MAX_WIDTH = 1200;
const PRODUCT_IMAGE_WEBP_QUALITY = 82;

export function productImageNeedsOptimization(url) {
  if (!url) return true;
  if (!isSupabaseStoragePublicUrl(url)) return true;
  return !String(url).includes("/main.webp");
}

async function optimizeProductImageBuffer(buffer) {
  return sharp(buffer)
    .rotate()
    .resize(PRODUCT_IMAGE_MAX_WIDTH, PRODUCT_IMAGE_MAX_WIDTH, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: PRODUCT_IMAGE_WEBP_QUALITY, effort: 4 })
    .toBuffer();
}

async function fetchDriveBinary(sourceUrl, kind) {
  const driveId = extractDriveFileId(sourceUrl);
  const candidates = [];

  if (driveId) {
    if (kind === "image") {
      candidates.push(
        `https://drive.google.com/uc?export=view&id=${driveId}`,
        `https://drive.google.com/thumbnail?id=${driveId}&sz=w1600`
      );
    } else {
      candidates.push(
        `https://drive.usercontent.google.com/download?id=${driveId}&export=download&confirm=t`,
        `https://drive.google.com/uc?export=download&id=${driveId}&confirm=t`,
        `https://drive.google.com/uc?export=view&id=${driveId}`
      );
    }
  }

  if (/^https?:\/\//i.test(sourceUrl)) {
    candidates.push(sourceUrl);
  }

  for (const url of candidates) {
    const response = await fetch(url, { redirect: "follow" });
    if (!response.ok) continue;

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("text/html")) continue;

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 256) continue;

    return { buffer, contentType };
  }

  throw new Error(`Could not download media from ${sourceUrl}`);
}

async function loadLocalPublicFile(relativePath) {
  const normalized = relativePath.replace(/^\/+/, "");
  const absolutePath = join(process.cwd(), "public", normalized);
  if (!existsSync(absolutePath)) {
    throw new Error(`Local file not found: public/${normalized}`);
  }

  const buffer = readFileSync(absolutePath);
  const ext = normalized.split(".").pop()?.toLowerCase() ?? "png";
  const contentType =
    ext === "png"
      ? "image/png"
      : ext === "webp"
        ? "image/webp"
        : ext === "jpg" || ext === "jpeg"
          ? "image/jpeg"
          : "application/octet-stream";

  return { buffer, contentType };
}

export async function ensureProductMediaBucket(supabase) {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    throw new Error(`Storage buckets: ${listError.message}`);
  }

  if (buckets?.some((bucket) => bucket.name === PRODUCT_MEDIA_BUCKET)) {
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(
    PRODUCT_MEDIA_BUCKET,
    { public: true, fileSizeLimit: 52_428_800 }
  );

  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    throw new Error(`Create bucket: ${createError.message}`);
  }
}

export function getPublicStorageUrl(supabaseUrl, storagePath) {
  const base = String(supabaseUrl).replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${PRODUCT_MEDIA_BUCKET}/${storagePath}`;
}

/**
 * Copies a Drive/local/http source into Supabase Storage and returns the public URL.
 */
export async function mirrorProductMediaToStorage(
  supabase,
  supabaseUrl,
  { productSlug, sourceUrl, kind }
) {
  const slug = String(productSlug).trim();
  const source = String(sourceUrl ?? "").trim();
  if (!slug || !source) return null;

  if (kind === "image" && isSupabaseStoragePublicUrl(source) && source.includes("/main.webp")) {
    return source;
  }

  let binary;
  if (source.startsWith("/")) {
    binary = await loadLocalPublicFile(source);
  } else if (isRemoteMediaUrl(source)) {
    binary = await fetchDriveBinary(source, kind);
  } else {
    return null;
  }

  let uploadBuffer = binary.buffer;
  let contentType = binary.contentType;
  let storagePath;

  if (kind === "image") {
    uploadBuffer = await optimizeProductImageBuffer(binary.buffer);
    contentType = "image/webp";
    storagePath = `${slug}/main.webp`;
  } else {
    const type = String(binary.contentType ?? "").toLowerCase();
    const ext = type.includes("pdf") ? "pdf" : "pdf";
    storagePath = `${slug}/datasheet.${ext}`;
    contentType = type.includes("pdf") ? "application/pdf" : binary.contentType;
  }

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_MEDIA_BUCKET)
    .upload(storagePath, uploadBuffer, {
      contentType,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Upload ${storagePath}: ${uploadError.message}`);
  }

  return getPublicStorageUrl(supabaseUrl, storagePath);
}
