import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { getAdminDisplayName, getAdminEmail } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Admin Login | Himmat",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f7f7] px-6 py-12">
      <div className="w-full max-w-md border border-[#e8e8e8] bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <Image
            src="/logo.png"
            alt="Himmat"
            width={160}
            height={33}
            className="mx-auto mb-4 h-7 w-auto"
          />
          <p className="text-xs font-semibold tracking-[0.22em] text-[#bd1115] uppercase">
            Admin panel
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[#141414]">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-[#6b6b6b]">
            Username:{" "}
            <span className="font-medium text-[#141414]">
              {getAdminDisplayName()}
            </span>
          </p>
          <p className="mt-1 text-sm text-[#6b6b6b]">
            Email:{" "}
            <span className="font-medium text-[#141414]">{getAdminEmail()}</span>
          </p>
        </div>

        <Suspense fallback={null}>
          <AdminLoginForm />
        </Suspense>

        <p className="mt-6 text-center text-sm text-[#6b6b6b]">
          <Link href="/" className="transition-colors hover:text-[#bd1115]">
            ← Back to website
          </Link>
        </p>
      </div>
    </div>
  );
}
