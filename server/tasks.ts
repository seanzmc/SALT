import { Prisma, TaskStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type TaskFilters = {
  q?: string;
  status?: TaskStatus | "ALL";
  section?: string;
  priority?: string;
  assignee?: string;
  queue?: "all" | "my-work" | "overdue" | "upcoming" | "blocked" | "unassigned";
  currentUserId?: string;
  sort?: "dueDate" | "priority" | "title" | "status";
};

export async function getTaskList(filters: TaskFilters = {}) {
  const now = new Date();
  const upcomingLimit = new Date(now);
  upcomingLimit.setDate(upcomingLimit.getDate() + 7);

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
      filters.priority ? { priority: filters.priority as never } : {},
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
          ? {
              dueDate: { lt: now },
              status: { not: TaskStatus.COMPLETE }
            }
          : filters.queue === "upcoming"
            ? {
                dueDate: {
                  gte: now,
                  lte: upcomingLimit
                },
                status: { not: TaskStatus.COMPLETE }
              }
            : filters.queue === "blocked"
              ? { status: TaskStatus.BLOCKED }
              : filters.queue === "unassigned"
                ? { assignedToId: null }
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

  const queueCountsPromise = Promise.all([
    prisma.task.count(),
    prisma.task.count({
      where: {
        assignedToId: filters.currentUserId ?? undefined,
        status: { not: TaskStatus.COMPLETE }
      }
    }),
    prisma.task.count({
      where: {
        dueDate: { lt: now },
        status: { not: TaskStatus.COMPLETE }
      }
    }),
    prisma.task.count({
      where: {
        dueDate: {
          gte: now,
          lte: upcomingLimit
        },
        status: { not: TaskStatus.COMPLETE }
      }
    }),
    prisma.task.count({
      where: { status: TaskStatus.BLOCKED }
    }),
    prisma.task.count({
      where: {
        assignedToId: null,
        status: { not: TaskStatus.COMPLETE }
      }
    })
  ]);

  const [tasks, sections, users, phases, queueCounts] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        section: true,
        phase: true,
        assignedTo: true,
        dependsOn: {
          include: {
            dependsOnTask: {
              select: { id: true, title: true, status: true }
            }
          }
        },
        taskDependencies: {
          include: {
            dependsOnTask: {
              select: { id: true, title: true, status: true }
            }
          }
        },
        taskTags: {
          include: { tag: true }
        }
      },
      orderBy
    }),
    prisma.section.findMany({
      orderBy: { sortOrder: "asc" }
    }),
    prisma.user.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true }
    }),
    prisma.timelinePhase.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, title: true }
    }),
    queueCountsPromise
  ]);

  return {
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
      unassigned: queueCounts[5]
    }
  };
}

export async function getTaskDetail(taskId: string) {
  return prisma.task.findUnique({
    where: { id: taskId },
    include: {
      section: true,
      phase: true,
      assignedTo: true,
      comments: {
        include: {
          author: true
        },
        orderBy: { createdAt: "desc" }
      },
      attachments: {
        include: {
          document: true
        }
      },
      subtasks: {
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { sortOrder: "asc" }
      },
      dependsOn: {
        include: {
          task: {
            select: {
              id: true,
              title: true,
              status: true,
              dueDate: true,
              assignedTo: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      },
      taskDependencies: {
        include: {
          dependsOnTask: {
            select: {
              id: true,
              title: true,
              status: true,
              dueDate: true,
              assignedTo: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      },
      taskTags: {
        include: { tag: true }
      }
    }
  });
}
