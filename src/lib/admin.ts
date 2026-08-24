const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "murtaza.bohri@himmat.ae";
const adminDisplayName =
  process.env.ADMIN_DISPLAY_NAME ?? "Murtaza Bohri";

export function getAdminEmail() {
  return adminEmail;
}

export function getAdminDisplayName() {
  return adminDisplayName;
}

export function resolveAdminEmail(identifier: string) {
  const normalized = identifier.trim().toLowerCase();

  if (
    normalized === adminEmail.toLowerCase() ||
    normalized === adminDisplayName.toLowerCase()
  ) {
    return adminEmail;
  }

  return null;
}

import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";

export function isSupabaseConfigured() {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey());
}
