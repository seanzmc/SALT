import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const BLOCKED_DATABASE_FINGERPRINTS = new Set(["f29c5630e2af"]);
const BLOCKED_DATABASE_HOSTS = new Set([
  "ep-winter-night-aduu57iz-pooler.c-2.us-east-1.aws.neon.tech",
  "ep-winter-night-aduu57iz.c-2.us-east-1.aws.neon.tech"
]);

function getDatabaseTarget(databaseUrl) {
  if (!databaseUrl) {
    return null;
  }

  try {
    const url = new URL(databaseUrl);
    const database = url.pathname.replace(/^\//, "") || "(default)";
    const fingerprint = createHash("sha256")
      .update(`${url.hostname}/${database}`)
      .digest("hex")
      .slice(0, 12);

    return {
      host: url.hostname,
      database,
      fingerprint
    };
  } catch {
    return null;
  }
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const envFilePath = resolve(repoRoot, ".env.local");

if (!existsSync(envFilePath)) {
  console.error(
    [
      "Missing .env.local.",
      "Local Prisma commands now require a dedicated local env file at the repo root.",
      "Copy .env.example to .env.local and set DATABASE_URL to a development-only database."
    ].join(" ")
  );
  process.exit(1);
}

process.loadEnvFile(envFilePath);

const databaseTarget = getDatabaseTarget(process.env.DATABASE_URL);

if (!databaseTarget) {
  console.error("DATABASE_URL is missing or invalid in .env.local.");
  process.exit(1);
}

if (
  BLOCKED_DATABASE_FINGERPRINTS.has(databaseTarget.fingerprint) ||
  BLOCKED_DATABASE_HOSTS.has(databaseTarget.host)
) {
  console.error(
    [
      `Refusing to run Prisma locally against protected database target ${databaseTarget.host}/${databaseTarget.database} (${databaseTarget.fingerprint}).`,
      "Update .env.local so DATABASE_URL points at a dedicated development database."
    ].join(" ")
  );
  process.exit(1);
}

console.info(
  `[local-prisma] using ${databaseTarget.host}/${databaseTarget.database} (${databaseTarget.fingerprint}) via ${envFilePath}`
);

const child = spawn(
  process.execPath,
  [resolve(repoRoot, "node_modules/prisma/build/index.js"), ...process.argv.slice(2)],
  {
    cwd: repoRoot,
    env: process.env,
    stdio: "inherit"
  }
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
