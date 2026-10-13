import { fetchDatasheetPdfFile } from "@/lib/datasheet-fetch";

export const dynamic = "force-dynamic";

/** PDF bytes only — loaded by PDF.js inside the modal viewer iframe. */
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

  const response = await fetchDatasheetPdfFile(decoded);
  if (response.ok) {
    const headers = new Headers(response.headers);
    headers.set("Content-Disposition", 'inline; filename="datasheet.pdf"');
    headers.set("X-Content-Type-Options", "nosniff");
    return new Response(response.body, { status: response.status, headers });
  }

  return response;
}
