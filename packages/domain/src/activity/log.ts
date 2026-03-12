import { prisma } from "@salt/db";

export async function logActivity(input: {
  actorId?: string | null;
  taskId?: string | null;
  type:
    | "TASK_UPDATED"
    | "TASK_STATUS_CHANGED"
    | "TASK_ASSIGNED"
    | "TASK_COMMENTED"
    | "BUDGET_UPDATED"
    | "DOCUMENT_UPLOADED"
    | "TIMELINE_UPDATED"
    | "MESSAGE_POSTED";
  entityType: string;
  entityId: string;
  description: string;
}) {
  await prisma.activityLog.create({
    data: {
      actorId: input.actorId ?? null,
      taskId: input.taskId ?? null,
      type: input.type,
      entityType: input.entityType,
      entityId: input.entityId,
      description: input.description
    }
  });
}
