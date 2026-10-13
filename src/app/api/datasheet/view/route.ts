import { fetchDatasheetForEmbed } from "@/lib/datasheet-fetch";

export const dynamic = "force-dynamic";

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

  return fetchDatasheetForEmbed(decoded);
}
