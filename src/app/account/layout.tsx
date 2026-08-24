import { redirect } from "next/navigation";
import Link from "next/link";
import { getCustomerSession, signOutCustomer } from "@/app/auth/actions";
import { PageLayout } from "@/components/PageLayout";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCustomerSession();

  if (!session) {
    redirect("/login?returnTo=/account");
  }

  return (
    <PageLayout className="bg-[#f7f7f7]">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold tracking-[0.22em] text-[#bd1115] uppercase">
              My account
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#141414]">
              {session.profile?.full_name ?? session.user.email}
            </h1>
          </div>
          <form action={signOutCustomer}>
            <button
              type="submit"
              className="text-xs font-semibold tracking-[0.14em] text-[#bd1115] uppercase hover:underline"
            >
              Logout
            </button>
          </form>
        </div>

        <nav className="mb-8 flex flex-wrap gap-2 border-b border-[#e8e8e8] pb-4">
          {[
            { href: "/account", label: "Profile" },
            { href: "/account/orders", label: "Orders" },
            { href: "/account/addresses", label: "Addresses" },
            { href: "/track-order", label: "Track order" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="border border-[#e0e0e0] bg-white px-4 py-2 text-xs font-semibold tracking-[0.12em] text-[#141414] uppercase hover:border-[#bd1115] hover:text-[#bd1115]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {children}
      </div>
    </PageLayout>
  );
}
