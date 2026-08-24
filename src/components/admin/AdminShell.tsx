import Link from "next/link";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { signOutAdmin } from "@/app/admin/actions";
import { AdminNav } from "@/components/admin/AdminNav";

type AdminShellProps = {
  adminName: string;
  children: React.ReactNode;
};

export function AdminShell({ adminName, children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <div className="border-b border-[#e8e8e8] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-8">
          <Link href="/admin" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Himmat"
              width={120}
              height={25}
              className="h-6 w-auto"
            />
            <span className="text-xs font-semibold tracking-[0.18em] text-[#bd1115] uppercase">
              Admin
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-[#6b6b6b] sm:inline">
              {adminName}
            </span>
            <form action={signOutAdmin}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-[#141414] uppercase transition-colors hover:text-[#bd1115]"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit border border-[#e8e8e8] bg-white p-3">
          <AdminNav />
        </aside>

        <main>{children}</main>
      </div>
    </div>
  );
}
