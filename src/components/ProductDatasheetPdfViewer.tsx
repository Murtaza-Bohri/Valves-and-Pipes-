"use client";

import { useEffect, useRef, useState } from "react";

type ProductDatasheetPdfViewerProps = {
  fileUrl: string;
  onReady?: () => void;
  onError?: () => void;
};

export function ProductDatasheetPdfViewer({
  fileUrl,
  onReady,
  onError,
}: ProductDatasheetPdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    container.replaceChildren();
    setStatus("loading");

    async function renderPdf() {
      try {
        const pdfjs = await import("pdfjs-dist/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const apiUrl = `/api/datasheet/file?src=${encodeURIComponent(fileUrl)}`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: buffer }).promise;

        if (cancelled) return;

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
          if (!containerRef.current) return;
          const mount = containerRef.current;
          const page = await pdf.getPage(pageNum);
          const baseViewport = page.getViewport({ scale: 1 });
          const maxWidth = Math.min(880, mount.clientWidth - 8 || 880);
          const scale = maxWidth / baseViewport.width;
          const viewport = page.getViewport({ scale: Math.max(scale, 0.9) });

          const canvas = document.createElement("canvas");
          canvas.className = "mx-auto mb-4 block max-w-full bg-white shadow-md";
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          mount.appendChild(canvas);

          await page.render({
            canvasContext: canvas.getContext("2d")!,
            viewport,
          }).promise;

          if (cancelled) return;
        }

        setStatus("ready");
        onReady?.();
      } catch {
        if (!cancelled) {
          setStatus("error");
          onError?.();
        }
      }
    }

    void renderPdf();

    return () => {
      cancelled = true;
    };
  }, [fileUrl, onError, onReady]);

  if (status === "error") {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto bg-[#525659] px-2 py-4"
      aria-busy={status === "loading"}
    />
  );
}
