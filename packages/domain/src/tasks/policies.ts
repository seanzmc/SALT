import type { Role } from "@prisma/client";

export function canEditTask(input: {
  role: Role | "OWNER_ADMIN" | "COLLABORATOR";
  userId: string;
  assignedToId: string | null;
}) {
  return input.role === "OWNER_ADMIN" || input.assignedToId === input.userId;
}

export function canEditSubtask(input: {
  role: Role | "OWNER_ADMIN" | "COLLABORATOR";
  userId: string;
  assignedToId: string | null;
  parentTaskAssignedToId: string | null;
}) {
  return (
    input.role === "OWNER_ADMIN" ||
    input.assignedToId === input.userId ||
    input.parentTaskAssignedToId === input.userId
  );
}
