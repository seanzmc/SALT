import { prisma } from "@/lib/prisma";

export async function getTimelineData() {
  return prisma.timelinePhase.findMany({
    include: {
      milestones: {
        orderBy: { dueDate: "asc" }
      },
      tasks: {
        include: {
          assignedTo: true
        },
        orderBy: { dueDate: "asc" }
      }
    },
    orderBy: { sortOrder: "asc" }
  });
}
