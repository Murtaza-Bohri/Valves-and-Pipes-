import Link from "next/link";

type CategoryBreadcrumbsProps = {
  items: Array<{ name: string; slug: string }>;
};

export function CategoryBreadcrumbs({ items }: CategoryBreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Category breadcrumb"
      className="mx-auto mb-6 max-w-6xl px-6 text-sm text-[#6b6b6b] sm:px-10"
    >
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link href="/" className="hover:text-[#bd1115]">
            Home
          </Link>
        </li>
        <li>/</li>
        <li>
          <Link href="/categories" className="hover:text-[#bd1115]">
            Categories
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={item.slug} className="flex items-center gap-2">
            <span>/</span>
            {index === items.length - 1 ? (
              <span className="font-semibold text-[#141414]">{item.name}</span>
            ) : (
              <Link href={`/categories/${item.slug}`} className="hover:text-[#bd1115]">
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
