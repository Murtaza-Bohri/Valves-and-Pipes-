"use client";

import { useEffect } from "react";
import { writeGuestCart } from "@/lib/cart";

type ClearCartOnOrderConfirmationProps = {
  shouldClear?: boolean;
};

export function ClearCartOnOrderConfirmation({
  shouldClear = false,
}: ClearCartOnOrderConfirmationProps) {
  useEffect(() => {
    if (shouldClear) {
      writeGuestCart([]);
    }
  }, [shouldClear]);

  return null;
}
