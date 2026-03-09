import { Prisma, TaskStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type TaskFilters = {
  q?: string;
  status?: TaskStatus | "ALL";
  section?: string;
  priority?: string;
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
      filters.priority ? { priority: filters.priority as never } : {}
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

  const [tasks, sections, users] = await Promise.all([
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
    })
  ]);

  return { tasks, sections, users };
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
        orderBy: { sortOrder: "asc" }
      },
      dependsOn: {
        include: {
          dependsOnTask: {
            select: {
              id: true,
              title: true,
              status: true
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
              status: true
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
