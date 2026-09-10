import Link from "next/link";
import type { StoreCategory } from "@/lib/products";

type NavbarCategoryMenuProps = {
  categories: StoreCategory[];
  onNavigate?: () => void;
};

export function NavbarCategoryMenu({
  categories,
  onNavigate,
}: NavbarCategoryMenuProps) {
  return (
    <nav aria-label="Product categories" className="py-1">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/categories/${category.slug}`}
          onClick={onNavigate}
          className="block px-4 py-2.5 text-sm text-[#141414] transition-colors hover:bg-[#f7f7f7] hover:text-[#bd1115]"
        >
          {category.name}
        </Link>
      ))}
    </nav>
  );
}
