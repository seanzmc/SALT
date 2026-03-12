import { TaskStatus, type Prisma } from "@prisma/client";

import { prisma } from "@salt/db";
import type { TaskListFilters } from "@salt/types";

import { serializeTaskListResponse, serializeTaskWorkspace } from "./serializers.js";

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
      filters.status && filters.status !== "ALL" ? { status: filters.status } : {},
      filters.section ? { section: { slug: filters.section } } : {},
      filters.priority ? { priority: filters.priority } : {},
      filters.archived === "archived"
        ? { archivedAt: { not: null } }
        : filters.archived === "all"
          ? {}
          : { archivedAt: null },
      filters.assignee === "unassigned"
        ? { assignedToId: null }
        : filters.assignee === "me"
          ? { assignedToId: filters.currentUserId }
          : filters.assignee
            ? { assignedToId: filters.assignee }
            : {},
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

  const orderBy: Prisma.TaskOrderByWithRelationInput =
    filters.sort === "priority"
      ? { priority: "desc" }
      : filters.sort === "title"
        ? { title: "asc" }
        : filters.sort === "status"
          ? { status: "asc" }
          : { dueDate: "asc" };

  const [tasks, sections, users, phases, queueCounts] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        section: true,
        phase: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, name: true, role: true } },
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
