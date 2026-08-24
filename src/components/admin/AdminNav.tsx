"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  PackagePlus,
  ShoppingBag,
  Tags,
  Users,
} from "lucide-react";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/products/new", label: "Add product", icon: PackagePlus },
  { href: "/admin/products", label: "Products", icon: Package, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/customers", label: "Customers", icon: Users },
];

export function AdminNav() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="space-y-1">
      {links.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(href, exact);

        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-[#f8e8e8] text-[#bd1115]"
                : "text-[#141414] hover:bg-[#f8e8e8] hover:text-[#bd1115]"
            }`}
          >
            <Icon className="h-4 w-4 text-[#bd1115]" />
            {label}
          </Link>
        );
      })}
      <Link
        href="/"
        className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-[#6b6b6b] transition-colors hover:bg-[#f7f7f7] hover:text-[#141414]"
      >
        View website
      </Link>
    </nav>
  );
}
