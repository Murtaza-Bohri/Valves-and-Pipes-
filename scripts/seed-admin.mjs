#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const adminEmail =
  process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "murtaza.bohri@himmat.ae";
const adminDisplayName =
  process.env.ADMIN_DISPLAY_NAME ?? "Murtaza Bohri";
const adminPassword = process.env.ADMIN_PASSWORD;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment."
  );
  process.exit(1);
}

if (!adminPassword) {
  console.error("Missing ADMIN_PASSWORD in environment.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: existingUsers, error: listError } =
  await supabase.auth.admin.listUsers();

if (listError) {
  console.error("Failed to list users:", listError.message);
  process.exit(1);
}

const existing = existingUsers.users.find(
  (user) => user.email?.toLowerCase() === adminEmail.toLowerCase()
);

if (existing) {
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    existing.id,
    {
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: adminDisplayName,
        role: "admin",
      },
    }
  );

  if (updateError) {
    console.error("Failed to update admin user:", updateError.message);
    process.exit(1);
  }

  console.log(`Updated admin user: ${adminEmail}`);
  process.exit(0);
}

const { data, error } = await supabase.auth.admin.createUser({
  email: adminEmail,
  password: adminPassword,
  email_confirm: true,
  user_metadata: {
    full_name: adminDisplayName,
    role: "admin",
  },
});

if (error) {
  console.error("Failed to create admin user:", error.message);
  process.exit(1);
}

console.log(`Created admin user: ${data.user.email}`);
console.log(`Login with username "${adminDisplayName}" or email "${adminEmail}"`);
