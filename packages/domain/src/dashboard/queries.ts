import { TaskStatus } from "@prisma/client";

import { prisma } from "@salt/db";
import type { DashboardActivityResponse, DashboardSummary } from "@salt/types";

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const now = new Date();
  const upcomingLimit = new Date(now);
  upcomingLimit.setDate(upcomingLimit.getDate() + 7);
  const staleLimit = new Date(now);
  staleLimit.setDate(staleLimit.getDate() - 7);

  const [tasks, recentDocuments, recentMessages] = await Promise.all([
    prisma.task.findMany({
      where: { archivedAt: null },
      select: {
        id: true,
        status: true,
        dueDate: true,
        assignedToId: true,
        updatedAt: true
      }
    }),
    prisma.document.findMany({
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true
          }
        },
        linkedTask: {
          select: {
            id: true,
            title: true
          }
        },
        linkedBudgetItem: {
          select: {
            id: true,
            lineItem: true
          }
        },
        taskAttachments: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                archivedAt: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.message.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        },
        thread: {
          select: {
            id: true,
            title: true,
            task: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 5
    })
  ]);

  const completedTasks = tasks.filter((task) => task.status === TaskStatus.COMPLETE).length;

  return {
    overallCompletion: tasks.length ? (completedTasks / tasks.length) * 100 : 0,
    queueCounts: {
      overdue: tasks.filter(
        (task) => task.dueDate && task.dueDate < now && task.status !== TaskStatus.COMPLETE
      ).length,
      upcoming: tasks.filter(
        (task) =>
          task.dueDate &&
          task.dueDate >= now &&
          task.dueDate <= upcomingLimit &&
          task.status !== TaskStatus.COMPLETE
      ).length,
      blocked: tasks.filter((task) => task.status === TaskStatus.BLOCKED).length,
      unassigned: tasks.filter(
        (task) => task.assignedToId === null && task.status !== TaskStatus.COMPLETE
      ).length,
      stale: tasks.filter(
        (task) => task.updatedAt < staleLimit && task.status !== TaskStatus.COMPLETE
      ).length
    },
    recentDocuments: recentDocuments.map((document) => ({
      id: document.id,
      title: document.title,
      category: document.category,
      createdAt: document.createdAt.toISOString(),
      uploadedBy: document.uploadedBy,
      linkedTask: document.linkedTask
    })),
    recentMessages: recentMessages.map((message) => ({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      author: message.author,
      thread: {
        id: message.thread.id,
        title: message.thread.title,
        task: message.thread.task
      },
      linkedTaskId: message.linkedTaskId
    }))
  };
}

export async function getDashboardActivity(): Promise<DashboardActivityResponse> {
  const activities = await prisma.activityLog.findMany({
    include: {
      actor: {
        select: {
          id: true,
          name: true
        }
      },
      task: {
        select: {
          id: true,
          title: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 8
  });

  return {
    activities: activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      entityType: activity.entityType,
      entityId: activity.entityId,
      description: activity.description,
      createdAt: activity.createdAt.toISOString(),
      actor: activity.actor,
      task: activity.task
    }))
  };
}
