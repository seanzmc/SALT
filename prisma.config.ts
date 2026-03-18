import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { defineConfig } from "prisma/config";

const BLOCKED_DATABASE_FINGERPRINTS = new Set(["f29c5630e2af"]);
const BLOCKED_DATABASE_HOSTS = new Set([
  "ep-winter-night-aduu57iz-pooler.c-2.us-east-1.aws.neon.tech",
  "ep-winter-night-aduu57iz.c-2.us-east-1.aws.neon.tech"
]);

const localEnvPath = resolve(".env.local");

if (existsSync(localEnvPath)) {
  process.loadEnvFile(localEnvPath);
}

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/clinic_buildout_tracker_dev?schema=public";

function getBlockedDatabaseTarget(urlValue: string) {
  try {
    const url = new URL(urlValue);
    const database = url.pathname.replace(/^\//, "") || "(default)";
    const fingerprint = createHash("sha256")
      .update(`${url.hostname}/${database}`)
      .digest("hex")
      .slice(0, 12);

    if (
      BLOCKED_DATABASE_FINGERPRINTS.has(fingerprint) ||
      BLOCKED_DATABASE_HOSTS.has(url.hostname)
    ) {
      return {
        host: url.hostname,
        database,
        fingerprint
      };
    }
  } catch {
    return null;
  }

  return null;
}

const blockedTarget = getBlockedDatabaseTarget(databaseUrl);

if (blockedTarget && process.env.VERCEL_ENV !== "production") {
  throw new Error(
    [
      `Refusing to run Prisma against protected database target ${blockedTarget.host}/${blockedTarget.database} (${blockedTarget.fingerprint}) outside Vercel production.`,
      "Use .env.local with a dedicated development DATABASE_URL for local Prisma commands."
    ].join(" ")
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts"
  },
  datasource: {
    url: databaseUrl
  }
});
