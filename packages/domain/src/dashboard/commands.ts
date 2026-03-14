import { prisma } from "@salt/db";
import type {
  DashboardActivityDismissInput,
  DashboardActivityDismissResponse,
  SessionPayload
} from "@salt/types";

import { DomainError } from "../shared/domain-error.js";

type Actor = SessionPayload["user"];

export async function dismissDashboardActivity(input: {
  actor: Actor;
  payload: DashboardActivityDismissInput;
}): Promise<DashboardActivityDismissResponse> {
  const activity = await prisma.activityLog.findUnique({
    where: { id: input.payload.activityId },
    select: { id: true }
  });

  if (!activity) {
    throw new DomainError(404, "NOT_FOUND", "Activity item not found.");
  }

  await prisma.activityDismissal.upsert({
    where: {
      activityId_userId: {
        activityId: input.payload.activityId,
        userId: input.actor.id
      }
    },
    create: {
      activityId: input.payload.activityId,
      userId: input.actor.id
    },
    update: {
      dismissedAt: new Date()
    }
  });

  return {
    activityId: input.payload.activityId
  };
}
