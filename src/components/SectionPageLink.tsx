import Link from "next/link";

type SectionPageLinkProps = {
  href: string;
  label: string;
  variant?: "light" | "dark";
};

export function SectionPageLink({
  href,
  label,
  variant = "light",
}: SectionPageLinkProps) {
  const classes =
    variant === "dark"
      ? "border-white/30 text-white hover:bg-white hover:text-[#141414]"
      : "border-[#bd1115]/30 text-[#bd1115] hover:bg-[#bd1115] hover:text-white";

  return (
    <div className="mt-10 flex justify-center">
      <Link
        href={href}
        className={`inline-flex items-center border px-6 py-2.5 text-xs font-semibold tracking-[0.16em] uppercase transition-colors ${classes}`}
      >
        {label}
      </Link>
    </div>
  );
}
