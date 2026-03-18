import { createHash } from "node:crypto";

import { apiEnv } from "../config/env.js";

function shortHash(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function sanitizeDatabaseUrl(databaseUrl: string | undefined) {
  if (!databaseUrl) {
    return {
      configured: false,
      host: null,
      database: null,
      fingerprint: null
    };
  }

  try {
    const url = new URL(databaseUrl);
    const database = url.pathname.replace(/^\//, "") || "(default)";

    return {
      configured: true,
      host: url.hostname,
      database,
      fingerprint: shortHash(`${url.hostname}/${database}`)
    };
  } catch {
    return {
      configured: true,
      host: "unparseable",
      database: null,
      fingerprint: shortHash(databaseUrl)
    };
  }
}

export function getRuntimeDiagnostics() {
  const vercelUrl = process.env.VERCEL_URL ?? null;
  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? null;
  const gitCommitSha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? null;

  return {
    service: "salt-api",
    environment: {
      nodeEnv: apiEnv.NODE_ENV,
      platform: process.env.VERCEL === "1" ? "vercel" : "node",
      vercelEnv: process.env.VERCEL_ENV ?? null,
      vercelRegion: process.env.VERCEL_REGION ?? null
    },
    deployment: {
      url: vercelUrl,
      projectProductionUrl: productionUrl,
      gitCommitSha,
      identity:
        vercelUrl ??
        productionUrl ??
        gitCommitSha ??
        `${apiEnv.NODE_ENV}-local`
    },
    configuredWebOrigin: apiEnv.WEB_ORIGIN,
    database: sanitizeDatabaseUrl(process.env.DATABASE_URL)
  };
}

export function buildRuntimeHeaderValue() {
  const diagnostics = getRuntimeDiagnostics();

  return [
    diagnostics.environment.platform,
    diagnostics.environment.vercelEnv ?? diagnostics.environment.nodeEnv,
    diagnostics.deployment.identity,
    diagnostics.database.fingerprint ?? "db-unknown"
  ].join(";");
}

export function hashEmail(email: string) {
  return shortHash(email.trim().toLowerCase());
}

export function logRuntimeMutation(input: {
  action: string;
  userId?: string | null;
  email?: string | null;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}) {
  const diagnostics = getRuntimeDiagnostics();

  console.info(
    JSON.stringify({
      event: "runtime-mutation",
      action: input.action,
      userId: input.userId ?? null,
      emailHash: input.email ? hashEmail(input.email) : null,
      deploymentIdentity: diagnostics.deployment.identity,
      vercelEnv: diagnostics.environment.vercelEnv,
      dbFingerprint: diagnostics.database.fingerprint,
      metadata: input.metadata ?? {}
    })
  );
}
