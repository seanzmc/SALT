import { ActivityType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function logActivity(input: {
  actorId?: string | null;
  taskId?: string | null;
  type: ActivityType;
  entityType: string;
  entityId: string;
  description: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.activityLog.create({
    data: {
      actorId: input.actorId ?? null,
      taskId: input.taskId ?? null,
      type: input.type,
      entityType: input.entityType,
      entityId: input.entityId,
      description: input.description,
      metadata: input.metadata
    }
  });
}
