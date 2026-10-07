const DEFAULT_PRODUCT_IMAGE = "/products/valves.png";

/** File id from a shared Google Drive link (`/file/d/…/view`). */
export function extractGoogleDriveFileId(url: string): string | null {
  const match = String(url).match(/\/file\/d\/([^/]+)/i);
  return match?.[1] ?? null;
}

/**
 * Turn a Drive share link into a URL browsers and Next.js can load as an image.
 * The file must be shared as “Anyone with the link”.
 */
export function isSupabaseStoragePublicUrl(url: string): boolean {
  return String(url).includes("/storage/v1/object/public/");
}

export function resolveProductImageUrl(
  url: string | null | undefined,
  fallback = DEFAULT_PRODUCT_IMAGE
): string {
  const trimmed = String(url ?? "").trim();
  if (!trimmed) return fallback;
  if (trimmed.startsWith("/")) return trimmed;
  if (isSupabaseStoragePublicUrl(trimmed)) return trimmed;

  const driveId = extractGoogleDriveFileId(trimmed);
  if (driveId) {
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w1200`;
  }

  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  return fallback;
}

function isPdfUrl(url: string) {
  return /\.pdf(\?|#|$)/i.test(url);
}

/**
 * URL for in-modal viewing (no download). Drive uses Google preview;
 * hosted PDFs use Google Docs viewer embed.
 */
export function resolveDatasheetEmbedUrl(
  url: string | null | undefined
): string | null {
  const trimmed = String(url ?? "").trim();
  if (!trimmed) return null;

  const drivePreview = resolveGoogleDrivePreviewUrl(trimmed);
  if (drivePreview) return drivePreview;

  if (/^https?:\/\//i.test(trimmed) && (isPdfUrl(trimmed) || isSupabaseStoragePublicUrl(trimmed))) {
    return `https://docs.google.com/gview?url=${encodeURIComponent(trimmed)}&embedded=true`;
  }

  return trimmed;
}

export function isGoogleDriveImage(url: string): boolean {
  return /drive\.google\.com/i.test(url);
}

/** Embed URL for Google Drive files (PDF/image) inside an iframe modal. */
export function resolveGoogleDrivePreviewUrl(
  url: string | null | undefined
): string | null {
  const trimmed = String(url ?? "").trim();
  if (!trimmed) return null;

  const driveId = extractGoogleDriveFileId(trimmed);
  if (driveId) {
    return `https://drive.google.com/file/d/${driveId}/preview`;
  }

  if (/drive\.google\.com\/file\/d\/[^/]+\/preview/i.test(trimmed)) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  return null;
}
