"use client";

import { useEffect } from "react";
import { writeGuestCart } from "@/lib/cart";

export function ClearCartOnOrderConfirmation() {
  useEffect(() => {
    writeGuestCart([]);
  }, []);

  return null;
}
