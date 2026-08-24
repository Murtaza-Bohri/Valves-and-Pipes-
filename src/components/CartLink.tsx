"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { getCartCount, readGuestCart } from "@/lib/cart";

export function CartLink({ className = "" }: { className?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => setCount(getCartCount(readGuestCart()));
    update();
    window.addEventListener("himmat:cart-updated", update);
    return () => window.removeEventListener("himmat:cart-updated", update);
  }, []);

  return (
    <Link
      href="/cart"
      className={`relative inline-flex items-center gap-1.5 text-[13px] font-semibold tracking-[0.14em] uppercase transition-colors ${className}`}
      aria-label={`Cart${count ? `, ${count} items` : ""}`}
    >
      <ShoppingCart className="h-4 w-4" />
      <span className="hidden sm:inline">Cart</span>
      {count > 0 ? (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#bd1115] px-1.5 py-0.5 text-[10px] font-bold text-white">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
