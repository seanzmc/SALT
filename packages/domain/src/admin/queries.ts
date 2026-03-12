import { TaskStatus } from "@prisma/client";

import { prisma } from "@salt/db";
import type { AdminSetupData } from "@salt/types";

import { serializeAdminSetupData } from "./serializers";

export async function getAdminSetupData(): Promise<AdminSetupData> {
  const [users, activeAssignmentUsers, tasks, subtasks] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        assignedTasks: {
          where: {
            archivedAt: null,
            status: { not: TaskStatus.COMPLETE }
          },
          select: { id: true }
        },
        assignedSubtasks: {
          where: {
            archivedAt: null,
            isComplete: false
          },
          select: { id: true }
        }
      }
    }),
    prisma.user.findMany({
      where: { isActive: true },
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    }),
    prisma.task.findMany({
      where: { archivedAt: null },
      orderBy: [{ dueDate: "asc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
        assignedToId: true,
        assignedTo: {
          select: {
            name: true
          }
        },
        section: {
          select: {
            title: true
          }
        }
      }
    }),
    prisma.subtask.findMany({
      where: { archivedAt: null },
      orderBy: [{ task: { title: "asc" } }, { sortOrder: "asc" }],
      select: {
        id: true,
        title: true,
        isComplete: true,
        dueDate: true,
        assignedToId: true,
        task: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })
  ]);

  return serializeAdminSetupData({
    users,
    activeAssignmentUsers,
    tasks,
    subtasks
  });
}
