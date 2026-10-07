import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", "..", ".env.local");

export function loadEnvLocal() {
  if (!existsSync(envPath)) {
    console.error(`Missing .env.local at ${envPath}`);
    console.error("Copy .env.example to .env.local and add your Supabase keys.");
    process.exit(1);
  }

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

export function getSupabaseServiceConfig() {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "") ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  return { url, serviceRoleKey };
}

export async function assertSupabaseReachable() {
  const { url, serviceRoleKey } = getSupabaseServiceConfig();

  if (!url || !serviceRoleKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
    process.exit(1);
  }

  try {
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    if (response.status >= 500) {
      throw new Error(`Supabase returned HTTP ${response.status}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("\nSeed failed: cannot reach Supabase.\n");
    console.error(`URL: ${url}`);
    console.error(`Reason: ${message}\n`);
    console.error("Fix your .env.local using a live project from Supabase Dashboard:");
    console.error("  1. https://supabase.com/dashboard → your project");
    console.error("  2. Settings → API → Project URL + service_role key");
    console.error("  3. Save .env.local and run the seed command again.\n");
    console.error(
      "If the project was deleted or paused, create a new Supabase project and update the URL."
    );
    process.exit(1);
  }
}
