import { TaskStatus, type Prisma } from "@prisma/client";

import { prisma } from "@salt/db";
import type { TaskListFilters } from "@salt/types";

import { serializeTaskListResponse, serializeTaskWorkspace } from "./serializers.js";

function buildAssigneeWhere(
  assignees: TaskListFilters["assignee"],
  currentUserId?: string
): Prisma.TaskWhereInput {
  if (!assignees || assignees.length === 0) {
    return {};
  }

  const explicitIds = assignees.filter(
    (value) => value !== "me" && value !== "unassigned"
  );
  const or: Prisma.TaskWhereInput[] = [];

  if (assignees.includes("unassigned")) {
    or.push({ assignedToId: null });
  }

  if (assignees.includes("me") && currentUserId) {
    or.push({ assignedToId: currentUserId });
  }

  if (explicitIds.length > 0) {
    or.push({ assignedToId: { in: explicitIds } });
  }

  if (or.length === 0) {
    return {};
  }

  return or.length === 1 ? or[0]! : { OR: or };
}

export async function listTasks(filters: TaskListFilters & { currentUserId?: string } = {}) {
  const now = new Date();
  const upcomingLimit = new Date(now);
  upcomingLimit.setDate(upcomingLimit.getDate() + 7);
  const staleLimit = new Date(now);
  staleLimit.setDate(staleLimit.getDate() - 7);

  const where: Prisma.TaskWhereInput = {
    AND: [
      filters.q
        ? {
            OR: [
              { title: { contains: filters.q, mode: "insensitive" } },
              { description: { contains: filters.q, mode: "insensitive" } },
              { notes: { contains: filters.q, mode: "insensitive" } }
            ]
          }
        : {},
      filters.status && filters.status.length > 0 ? { status: { in: filters.status } } : {},
      filters.section && filters.section.length > 0
        ? { section: { slug: { in: filters.section } } }
        : {},
      filters.priority && filters.priority.length > 0
        ? { priority: { in: filters.priority } }
        : {},
      filters.archived === "archived"
        ? { archivedAt: { not: null } }
        : filters.archived === "all"
          ? {}
          : { archivedAt: null },
      buildAssigneeWhere(filters.assignee, filters.currentUserId),
      filters.queue === "my-work"
        ? { assignedToId: filters.currentUserId }
        : filters.queue === "overdue"
          ? { dueDate: { lt: now }, status: { not: TaskStatus.COMPLETE } }
          : filters.queue === "upcoming"
            ? {
                dueDate: { gte: now, lte: upcomingLimit },
                status: { not: TaskStatus.COMPLETE }
              }
            : filters.queue === "blocked"
              ? { status: TaskStatus.BLOCKED }
              : filters.queue === "unassigned"
                ? { assignedToId: null }
                : filters.queue === "stale"
                  ? {
                      updatedAt: { lt: staleLimit },
                      status: { not: TaskStatus.COMPLETE }
                    }
                  : {}
    ]
  };

  const sortDirection =
    filters.order ?? (filters.sort === "priority" ? "desc" : "asc");
  const orderBy: Prisma.TaskOrderByWithRelationInput =
    filters.sort === "priority"
      ? { priority: sortDirection }
      : filters.sort === "title"
        ? { title: sortDirection }
        : filters.sort === "status"
          ? { status: sortDirection }
          : { dueDate: sortDirection };

  const [tasks, sections, users, phases, queueCounts] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        section: true,
        phase: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, name: true, role: true } },
        subtasks: {
          select: {
            archivedAt: true,
            isComplete: true
          }
        },
        taskDependencies: {
          include: {
            dependsOnTask: {
              select: { status: true }
            }
          }
        }
      },
      orderBy
    }),
    prisma.section.findMany({
      select: { id: true, slug: true, title: true },
      orderBy: { sortOrder: "asc" }
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" }
    }),
    prisma.timelinePhase.findMany({
      select: { id: true, title: true },
      orderBy: { sortOrder: "asc" }
    }),
    Promise.all([
      prisma.task.count({ where: { archivedAt: null } }),
      prisma.task.count({
        where: {
          archivedAt: null,
          assignedToId: filters.currentUserId,
          status: { not: TaskStatus.COMPLETE }
        }
      }),
      prisma.task.count({
        where: {
          archivedAt: null,
          dueDate: { lt: now },
          status: { not: TaskStatus.COMPLETE }
        }
      }),
      prisma.task.count({
        where: {
          archivedAt: null,
          dueDate: { gte: now, lte: upcomingLimit },
          status: { not: TaskStatus.COMPLETE }
        }
      }),
      prisma.task.count({
        where: { archivedAt: null, status: TaskStatus.BLOCKED }
      }),
      prisma.task.count({
        where: {
          archivedAt: null,
          assignedToId: null,
          status: { not: TaskStatus.COMPLETE }
        }
      }),
      prisma.task.count({
        where: {
          archivedAt: null,
          updatedAt: { lt: staleLimit },
          status: { not: TaskStatus.COMPLETE }
        }
      })
    ])
  ]);

  return serializeTaskListResponse({
    tasks,
    sections,
    users,
    phases,
    queueCounts: {
      all: queueCounts[0],
      myWork: queueCounts[1],
      overdue: queueCounts[2],
      upcoming: queueCounts[3],
      blocked: queueCounts[4],
      unassigned: queueCounts[5],
      stale: queueCounts[6]
    }
  });
}

export async function getTaskWorkspace(taskId: string) {
  const [task, users, sections, phases, dependencyCandidates] = await Promise.all([
    prisma.task.findUnique({
      where: { id: taskId },
      include: {
        section: true,
        phase: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, name: true, role: true } },
        comments: {
          include: {
            author: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: "desc" }
        },
        subtasks: {
          include: {
            assignedTo: { select: { id: true, name: true } }
          },
          orderBy: { sortOrder: "asc" }
        },
        taskDependencies: {
          include: {
            dependsOnTask: {
              select: {
                id: true,
                title: true,
                status: true,
                dueDate: true,
                assignedTo: { select: { id: true, name: true } }
              }
            }
          }
        },
        dependsOn: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                status: true,
                dueDate: true,
                assignedTo: { select: { id: true, name: true } }
              }
            }
          }
        },
        attachments: {
          include: {
            document: {
              select: {
                id: true,
                title: true,
                category: true,
                originalName: true,
                storagePath: true,
                createdAt: true
              }
            }
          }
        }
      }
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" }
    }),
    prisma.section.findMany({
      select: { id: true, slug: true, title: true },
      orderBy: { sortOrder: "asc" }
    }),
    prisma.timelinePhase.findMany({
      select: { id: true, title: true },
      orderBy: { sortOrder: "asc" }
    }),
    prisma.task.findMany({
      where: {
        id: { not: taskId },
        archivedAt: null
      },
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
        assignedTo: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [{ title: "asc" }]
    })
  ]);

  return serializeTaskWorkspace({
    task,
    users,
    sections,
    phases,
    dependencyCandidates
  });
}
