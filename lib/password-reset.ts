import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";

const PASSWORD_RESET_TOKEN_BYTES = 32;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createPasswordResetToken() {
  const token = randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString("hex");

  return {
    token,
    tokenHash: hashResetToken(token),
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS)
  };
}

export function getPasswordResetUrl(token: string) {
  const baseUrl =
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  return new URL(`/reset-password?token=${encodeURIComponent(token)}`, baseUrl).toString();
}

export async function getPasswordResetTokenRecord(token: string) {
  const tokenHash = hashResetToken(token);

  return prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          passwordHash: true
        }
      }
    }
  });
}

export async function isPasswordResetTokenValid(token: string) {
  const record = await getPasswordResetTokenRecord(token);

  return Boolean(record && !record.usedAt && record.expiresAt > new Date());
}
