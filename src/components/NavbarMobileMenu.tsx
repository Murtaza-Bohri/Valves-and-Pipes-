"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { NavbarCategoryMenu } from "@/components/NavbarCategoryMenu";
import { NavbarSearch } from "@/components/NavbarSearch";
import type { StoreCategory } from "@/lib/products";

const navLinks = [
  { href: "/about", label: "About" },
  { href: "/experience", label: "Experience" },
  { href: "/contact", label: "Contact" },
];

type NavbarMobileMenuProps = {
  open: boolean;
  onClose: () => void;
  categories: StoreCategory[];
};

export function NavbarMobileMenu({
  open,
  onClose,
  categories,
}: NavbarMobileMenuProps) {
  const [productsOpen, setProductsOpen] = useState(true);
  const pathname = usePathname();
  const previousPathRef = useRef(pathname);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (previousPathRef.current === pathname) return;
    previousPathRef.current = pathname;
    onClose();
  }, [pathname, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-[#141414]/50 md:hidden"
            onClick={onClose}
          />
          <motion.div
            id="mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Main menu"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed inset-y-0 right-0 z-[70] flex w-[min(100vw,320px)] flex-col border-l border-[#e8e8e8] bg-white shadow-xl md:hidden"
          >
            <div className="flex items-center justify-between border-b border-[#e8e8e8] px-4 py-3">
              <span className="text-xs font-semibold tracking-[0.18em] text-[#141414] uppercase">
                Menu
              </span>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-[#141414] hover:bg-[#f7f7f7]"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-[#e8e8e8] px-4 py-3">
              <NavbarSearch solid mobile onNavigate={onClose} />
            </div>

            <nav
              className="flex-1 overflow-y-auto px-2 py-3"
              aria-label="Mobile navigation"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className="block rounded-sm px-3 py-3 text-sm font-semibold tracking-[0.12em] text-[#141414] uppercase hover:bg-[#f7f7f7] hover:text-[#bd1115]"
                >
                  {link.label}
                </Link>
              ))}

              <div className="mt-1 border-t border-[#f0f0f0] pt-2">
                <button
                  type="button"
                  onClick={() => setProductsOpen((value) => !value)}
                  className="flex w-full items-center justify-between rounded-sm px-3 py-3 text-left text-sm font-semibold tracking-[0.12em] text-[#141414] uppercase hover:bg-[#f7f7f7]"
                  aria-expanded={productsOpen}
                >
                  Products
                  <ChevronDown
                    className={`h-4 w-4 text-[#bd1115] transition-transform ${
                      productsOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {productsOpen ? (
                  <div className="pb-2 pl-1">
                    <Link
                      href="/products"
                      onClick={onClose}
                      className="block px-3 py-2.5 text-sm font-semibold text-[#bd1115] hover:bg-[#f8e8e8]"
                    >
                      All products
                    </Link>
                    <Link
                      href="/categories"
                      onClick={onClose}
                      className="block px-3 py-2.5 text-sm text-[#141414] hover:bg-[#f7f7f7] hover:text-[#bd1115]"
                    >
                      All categories
                    </Link>
                    <NavbarCategoryMenu categories={categories} onNavigate={onClose} />
                  </div>
                ) : null}
              </div>
            </nav>

            <div className="border-t border-[#e8e8e8] p-4">
              <Link
                href="/contact"
                onClick={onClose}
                className="block w-full bg-[#bd1115] px-4 py-3 text-center text-xs font-semibold tracking-[0.14em] text-white uppercase hover:bg-[#9a0e12]"
              >
                Get in touch
              </Link>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
