import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const apiRoot = resolve(repoRoot, "apps/api");
const envFilePath = resolve(repoRoot, ".env.local");

if (!existsSync(envFilePath)) {
  console.error(
    [
      "Missing .env.local.",
      "Local API development now requires a dedicated local env file at the repo root.",
      "Copy .env.example to .env.local and set DATABASE_URL to a development-only database."
    ].join(" ")
  );
  process.exit(1);
}

process.loadEnvFile(envFilePath);

console.info(`[local-api] loaded ${envFilePath}`);

const child = spawn(
  process.execPath,
  [resolve(repoRoot, "node_modules/tsx/dist/cli.mjs"), "watch", "src/server.ts"],
  {
    cwd: apiRoot,
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
