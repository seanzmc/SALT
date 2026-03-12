import { TaskStatus } from "@prisma/client";

import { prisma } from "@salt/db";
import type {
  SessionPayload,
  TaskCommentCreateInput,
  TaskWorkspaceData,
  TaskWorkspaceUpdateInput
} from "@salt/types";

import { logActivity } from "../activity/log";
import { DomainError } from "../shared/domain-error";
import { canEditTask } from "./policies";
import { getTaskWorkspace } from "./queries";

type TaskPermissionContext = {
  id: string;
  title: string;
  status: TaskStatus;
  assignedToId: string | null;
  archivedAt: Date | null;
};

async function getTaskPermissionContext(taskId: string): Promise<TaskPermissionContext> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      title: true,
      status: true,
      assignedToId: true,
      archivedAt: true
    }
  });

  if (!task) {
    throw new DomainError(404, "NOT_FOUND", "Task not found.");
  }

  return task;
}

export async function updateTaskCommand(input: {
  actor: SessionPayload["user"];
  payload: TaskWorkspaceUpdateInput;
}): Promise<TaskWorkspaceData> {
  const currentTask = await getTaskPermissionContext(input.payload.taskId);

  if (
    !canEditTask({
      role: input.actor.role,
      userId: input.actor.id,
      assignedToId: currentTask.assignedToId
    })
  ) {
    throw new DomainError(
      403,
      "FORBIDDEN",
      "Collaborators can only edit tasks assigned to them."
    );
  }

  if (
    input.actor.role !== "OWNER_ADMIN" &&
    (input.payload.assignedToId ?? null) !== currentTask.assignedToId
  ) {
    throw new DomainError(
      403,
      "FORBIDDEN",
      "Only owner admins can change task assignment."
    );
  }

  const blockedReason =
    input.payload.status === "BLOCKED"
      ? input.payload.blockedReason?.trim() || null
      : null;

  await prisma.task.update({
    where: { id: input.payload.taskId },
    data: {
      status: input.payload.status,
      priority: input.payload.priority,
      assignedToId:
        input.actor.role === "OWNER_ADMIN"
          ? input.payload.assignedToId ?? null
          : currentTask.assignedToId,
      blockedReason,
      completedAt:
        input.payload.status === "COMPLETE"
          ? new Date()
          : input.payload.status === currentTask.status
            ? undefined
            : null
    }
  });

  await logActivity({
    actorId: input.actor.id,
    taskId: input.payload.taskId,
    type:
      currentTask.status !== input.payload.status
        ? "TASK_STATUS_CHANGED"
        : "TASK_UPDATED",
    entityType: "Task",
    entityId: input.payload.taskId,
    description:
      currentTask.status !== input.payload.status
        ? `Changed task status from ${currentTask.status} to ${input.payload.status}.`
        : `Updated task "${currentTask.title}".`
  });

  if (
    input.actor.role === "OWNER_ADMIN" &&
    currentTask.assignedToId !== (input.payload.assignedToId ?? null)
  ) {
    await logActivity({
      actorId: input.actor.id,
      taskId: input.payload.taskId,
      type: "TASK_ASSIGNED",
      entityType: "Task",
      entityId: input.payload.taskId,
      description: "Updated task assignment."
    });
  }

  return getTaskWorkspace(input.payload.taskId);
}

export async function createTaskCommentCommand(input: {
  actor: SessionPayload["user"];
  payload: TaskCommentCreateInput;
}) {
  await getTaskPermissionContext(input.payload.taskId);

  const comment = await prisma.taskComment.create({
    data: {
      taskId: input.payload.taskId,
      authorId: input.actor.id,
      content: input.payload.content.trim()
    },
    include: {
      author: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  await logActivity({
    actorId: input.actor.id,
    taskId: input.payload.taskId,
    type: "TASK_COMMENTED",
    entityType: "TaskComment",
    entityId: comment.id,
    description: "Added a task comment."
  });

  return {
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    author: {
      id: comment.author.id,
      name: comment.author.name
    }
  };
}
