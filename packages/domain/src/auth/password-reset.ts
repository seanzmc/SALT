import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@salt/db";

import { DomainError } from "../shared/domain-error";

const PASSWORD_RESET_TOKEN_BYTES = 32;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

export const genericPasswordResetMessage =
  "If an account exists for that email, a reset link has been sent.";

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

export function getPasswordResetUrl(token: string, baseUrl: string) {
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

export async function requestPasswordResetCommand(input: {
  email: string;
  baseUrl: string;
}) {
  const email = input.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true }
  });

  if (!user) {
    return {
      message: genericPasswordResetMessage,
      delivery: null
    };
  }

  const { token, tokenHash, expiresAt } = createPasswordResetToken();

  await prisma.passwordResetToken.deleteMany({
    where: {
      userId: user.id,
      OR: [{ usedAt: null }, { expiresAt: { lt: new Date() } }]
    }
  });

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt
    }
  });

  return {
    message: genericPasswordResetMessage,
    delivery: {
      email: user.email,
      name: user.name,
      resetUrl: getPasswordResetUrl(token, input.baseUrl)
    }
  };
}

export async function resetPasswordWithTokenCommand(input: {
  token: string;
  newPassword: string;
}) {
  const tokenRecord = await getPasswordResetTokenRecord(input.token);

  if (!tokenRecord || tokenRecord.usedAt || tokenRecord.expiresAt <= new Date()) {
    throw new DomainError(
      400,
      "VALIDATION_ERROR",
      "This reset link is invalid or has expired. Request a new one to continue."
    );
  }

  const newPasswordMatchesCurrent = await bcrypt.compare(
    input.newPassword,
    tokenRecord.user.passwordHash
  );

  if (newPasswordMatchesCurrent) {
    throw new DomainError(
      400,
      "VALIDATION_ERROR",
      "Choose a new password that is different from the current password.",
      {
        newPassword: ["Choose a new password that is different from the current password."]
      }
    );
  }

  const nextPasswordHash = await bcrypt.hash(input.newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: tokenRecord.userId },
      data: {
        passwordHash: nextPasswordHash
      }
    }),
    prisma.passwordResetToken.update({
      where: { id: tokenRecord.id },
      data: {
        usedAt: new Date()
      }
    }),
    prisma.passwordResetToken.deleteMany({
      where: {
        userId: tokenRecord.userId,
        id: { not: tokenRecord.id }
      }
    })
  ]);

  return {
    message: "Password updated. You can now sign in with your new password."
  };
}
