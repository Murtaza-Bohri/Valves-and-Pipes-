#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import "./lib/load-env.mjs";

const fileArg = process.argv[2];
if (!fileArg) {
  console.error("Usage: node scripts/apply-sql-file.mjs <path-to.sql>");
  process.exit(1);
}

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error(
    "Missing SUPABASE_DB_URL in .env.local (Database → Connection string → URI)."
  );
  process.exit(1);
}

const sqlPath = path.isAbsolute(fileArg)
  ? fileArg
  : path.join(process.cwd(), fileArg);

const sql = fs.readFileSync(sqlPath, "utf8");
const client = new pg.Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log(`Applied ${path.basename(sqlPath)}`);
} catch (error) {
  console.error("SQL failed:", error.message);
  process.exit(1);
} finally {
  await client.end();
}
