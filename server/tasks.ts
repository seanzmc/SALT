import { Prisma, TaskStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type TaskFilters = {
  q?: string;
  status?: TaskStatus | "ALL";
  section?: string;
  priority?: string;
  assignee?: string;
  currentUserId?: string;
  sort?: "dueDate" | "priority" | "title" | "status";
};

export async function getTaskList(filters: TaskFilters = {}) {
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

  const [tasks, sections, users, phases] = await Promise.all([
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
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true }
    }),
    prisma.timelinePhase.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, title: true }
    })
  ]);

  return { tasks, sections, users, phases };
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
