import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";

const BLOCKED_DATABASE_FINGERPRINTS = new Set(["f29c5630e2af"]);
const BLOCKED_DATABASE_HOSTS = new Set([
  "ep-winter-night-aduu57iz-pooler.c-2.us-east-1.aws.neon.tech",
  "ep-winter-night-aduu57iz.c-2.us-east-1.aws.neon.tech"
]);

function getBlockedDatabaseTarget(databaseUrl: string | undefined) {
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

function assertSafeDatabaseTarget() {
  if (process.env.VERCEL_ENV === "production") {
    return;
  }

  const blockedTarget = getBlockedDatabaseTarget(process.env.DATABASE_URL);

  if (!blockedTarget) {
    return;
  }

  throw new Error(
    [
      `Refusing to connect to protected database target ${blockedTarget.host}/${blockedTarget.database} (${blockedTarget.fingerprint}) outside Vercel production.`,
      "Set DATABASE_URL to a dedicated development database before starting the local API."
    ].join(" ")
  );
}

assertSafeDatabaseTarget();

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
