import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

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

function extensionForContentType(contentType, kind) {
  const type = String(contentType ?? "").toLowerCase();
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  if (type.includes("jpeg") || type.includes("jpg")) return "jpg";
  if (type.includes("pdf")) return "pdf";
  return kind === "datasheet" ? "pdf" : "jpg";
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
        `https://drive.google.com/uc?export=download&id=${driveId}`,
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

  if (isSupabaseStoragePublicUrl(source)) {
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

  const ext = extensionForContentType(binary.contentType, kind);
  const storagePath = `${slug}/${kind === "datasheet" ? "datasheet" : "main"}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_MEDIA_BUCKET)
    .upload(storagePath, binary.buffer, {
      contentType: binary.contentType,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Upload ${storagePath}: ${uploadError.message}`);
  }

  return getPublicStorageUrl(supabaseUrl, storagePath);
}
