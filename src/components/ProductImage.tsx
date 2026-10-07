"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  isGoogleDriveImage,
  isSupabaseStoragePublicUrl,
  resolveProductImageUrl,
} from "@/lib/image-url";

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

export function ProductImage({
  src,
  alt,
  className,
  fill = false,
  sizes,
  priority,
  loading = "lazy",
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

  const useNativeImg =
    isGoogleDriveImage(currentSrc) ||
    isSupabaseStoragePublicUrl(currentSrc) ||
    currentSrc.startsWith("http");

  if (useNativeImg) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avoids Next/Image loader rejections (Event) on external URLs
      <img
        src={currentSrc}
        alt={alt}
        loading={priority ? "eager" : loading}
        decoding="async"
        onError={handleError}
        className={
          fill
            ? `absolute inset-0 h-full w-full ${className ?? ""}`
            : className
        }
      />
    );
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill={fill}
      sizes={sizes}
      priority={priority}
      loading={loading}
      className={className}
      onError={handleError}
    />
  );
}
