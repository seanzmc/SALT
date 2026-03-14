import { TaskStatus } from "@prisma/client";

import { prisma } from "@salt/db";
import type { DashboardActivityResponse, DashboardSummary } from "@salt/types";

function serializeDashboardTask(task: {
  id: string;
  title: string;
  dueDate: Date | null;
  updatedAt: Date;
  blockedReason: string | null;
  section: {
    id: string;
    slug: string;
    title: string;
  };
  assignedTo: {
    id: string;
    name: string;
  } | null;
}) {
  return {
    id: task.id,
    title: task.title,
    dueDate: task.dueDate?.toISOString() ?? null,
    updatedAt: task.updatedAt.toISOString(),
    blockedReason: task.blockedReason,
    section: task.section,
    assignedTo: task.assignedTo
  };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const now = new Date();
  const upcomingLimit = new Date(now);
  upcomingLimit.setDate(upcomingLimit.getDate() + 7);
  const staleLimit = new Date(now);
  staleLimit.setDate(staleLimit.getDate() - 7);

  const [tasks, recentDocuments, recentMessages, phases, budgetItems] = await Promise.all([
    prisma.task.findMany({
      where: { archivedAt: null },
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
        assignedToId: true,
        blockedReason: true,
        updatedAt: true,
        section: {
          select: {
            id: true,
            slug: true,
            title: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { dueDate: "asc" }
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
    }),
    prisma.timelinePhase.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        startDate: true,
        endDate: true,
        milestones: {
          select: {
            id: true
          }
        },
        tasks: {
          where: {
            archivedAt: null
          },
          select: {
            id: true
          }
        }
      },
      orderBy: { sortOrder: "asc" }
    }),
    prisma.budgetItem.findMany({
      select: {
        estimate: true,
        actual: true,
        openingPriority: true
      }
    })
  ]);

  const completedTasks = tasks.filter((task) => task.status === TaskStatus.COMPLETE).length;
  const inProgressTasks = tasks.filter((task) => task.status === TaskStatus.IN_PROGRESS).length;
  const notStartedTasks = tasks.filter((task) => task.status === TaskStatus.NOT_STARTED).length;
  const overdueTasks = tasks.filter(
    (task) => task.dueDate && task.dueDate < now && task.status !== TaskStatus.COMPLETE
  );
  const upcomingTasks = tasks.filter(
    (task) =>
      task.dueDate &&
      task.dueDate >= now &&
      task.dueDate <= upcomingLimit &&
      task.status !== TaskStatus.COMPLETE
  );
  const blockedTasks = tasks.filter((task) => task.status === TaskStatus.BLOCKED);
  const unassignedTasks = tasks.filter(
    (task) => task.assignedToId === null && task.status !== TaskStatus.COMPLETE
  );
  const staleTasks = tasks.filter(
    (task) => task.updatedAt < staleLimit && task.status !== TaskStatus.COMPLETE
  );
  const overdueByAssignee = overdueTasks.reduce<Record<string, number>>((acc, task) => {
    const key = task.assignedTo?.name ?? "Unassigned";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const estimatedTotal = budgetItems.reduce((sum, item) => sum + Number(item.estimate), 0);
  const actualTotal = budgetItems.reduce((sum, item) => sum + Number(item.actual), 0);
  const mustHaveTotal = budgetItems
    .filter((item) => item.openingPriority === "MUST_HAVE_BEFORE_OPENING")
    .reduce((sum, item) => sum + Number(item.estimate), 0);
  const optionalTotal = budgetItems
    .filter((item) => item.openingPriority !== "MUST_HAVE_BEFORE_OPENING")
    .reduce((sum, item) => sum + Number(item.estimate), 0);
  const completePhases = phases.filter((phase) => phase.status === "COMPLETE").length;
  const inProgressPhases = phases.filter((phase) => phase.status === "IN_PROGRESS").length;
  const blockedPhases = phases.filter((phase) => phase.status === "BLOCKED").length;
  const currentPhase = phases.find((phase) => phase.status !== "COMPLETE") ?? null;

  return {
    overallCompletion: tasks.length ? (completedTasks / tasks.length) * 100 : 0,
    progress: {
      totalTasks: tasks.length,
      completedTasks,
      activeTasks: tasks.length - completedTasks,
      inProgressTasks,
      notStartedTasks
    },
    queueCounts: {
      overdue: overdueTasks.length,
      upcoming: upcomingTasks.length,
      blocked: blockedTasks.length,
      unassigned: unassignedTasks.length,
      stale: staleTasks.length
    },
    budget: {
      itemCount: budgetItems.length,
      estimatedTotal,
      actualTotal,
      variance: actualTotal - estimatedTotal,
      mustHaveTotal,
      optionalTotal
    },
    timeline: {
      totalPhases: phases.length,
      completePhases,
      inProgressPhases,
      blockedPhases,
      currentPhase: currentPhase
        ? {
            id: currentPhase.id,
            title: currentPhase.title,
            status: currentPhase.status,
            startDate: currentPhase.startDate?.toISOString() ?? null,
            endDate: currentPhase.endDate?.toISOString() ?? null,
            taskCount: currentPhase.tasks.length,
            milestoneCount: currentPhase.milestones.length
          }
        : null
    },
    attention: {
      overdue: {
        count: overdueTasks.length,
        items: overdueTasks.slice(0, 4).map(serializeDashboardTask),
        breakdown: Object.entries(overdueByAssignee)
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5)
      },
      upcoming: {
        count: upcomingTasks.length,
        items: upcomingTasks.slice(0, 4).map(serializeDashboardTask)
      },
      blocked: {
        count: blockedTasks.length,
        items: blockedTasks.slice(0, 4).map(serializeDashboardTask)
      },
      unassigned: {
        count: unassignedTasks.length,
        items: unassignedTasks.slice(0, 4).map(serializeDashboardTask)
      },
      stale: {
        count: staleTasks.length,
        items: staleTasks.slice(0, 4).map(serializeDashboardTask)
      }
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

export async function getDashboardActivity(currentUserId: string): Promise<DashboardActivityResponse> {
  const activities = await prisma.activityLog.findMany({
    where: {
      dismissals: {
        none: {
          userId: currentUserId
        }
      }
    },
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
