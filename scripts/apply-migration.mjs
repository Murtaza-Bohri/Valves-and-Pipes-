#!/usr/bin/env node

/**
 * Applies the normalized schema migration using a direct Postgres connection.
 *
 * Add to .env.local:
 *   SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
 *
 * Then run: npm run db:migrate
 */

import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const dbUrl = process.env.SUPABASE_DB_URL;
const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations/001_normalized_ecommerce.sql"
);

if (!dbUrl) {
  console.error(
    "Missing SUPABASE_DB_URL in environment.\n" +
      "Add your Supabase database connection string to .env.local, or run\n" +
      "supabase/migrations/001_normalized_ecommerce.sql manually in the SQL Editor."
  );
  process.exit(1);
}

const sql = fs.readFileSync(migrationPath, "utf8");
const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(sql);
  console.log("Migration applied successfully.");
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exit(1);
} finally {
  await client.end();
}
