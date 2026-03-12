import type { SessionUser } from "@salt/types";

export function isOwner(user: Pick<SessionUser, "role">) {
  return user.role === "OWNER_ADMIN";
}
