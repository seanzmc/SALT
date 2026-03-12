import { prisma } from "@salt/db";
import type { TimelineWorkspaceData } from "@salt/types";

import { serializeTimelineWorkspace } from "./serializers.js";

export async function getTimelineWorkspace(): Promise<TimelineWorkspaceData> {
  const phases = await prisma.timelinePhase.findMany({
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
    },
    orderBy: { sortOrder: "asc" }
  });

  return serializeTimelineWorkspace({ phases });
}
