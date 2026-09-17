import { NextResponse } from "next/server";
import { searchCatalog } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  if (query.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchCatalog(query.trim());
    return NextResponse.json({ results });
  } catch (error) {
    console.error("[search]", error);
    return NextResponse.json({ results: [], error: "Search failed." }, { status: 500 });
  }
}
