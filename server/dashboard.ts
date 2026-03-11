import { OpeningPriority, TaskStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function getDashboardData() {
  const now = new Date();

  const [
    tasks,
    sections,
    recentDocuments,
    recentMessages,
    phases,
    budgetItems,
    activities
  ] = await Promise.all([
    prisma.task.findMany({
      where: { archivedAt: null },
      include: {
        section: true,
        assignedTo: true
      },
      orderBy: { dueDate: "asc" }
    }),
    prisma.section.findMany({
      include: {
        tasks: {
          where: { archivedAt: null }
        }
      },
      orderBy: { sortOrder: "asc" }
    }),
    prisma.document.findMany({
      include: { uploadedBy: true },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.message.findMany({
      include: {
        author: true,
        thread: true
      },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.timelinePhase.findMany({
      include: {
        milestones: true,
        tasks: {
          where: { archivedAt: null }
        }
      },
      orderBy: { sortOrder: "asc" }
    }),
    prisma.budgetItem.findMany({
      include: { category: true }
    }),
    prisma.activityLog.findMany({
      include: {
        actor: true
      },
      orderBy: { createdAt: "desc" },
      take: 8
    })
  ]);

  const completedTasks = tasks.filter((task) => task.status === TaskStatus.COMPLETE).length;
  const overallCompletion = tasks.length ? (completedTasks / tasks.length) * 100 : 0;
  const overdueTasks = tasks.filter(
    (task) => task.dueDate && task.dueDate < now && task.status !== TaskStatus.COMPLETE
  );
  const upcomingTasks = tasks.filter(
    (task) =>
      task.dueDate &&
      task.dueDate >= now &&
      task.status !== TaskStatus.COMPLETE
  ).slice(0, 8);
  const blockedTasks = tasks.filter((task) => task.status === TaskStatus.BLOCKED);
  const recentlyCompletedTasks = tasks
    .filter((task) => task.status === TaskStatus.COMPLETE)
    .slice(0, 6);

  const estimatedTotal = budgetItems.reduce((sum, item) => sum + Number(item.estimate), 0);
  const actualTotal = budgetItems.reduce((sum, item) => sum + Number(item.actual), 0);
  const mustHaveTotal = budgetItems
    .filter((item) => item.openingPriority === OpeningPriority.MUST_HAVE_BEFORE_OPENING)
    .reduce((sum, item) => sum + Number(item.estimate), 0);
  const optionalTotal = budgetItems
    .filter((item) => item.openingPriority !== OpeningPriority.MUST_HAVE_BEFORE_OPENING)
    .reduce((sum, item) => sum + Number(item.estimate), 0);

  const sectionProgress = sections.map((section) => {
    const complete = section.tasks.filter((task) => task.status === TaskStatus.COMPLETE).length;
    const total = section.tasks.length;

    return {
      id: section.id,
      slug: section.slug,
      title: section.title,
      complete,
      total,
      percent: total ? (complete / total) * 100 : 0
    };
  });

  return {
    overallCompletion,
    overdueTasks,
    upcomingTasks,
    blockedTasks,
    recentlyCompletedTasks,
    recentDocuments,
    recentMessages,
    phases,
    activities,
    sectionProgress,
    budgetSummary: {
      estimatedTotal,
      actualTotal,
      variance: actualTotal - estimatedTotal,
      mustHaveTotal,
      optionalTotal
    }
  };
}
