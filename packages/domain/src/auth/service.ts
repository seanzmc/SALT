import bcrypt from "bcryptjs";

import { prisma } from "@salt/db";
import type { SessionPayload } from "@salt/types";

export async function authenticateWithCredentials(email: string, password: string) {
  const normalizedEmail = email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      passwordHash: true
    }
  });

  if (!user || !user.isActive) {
    return null;
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    return null;
  }

  const session: SessionPayload = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };

  return session;
}

export async function getSessionUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true
    }
  });

  if (!user?.isActive) {
    return null;
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  } satisfies SessionPayload;
}
