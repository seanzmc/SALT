import { compare, hash } from "bcryptjs";

import { prisma } from "@salt/db";
import type {
  AccountEmailUpdateInput,
  AccountPasswordUpdateInput,
  SessionPayload
} from "@salt/types";

import { DomainError } from "../shared/domain-error";

type Actor = SessionPayload["user"];

export async function updateAccountEmailCommand(input: {
  actor: Actor;
  payload: AccountEmailUpdateInput;
}) {
  const email = input.payload.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { id: input.actor.id },
    select: { email: true }
  });

  if (!user) {
    throw new DomainError(404, "NOT_FOUND", "User account not found.");
  }

  if (user.email === email) {
    return {
      message: "Email address is already up to date."
    };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  });

  if (existingUser && existingUser.id !== input.actor.id) {
    throw new DomainError(400, "VALIDATION_ERROR", "That email address is already in use.", {
      email: ["That email address is already in use."]
    });
  }

  await prisma.user.update({
    where: { id: input.actor.id },
    data: { email }
  });

  return {
    message: "Email address updated."
  };
}

export async function updateAccountPasswordCommand(input: {
  actor: Actor;
  payload: AccountPasswordUpdateInput;
}) {
  const user = await prisma.user.findUnique({
    where: { id: input.actor.id },
    select: { passwordHash: true }
  });

  if (!user) {
    throw new DomainError(404, "NOT_FOUND", "User account not found.");
  }

  const currentPasswordMatches = await compare(
    input.payload.currentPassword,
    user.passwordHash
  );

  if (!currentPasswordMatches) {
    throw new DomainError(400, "VALIDATION_ERROR", "Current password is incorrect.", {
      currentPassword: ["Current password is incorrect."]
    });
  }

  const newPasswordMatchesCurrent = await compare(
    input.payload.newPassword,
    user.passwordHash
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

  await prisma.user.update({
    where: { id: input.actor.id },
    data: {
      passwordHash: await hash(input.payload.newPassword, 10)
    }
  });

  return {
    message: "Password updated."
  };
}
