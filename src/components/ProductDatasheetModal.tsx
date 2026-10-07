"use client";

import { useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import { resolveDatasheetEmbedUrl } from "@/lib/image-url";

type ProductDatasheetModalProps = {
  open: boolean;
  title: string;
  /** Raw URL from database (Supabase Storage, Drive, etc.) */
  fileUrl: string;
  onClose: () => void;
};

export function ProductDatasheetModal({
  open,
  title,
  fileUrl,
  onClose,
}: ProductDatasheetModalProps) {
  const titleId = useId();
  const [loading, setLoading] = useState(true);

  const embedUrl = resolveDatasheetEmbedUrl(fileUrl);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    setLoading(true);
    const loadingTimer = window.setTimeout(() => setLoading(false), 4000);

    return () => {
      clearTimeout(loadingTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, fileUrl]);

  if (!open || !embedUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close datasheet"
        className="absolute inset-0 bg-[#141414]/60"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-[min(90vh,820px)] w-full max-w-5xl flex-col border border-[#e8e8e8] bg-white shadow-xl"
      >
        <div className="flex items-center justify-between gap-4 border-b border-[#e8e8e8] px-4 py-3 sm:px-5">
          <h2
            id={titleId}
            className="font-[family-name:var(--font-display)] text-lg tracking-wide text-[#141414] sm:text-xl"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex shrink-0 items-center justify-center p-2 text-[#141414] hover:bg-[#f7f7f7]"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="relative min-h-0 flex-1 bg-[#525659]">
          {loading ? (
            <p className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#f7f7f7] text-sm text-[#6b6b6b]">
              Loading data sheet…
            </p>
          ) : null}

          <iframe
            key={embedUrl}
            title={`${title} datasheet`}
            src={embedUrl}
            className="h-full w-full min-h-[70vh] border-0 bg-white"
            allow="fullscreen"
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={() => setLoading(false)}
          />
        </div>
      </div>
    </div>
  );
}
