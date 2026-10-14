import { headers } from "next/headers";

function stripTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

function withHttpsIfNeeded(hostOrUrl: string) {
  const value = hostOrUrl.trim();
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return stripTrailingSlash(value);
  }
  return stripTrailingSlash(`https://${value}`);
}

export function isLocalSiteHost(hostOrUrl: string) {
  const lower = hostOrUrl.toLowerCase();
  return (
    lower.includes("localhost") ||
    lower.includes("127.0.0.1") ||
    lower.startsWith("0.0.0.0")
  );
}

/**
 * Public base URL for links (emails, Ziina return URLs).
 * On Vercel, never use localhost from env — prefer production domain or request host.
 */
export function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const onVercel = process.env.VERCEL === "1";

  if (explicit) {
    if (!onVercel || !isLocalSiteHost(explicit)) {
      return withHttpsIfNeeded(explicit);
    }
  }

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) {
    return withHttpsIfNeeded(production);
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return withHttpsIfNeeded(vercel);
  }

  return "http://localhost:3000";
}

/** Prefer the domain the customer is actually browsing (custom domain vs *.vercel.app). */
export async function getRequestSiteUrl() {
  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    headerList.get("host")?.trim();

  if (!host || isLocalSiteHost(host)) {
    return null;
  }

  const proto =
    headerList.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
    (host.includes("localhost") ? "http" : "https");

  return stripTrailingSlash(`${proto}://${host}`);
}

/** Ziina success/cancel URLs — must match the live storefront, not localhost or a stale preview URL. */
export async function getPaymentReturnSiteUrl() {
  const fromRequest = await getRequestSiteUrl();
  if (fromRequest) {
    return fromRequest;
  }

  return getSiteUrl();
}
