import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN: z.string().url().default("http://localhost:5173"),
  SESSION_SECRET: z.string().min(16).default("salt-rebuild-dev-session-secret")
});

export const apiEnv = envSchema.parse(process.env);
