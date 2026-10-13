import { drivePdfAvailable, drivePreviewResponse } from "@/lib/datasheet-fetch";
import { buildDatasheetViewerHtml } from "@/lib/datasheet-viewer-html";
import { extractGoogleDriveFileId } from "@/lib/image-url";

export const dynamic = "force-dynamic";

/** HTML embed for modal iframe — PDF.js in-page or Drive preview fallback. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const src = searchParams.get("src")?.trim();

  if (!src) {
    return new Response("Missing src parameter.", { status: 400 });
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(src);
  } catch {
    return new Response("Invalid src parameter.", { status: 400 });
  }

  const forcePreview = searchParams.get("fallback") === "preview";
  const driveId = extractGoogleDriveFileId(decoded);
  if (driveId && (forcePreview || !(await drivePdfAvailable(driveId)))) {
    return drivePreviewResponse(driveId);
  }

  const html = buildDatasheetViewerHtml(decoded);
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": "inline",
      "Cache-Control": "no-store",
    },
  });
}
