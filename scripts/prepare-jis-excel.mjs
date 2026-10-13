#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import XLSX from "xlsx";
import { loadEnvLocal } from "./lib/load-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnvLocal();

function getPasswordFromArgs() {
  const flag = process.argv.find((arg) => arg.startsWith("--password="));
  if (flag) return flag.slice("--password=".length);
  return process.env.JIS_EXCEL_PASSWORD?.trim() || "";
}

/** Returns a path that SheetJS can read (may run Excel COM unlock on Windows). */
export function resolveReadableExcelPath(sourcePath, outputPath) {
  if (!existsSync(sourcePath)) {
    throw new Error(`Excel file not found: ${sourcePath}`);
  }

  try {
    XLSX.read(readFileSync(sourcePath));
    return sourcePath;
  } catch (error) {
    if (!String(error.message).includes("password")) {
      throw error;
    }
  }

  const password = getPasswordFromArgs();
  if (!password) {
    throw new Error(
      "Excel file is password-protected. Pass --password=YOUR_PASSWORD or set JIS_EXCEL_PASSWORD in .env.local, then re-run."
    );
  }

  const unlockScript = join(__dirname, "unlock-excel.ps1");
  execFileSync(
    "powershell",
    [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      unlockScript,
      "-InputPath",
      sourcePath,
      "-OutputPath",
      outputPath,
      "-Password",
      password,
    ],
    { stdio: "inherit" }
  );

  if (!existsSync(outputPath)) {
    throw new Error(`Unlock failed: expected output at ${outputPath}`);
  }

  XLSX.read(readFileSync(outputPath));
  return outputPath;
}
