"use server";

import { ActivityType, Role, TaskStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import {
  budgetUpdateSchema,
  messageSchema,
  taskCommentSchema,
  taskUpdateSchema,
  timelineUpdateSchema
} from "@/lib/validators";
import { logActivity } from "@/server/activity";
import { requireSession } from "@/server/authz";

function parseDate(value?: string | null) {
  return value ? new Date(value) : null;
}

export async function updateTaskAction(formData: FormData) {
  const session = await requireSession();
  const parsed = taskUpdateSchema.parse(Object.fromEntries(formData));

  const currentTask = await prisma.task.findUnique({
    where: { id: parsed.taskId },
    select: { id: true, title: true, status: true, assignedToId: true }
  });

  if (!currentTask) {
    throw new Error("Task not found.");
  }

  if (
    session.user.role !== Role.OWNER_ADMIN &&
    currentTask.assignedToId !== session.user.id
  ) {
    throw new Error("Collaborators can only edit tasks assigned to them.");
  }

  if (
    session.user.role !== Role.OWNER_ADMIN &&
    (parsed.assignedToId || null) !== currentTask.assignedToId
  ) {
    throw new Error("Only owner admins can change task assignment.");
  }

  await prisma.task.update({
    where: { id: parsed.taskId },
    data: {
      title: parsed.title,
      description: parsed.description || null,
      notes: parsed.notes || null,
      status: parsed.status,
      priority: parsed.priority,
      openingPriority: parsed.openingPriority,
      dueDate: parseDate(parsed.dueDate),
      assignedToId: parsed.assignedToId || null,
      blockedReason: parsed.blockedReason || null,
      completedAt: parsed.status === TaskStatus.COMPLETE ? new Date() : null
    }
  });

  await logActivity({
    actorId: session.user.id,
    taskId: parsed.taskId,
    type:
      currentTask.status !== parsed.status
        ? ActivityType.TASK_STATUS_CHANGED
        : ActivityType.TASK_UPDATED,
    entityType: "Task",
    entityId: parsed.taskId,
    description:
      currentTask.status !== parsed.status
        ? `Changed task status from ${currentTask.status} to ${parsed.status}.`
        : `Updated task "${parsed.title}".`
  });

  if (currentTask.assignedToId !== (parsed.assignedToId || null)) {
    await logActivity({
      actorId: session.user.id,
      taskId: parsed.taskId,
      type: ActivityType.TASK_ASSIGNED,
      entityType: "Task",
      entityId: parsed.taskId,
      description: "Updated task assignment."
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/checklists");
  revalidatePath(`/checklists/${parsed.taskId}`);
}

export async function createTaskCommentAction(formData: FormData) {
  const session = await requireSession();
  const parsed = taskCommentSchema.parse(Object.fromEntries(formData));

  const comment = await prisma.taskComment.create({
    data: {
      taskId: parsed.taskId,
      authorId: session.user.id,
      content: parsed.content
    }
  });

  await logActivity({
    actorId: session.user.id,
    taskId: parsed.taskId,
    type: ActivityType.TASK_COMMENTED,
    entityType: "TaskComment",
    entityId: comment.id,
    description: "Added a task comment."
  });

  revalidatePath(`/checklists/${parsed.taskId}`);
  revalidatePath("/dashboard");
}

export async function updateBudgetItemAction(formData: FormData) {
  const session = await requireSession();
  const parsed = budgetUpdateSchema.parse(Object.fromEntries(formData));

  if (session.user.role !== Role.OWNER_ADMIN) {
    throw new Error("Only owner admins can update budget actuals.");
  }

  await prisma.budgetItem.update({
    where: { id: parsed.itemId },
    data: {
      actual: parsed.actual,
      vendor: parsed.vendor || null,
      paidStatus: parsed.paidStatus,
      notes: parsed.notes || null
    }
  });

  await logActivity({
    actorId: session.user.id,
    type: ActivityType.BUDGET_UPDATED,
    entityType: "BudgetItem",
    entityId: parsed.itemId,
    description: "Updated budget item actuals or payment status."
  });

  revalidatePath("/budget");
  revalidatePath("/dashboard");
}

export async function updateTimelinePhaseAction(formData: FormData) {
  const session = await requireSession();
  const parsed = timelineUpdateSchema.parse(Object.fromEntries(formData));

  await prisma.timelinePhase.update({
    where: { id: parsed.phaseId },
    data: {
      status: parsed.status,
      notes: parsed.notes || null,
      blockers: parsed.blockers || null,
      startDate: parseDate(parsed.startDate),
      endDate: parseDate(parsed.endDate)
    }
  });

  await logActivity({
    actorId: session.user.id,
    type: ActivityType.TIMELINE_UPDATED,
    entityType: "TimelinePhase",
    entityId: parsed.phaseId,
    description: "Updated timeline phase status or dates."
  });

  revalidatePath("/timeline");
  revalidatePath("/dashboard");
}

export async function createMessageAction(formData: FormData) {
  const session = await requireSession();
  const parsed = messageSchema.parse(Object.fromEntries(formData));

  const message = await prisma.message.create({
    data: {
      threadId: parsed.threadId,
      authorId: session.user.id,
      content: parsed.content
    }
  });

  await prisma.messageThread.update({
    where: { id: parsed.threadId },
    data: { updatedAt: new Date() }
  });

  await logActivity({
    actorId: session.user.id,
    type: ActivityType.MESSAGE_POSTED,
    entityType: "Message",
    entityId: message.id,
    description: "Posted a message in the internal board."
  });

  revalidatePath("/messages");
  revalidatePath("/dashboard");
}
