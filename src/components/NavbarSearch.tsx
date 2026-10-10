"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import type { CatalogSearchResult } from "@/lib/search";

type NavbarSearchProps = {
  solid?: boolean;
  /** Full-width search for mobile drawer */
  mobile?: boolean;
  onNavigate?: () => void;
};

const DEBOUNCE_MS = 120;
const CACHE_TTL_MS = 30_000;
const resultCache = new Map<string, { results: CatalogSearchResult[]; expiresAt: number }>();

function getCachedResults(query: string) {
  const entry = resultCache.get(query);
  if (!entry || entry.expiresAt < Date.now()) {
    resultCache.delete(query);
    return null;
  }
  return entry.results;
}

function setCachedResults(query: string, results: CatalogSearchResult[]) {
  resultCache.set(query, { results, expiresAt: Date.now() + CACHE_TTL_MS });
  if (resultCache.size > 40) {
    const oldestKey = resultCache.keys().next().value;
    if (oldestKey) resultCache.delete(oldestKey);
  }
}

export function NavbarSearch({
  solid = true,
  mobile = false,
  onNavigate,
}: NavbarSearchProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const cached = getCachedResults(trimmed.toLowerCase());
    if (cached) {
      setResults(cached);
      setLoading(false);
      setOpen(true);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal, cache: "no-store" }
        );
        const data = (await response.json()) as { results?: CatalogSearchResult[] };
        if (requestId !== requestIdRef.current) return;

        const nextResults = data.results ?? [];
        setCachedResults(trimmed.toLowerCase(), nextResults);
        setResults(nextResults);
        setOpen(true);
      } catch {
        if (!controller.signal.aborted && requestId === requestIdRef.current) {
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted && requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  const inputClass = solid
    ? "border-[#e0e0e0] bg-white text-[#141414] placeholder:text-[#9a9a9a] focus:border-[#bd1115]"
    : "border-white/25 bg-white/10 text-white placeholder:text-white/60 focus:border-white/50";

  const iconClass = solid ? "text-[#6b6b6b]" : "text-white/70";
  const showEmpty = !loading && results.length === 0;
  const trimmedQuery = query.trim();

  return (
    <div
      ref={containerRef}
      className={`relative ${mobile ? "block w-full" : "hidden sm:block"}`}
    >
      <Search
        className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${iconClass}`}
        aria-hidden
      />
      <input
        type="search"
        value={query}
        onChange={(event) => {
          const next = event.target.value;
          setQuery(next);
          setOpen(true);
          const nextTrimmed = next.trim();
          if (nextTrimmed.length >= 2) {
            const cached = getCachedResults(nextTrimmed.toLowerCase());
            if (cached) {
              setResults(cached);
              setLoading(false);
            }
          }
        }}
        onFocus={() => {
          if (trimmedQuery.length >= 2) setOpen(true);
        }}
        placeholder="Search IMPA, valves, pipes..."
        aria-label="Search products"
        aria-expanded={open}
        aria-controls={listboxId}
        autoComplete="off"
        className={`border py-2 pr-3 pl-9 text-sm outline-none transition-colors ${
          mobile ? "h-10 w-full" : "h-9 w-44 lg:w-56"
        } ${inputClass}`}
      />

      {open && trimmedQuery.length >= 2 ? (
        <div
          id={listboxId}
          role="listbox"
          className={`absolute z-50 max-h-[min(70vh,420px)] overflow-y-auto border border-[#e8e8e8] bg-white py-2 shadow-xl ${
            mobile
              ? "left-0 right-0 top-[calc(100%+0.5rem)]"
              : "right-0 top-[calc(100%+0.5rem)] w-[min(100vw-2rem,360px)]"
          }`}
        >
          {loading && results.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-[#6b6b6b]">
              <Loader2 className="h-4 w-4 animate-spin text-[#bd1115]" />
              Searching...
            </div>
          ) : showEmpty ? (
            <p className="px-4 py-3 text-sm text-[#6b6b6b]">
              No products found for &quot;{trimmedQuery}&quot;.
            </p>
          ) : (
            <>
              {loading ? (
                <div className="flex items-center gap-2 border-b border-[#f0f0f0] px-4 py-2 text-xs text-[#6b6b6b]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#bd1115]" />
                  Updating...
                </div>
              ) : null}
              {results.map((result) => (
                <Link
                  key={`${result.kind}-${result.id}-${result.impaNumber ?? ""}`}
                  href={result.href}
                  role="option"
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                    onNavigate?.();
                  }}
                  className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[#f7f7f7]"
                >
                  {result.image ? (
                    <div className="relative mt-0.5 h-10 w-10 shrink-0 overflow-hidden border border-[#e8e8e8] bg-white">
                      <Image
                        src={result.image}
                        alt=""
                        fill
                        className="object-contain p-1"
                        sizes="40px"
                      />
                    </div>
                  ) : (
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center border border-[#e8e8e8] bg-[#f7f7f7] text-[10px] font-semibold tracking-[0.12em] text-[#bd1115] uppercase">
                      {result.kind === "category" ? "Cat" : "IMPA"}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#141414]">
                      {result.title}
                    </p>
                    {result.impaNumber ? (
                      <p className="mt-0.5 text-xs font-medium text-[#bd1115]">
                        IMPA {result.impaNumber}
                      </p>
                    ) : null}
                    {result.subtitle ? (
                      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-[#6b6b6b]">
                        {result.subtitle}
                      </p>
                    ) : null}
                  </div>
                </Link>
              ))}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
