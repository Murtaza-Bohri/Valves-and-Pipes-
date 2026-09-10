"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { CartLink } from "@/components/CartLink";
import { NavbarCategoryMenu } from "@/components/NavbarCategoryMenu";
import type { StoreCategory } from "@/lib/products";

const navLinks = [
  { href: "/about", label: "About" },
  { href: "/experience", label: "Experience" },
  { href: "/contact", label: "Contact" },
];

type NavbarProps = {
  categories?: StoreCategory[];
};

export function Navbar({ categories = [] }: NavbarProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const productsRef = useRef<HTMLDivElement>(null);
  const solid = !isHome || scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!productsRef.current?.contains(event.target as Node)) {
        setProductsOpen(false);
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  const linkClass = solid
    ? "text-[#141414] hover:text-[#bd1115]"
    : "text-white/90 hover:text-white";

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`transition-all duration-300 ${
        solid
          ? "border-b border-black/5 bg-white/95 shadow-sm backdrop-blur-md"
          : "bg-transparent"
      } overflow-visible`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 sm:h-[72px] sm:px-8">
        <Link href="/" className="relative z-10">
          <Image
            src="/logo.png"
            alt="Himmat"
            width={140}
            height={29}
            className="h-6 w-auto sm:h-7"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.slice(0, 1).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-[13px] font-semibold tracking-[0.14em] uppercase transition-colors ${linkClass}`}
            >
              {link.label}
            </Link>
          ))}

          <div
            ref={productsRef}
            className="relative"
            onMouseEnter={() => setProductsOpen(true)}
            onMouseLeave={() => setProductsOpen(false)}
          >
            <button
              type="button"
              aria-expanded={productsOpen}
              aria-haspopup="true"
              onClick={() => setProductsOpen((value) => !value)}
              className={`inline-flex items-center gap-1.5 text-[13px] font-semibold tracking-[0.14em] uppercase transition-colors ${linkClass}`}
            >
              Products
              <ChevronDown
                className={`h-3.5 w-3.5 text-[#bd1115] transition-transform ${
                  productsOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {productsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="absolute left-0 top-full z-50 overflow-visible pt-3"
                >
                  <div className="min-w-[240px] max-w-[min(100vw-2rem,320px)] overflow-visible border border-[#e8e8e8] bg-white py-2 shadow-xl">
                    <Link
                      href="/products"
                      onClick={() => setProductsOpen(false)}
                      className="block px-4 py-2.5 text-sm font-semibold text-[#bd1115] transition-colors hover:bg-[#f8e8e8]"
                    >
                      All Products
                    </Link>
                    <NavbarCategoryMenu
                      categories={categories}
                      onNavigate={() => setProductsOpen(false)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {navLinks.slice(1).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-[13px] font-semibold tracking-[0.14em] uppercase transition-colors ${linkClass}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <CartLink className={linkClass} />
          <Link
            href="/contact"
            className={`hidden text-[13px] font-semibold tracking-[0.14em] uppercase transition-colors sm:inline-flex ${
              solid
                ? "bg-[#bd1115] px-4 py-2.5 text-white hover:bg-[#9a0e12]"
                : "text-white hover:text-white/80"
            }`}
          >
            Get in touch
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
