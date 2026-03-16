import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { getRequiredSession } from "@/lib/auth";

export async function requireSession() {
  const session = await getRequiredSession();

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}

export async function requireOwner() {
  const session = await requireSession();

  if (session.user.role !== Role.OWNER_ADMIN) {
    redirect("/dashboard?unauthorized=owner");
  }

  return session;
}
