#!/usr/bin/env node

import { assertSupabaseReachable, getSupabaseServiceConfig } from "./lib/load-env.mjs";

const { url } = getSupabaseServiceConfig();
console.log(`Checking Supabase at ${url} ...`);
await assertSupabaseReachable();
console.log("Supabase connection OK.");
