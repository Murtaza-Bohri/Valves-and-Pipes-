import Link from "next/link";
import { Package, Database, Tags } from "lucide-react";
import { getProducts } from "@/lib/products-data";
import { getDatabaseStatus } from "@/lib/database-status";

export default async function AdminDashboardPage() {
  const [products, db] = await Promise.all([getProducts(), getDatabaseStatus()]);

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-semibold tracking-[0.22em] text-[#bd1115] uppercase">
          Dashboard
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#141414]">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-[#6b6b6b]">
          Manage Himmat website content from here.
        </p>
      </div>

      {!db.connected ? (
        <div className="border border-[#f0d4d4] bg-[#fff5f5] p-4 text-sm text-[#141414]">
          Supabase is not configured. Add your project keys to{" "}
          <code className="text-[#bd1115]">.env.local</code>.
        </div>
      ) : db.migrated ? (
        <div className="border border-[#d4edda] bg-[#f4fbf5] p-4 text-sm text-[#141414]">
          <p className="font-semibold text-[#1e7e34]">
            Database connected and migration complete
          </p>
          <ul className="mt-3 grid gap-1 text-[#6b6b6b] sm:grid-cols-2">
            <li>{db.counts.categories} categories</li>
            <li>{db.counts.products} products</li>
            <li>{db.counts.productImages} product images</li>
            <li>{db.counts.productImpa} IMPA entries</li>
            <li>{db.counts.orders} orders</li>
          </ul>
          {db.counts.productImpa === 0 ? (
            <p className="mt-3 text-[#bd1115]">
              Next step: add products in{" "}
              <Link href="/admin/products/new" className="font-semibold underline">
                Add product
              </Link>
              .
            </p>
          ) : null}
        </div>
      ) : (
        <div className="border border-[#fff3cd] bg-[#fffbf0] p-4 text-sm text-[#141414]">
          Supabase is connected but normalized tables are missing. Run the SQL
          files in <code className="text-[#bd1115]">supabase/sql/</code> (steps
          1–10) in the SQL Editor.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          href="/admin/categories"
          icon={Tags}
          title="Categories"
          description={`${db.counts.categories} categor${db.counts.categories === 1 ? "y" : "ies"} configured`}
        />
        <DashboardCard
          href="/admin/products/new"
          icon={Package}
          title="Add product"
          description="Create a new product with IMPA or direct pricing"
        />
        <DashboardCard
          href="/admin/products"
          icon={Package}
          title="Products"
          description={`${products.length} product${products.length === 1 ? "" : "s"} live on the website`}
        />
        <DashboardCard
          href="https://supabase.com/dashboard/project/xobmsnhnfnpkpluztkek/editor"
          icon={Database}
          title="Supabase tables"
          description="Open the database editor for orders and carts"
          external
        />
      </div>
    </div>
  );
}

function DashboardCard({
  href,
  icon: Icon,
  title,
  description,
  external,
}: {
  href: string;
  icon: typeof Package;
  title: string;
  description: string;
  external?: boolean;
}) {
  const className =
    "block border border-[#e8e8e8] bg-white p-6 transition-colors hover:border-[#bd1115]/30";

  const content = (
    <>
      <Icon className="mb-4 h-5 w-5 text-[#bd1115]" />
      <h2 className="font-[family-name:var(--font-display)] text-xl text-[#141414]">
        {title}
      </h2>
      <p className="mt-2 text-sm text-[#6b6b6b]">{description}</p>
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}
