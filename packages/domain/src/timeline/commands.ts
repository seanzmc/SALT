import { prisma } from "@salt/db";
import type { SessionPayload, TimelinePhaseUpdateInput } from "@salt/types";

import { logActivity } from "../activity/log.js";
import { DomainError } from "../shared/domain-error.js";
import { serializeTimelinePhase } from "./serializers.js";

type Actor = SessionPayload["user"];

function parseOptionalDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function updateTimelinePhaseCommand(input: {
  actor: Actor;
  payload: TimelinePhaseUpdateInput;
}) {
  const existing = await prisma.timelinePhase.findUnique({
    where: { id: input.payload.phaseId },
    select: { id: true }
  });

  if (!existing) {
    throw new DomainError(404, "NOT_FOUND", "Timeline phase not found.");
  }

  const phase = await prisma.timelinePhase.update({
    where: { id: input.payload.phaseId },
    data: {
      status: input.payload.status,
      notes: input.payload.notes?.trim() || null,
      blockers: input.payload.blockers?.trim() || null,
      startDate: parseOptionalDate(input.payload.startDate),
      endDate: parseOptionalDate(input.payload.endDate)
    },
    include: {
      milestones: {
        orderBy: { dueDate: "asc" }
      },
      tasks: {
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: [{ dueDate: "asc" }, { title: "asc" }]
      }
    }
  });

  await logActivity({
    actorId: input.actor.id,
    type: "TIMELINE_UPDATED",
    entityType: "TimelinePhase",
    entityId: phase.id,
    description: "Updated timeline phase status or dates."
  });

  return serializeTimelinePhase(phase);
}
