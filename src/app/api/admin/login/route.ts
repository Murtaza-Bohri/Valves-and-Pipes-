import { NextResponse } from "next/server";
import { resolveAdminEmail } from "@/lib/admin";
import { createClient } from "@/lib/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const identifier = String(formData.get("identifier") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!identifier || !password) {
    return NextResponse.redirect(
      new URL("/admin/login?error=missing", request.url)
    );
  }

  const email = resolveAdminEmail(identifier);
  if (!email) {
    return NextResponse.redirect(
      new URL("/admin/login?error=invalid", request.url)
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Admin login failed:", error.message);
    return NextResponse.redirect(
      new URL("/admin/login?error=invalid", request.url)
    );
  }

  return NextResponse.redirect(new URL("/admin", request.url));
}
