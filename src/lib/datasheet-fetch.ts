import {
  extractGoogleDriveFileId,
  isSupabaseStoragePublicUrl,
} from "@/lib/image-url";

const PRODUCT_MEDIA_BUCKET = "product-media";

function isAllowedDatasheetSource(url: string): boolean {
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return false;

  if (isSupabaseStoragePublicUrl(trimmed)) {
    return trimmed.includes(`/object/public/${PRODUCT_MEDIA_BUCKET}/`);
  }

  if (extractGoogleDriveFileId(trimmed)) return true;

  if (/^https:\/\/docs\.google\.com\//i.test(trimmed)) return true;

  return false;
}

function drivePreviewHtml(fileId: string) {
  const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Datasheet</title>
<style>html,body{margin:0;height:100%;background:#525659}iframe{border:0;width:100%;height:100%}</style>
</head>
<body>
<iframe src="${previewUrl}" allow="autoplay; fullscreen" title="Datasheet preview"></iframe>
</body>
</html>`;
}

function drivePreviewResponse(fileId: string) {
  return new Response(drivePreviewHtml(fileId), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": "inline",
      "Cache-Control": "public, max-age=300",
    },
  });
}

async function fetchGoogleDrivePdf(fileId: string): Promise<Response> {
  const candidates = [
    `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`,
    `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`,
    `https://drive.google.com/uc?export=view&id=${fileId}`,
  ];

  for (const url of candidates) {
    const response = await fetch(url, { redirect: "follow" });
    if (!response.ok) continue;

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("text/html")) continue;

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength < 256) continue;

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="datasheet.pdf"',
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  return drivePreviewResponse(fileId);
}

async function fetchRemotePdf(url: string): Promise<Response> {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Datasheet fetch failed (${response.status}).`);
  }

  const contentType = response.headers.get("content-type") ?? "application/pdf";
  if (contentType.includes("text/html")) {
    throw new Error("Datasheet URL returned HTML instead of a PDF.");
  }

  const buffer = await response.arrayBuffer();
  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType.includes("pdf")
        ? "application/pdf"
        : contentType,
      "Content-Disposition": 'inline; filename="datasheet.pdf"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}

/** Fetches a PDF for in-browser viewing (same-origin iframe). */
export async function fetchDatasheetForEmbed(sourceUrl: string): Promise<Response> {
  const trimmed = sourceUrl.trim();
  if (!isAllowedDatasheetSource(trimmed)) {
    return new Response("Invalid datasheet source.", { status: 400 });
  }

  const driveId = extractGoogleDriveFileId(trimmed);
  if (driveId) {
    return fetchGoogleDrivePdf(driveId);
  }

  try {
    return await fetchRemotePdf(trimmed);
  } catch {
    return new Response("Could not load datasheet file.", { status: 502 });
  }
}

export { isAllowedDatasheetSource };
