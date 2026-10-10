"use client";

import { useEffect, useState } from "react";
import { resolveProductImageUrl } from "@/lib/image-url";

const FALLBACK_IMAGE = "/products/valves.png";

type ProductImageProps = {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  loading?: "lazy" | "eager";
};

/**
 * Product photos are pre-optimized WebP in Supabase Storage (see media:mirror).
 * Uses native <img> so nothing hits Vercel Image Optimization.
 */
export function ProductImage({
  src,
  alt,
  className,
  fill = false,
  priority,
  loading = "lazy",
  sizes = "100vw",
}: ProductImageProps) {
  const resolved = resolveProductImageUrl(src, FALLBACK_IMAGE);
  const [currentSrc, setCurrentSrc] = useState(resolved);

  useEffect(() => {
    setCurrentSrc(resolveProductImageUrl(src, FALLBACK_IMAGE));
  }, [src]);

  const handleError = () => {
    if (currentSrc !== FALLBACK_IMAGE) {
      setCurrentSrc(FALLBACK_IMAGE);
    }
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      loading={priority ? "eager" : loading}
      decoding="async"
      sizes={sizes}
      onError={handleError}
      className={
        fill ? `absolute inset-0 h-full w-full ${className ?? ""}` : className
      }
    />
  );
}
