import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN: z.string().url().default("http://localhost:5173"),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  PASSWORD_RESET_ORIGIN: z.string().url().optional(),
  SESSION_SECRET: z.string().min(16).default("salt-rebuild-dev-session-secret")
});

function parseAllowedOrigins(input: string | undefined, fallbackOrigin: string) {
  if (!input?.trim()) {
    return [fallbackOrigin];
  }

  const urlSchema = z.string().url();
  const origins = input
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => urlSchema.parse(value));

  return origins.length ? Array.from(new Set(origins)) : [fallbackOrigin];
}

const parsedEnv = envSchema.parse(process.env);

export const apiEnv = {
  ...parsedEnv,
  CORS_ALLOWED_ORIGINS: parseAllowedOrigins(
    parsedEnv.CORS_ALLOWED_ORIGINS,
    parsedEnv.WEB_ORIGIN
  ),
  PASSWORD_RESET_ORIGIN: parsedEnv.PASSWORD_RESET_ORIGIN ?? parsedEnv.WEB_ORIGIN
};
