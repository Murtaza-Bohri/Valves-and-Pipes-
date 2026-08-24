import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-[#e8e8e8] bg-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 sm:px-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Image
            src="/logo.png"
            alt={`${siteConfig.shortName} logo`}
            width={160}
            height={33}
            className="mb-5 h-7 w-auto"
          />
          <p className="max-w-sm text-sm leading-relaxed text-[#6b6b6b]">
            {siteConfig.name} — oilfields & marine valve and pipe suppliers in
            the UAE.
          </p>
        </div>

        <div>
          <p className="mb-4 text-xs font-semibold tracking-[0.22em] text-[#bd1115] uppercase">
            Contact
          </p>
          <ul className="space-y-3 text-sm text-[#6b6b6b]">
            <li>
              <a
                href={`mailto:${siteConfig.email}`}
                className="transition-colors hover:text-[#bd1115]"
              >
                {siteConfig.email}
              </a>
            </li>
            <li>
              <a
                href={`tel:${siteConfig.phone}`}
                className="transition-colors hover:text-[#bd1115]"
              >
                {siteConfig.phoneDisplay}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-4 text-xs font-semibold tracking-[0.22em] text-[#bd1115] uppercase">
            Policies
          </p>
          <ul className="space-y-3 text-sm text-[#6b6b6b]">
            <li>
              <Link
                href="/refund-policy"
                className="transition-colors hover:text-[#bd1115]"
              >
                Refund policy
              </Link>
            </li>
            <li>
              <Link
                href="/cancellations-and-returns"
                className="transition-colors hover:text-[#bd1115]"
              >
                Cancellation &amp; returns
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-4 text-xs font-semibold tracking-[0.22em] text-[#bd1115] uppercase">
            Explore
          </p>
          <ul className="space-y-3 text-sm text-[#6b6b6b]">
            <li>
              <Link href="/about" className="transition-colors hover:text-[#bd1115]">
                About
              </Link>
            </li>
            <li>
              <Link href="/products" className="transition-colors hover:text-[#bd1115]">
                Products
              </Link>
            </li>
            <li>
              <Link href="/experience" className="transition-colors hover:text-[#bd1115]">
                Experience
              </Link>
            </li>
            <li>
              <Link href="/contact" className="transition-colors hover:text-[#bd1115]">
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#e8e8e8] px-6 py-6 text-center text-xs tracking-[0.22em] text-[#6b6b6b] uppercase">
        © {new Date().getFullYear()} {siteConfig.name}
      </div>
    </footer>
  );
}
