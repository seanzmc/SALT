import { TaskStatus } from "@prisma/client";

import { prisma } from "@salt/db";
import type {
  SessionPayload,
  TaskArchiveInput,
  TaskBulkActionInput,
  TaskBulkActionResult,
  TaskCommentCreateInput,
  TaskDependencyCreateInput,
  TaskDependencyDeleteInput,
  TaskSubtaskArchiveInput,
  TaskSubtaskCreateInput,
  TaskSubtaskDeleteInput,
  TaskSubtaskUpdateInput,
  TaskWorkspaceData,
  TaskWorkspaceUpdateInput
} from "@salt/types";

import { logActivity } from "../activity/log.js";
import { DomainError } from "../shared/domain-error.js";
import { canEditSubtask, canEditTask } from "./policies.js";
import { getTaskWorkspace } from "./queries.js";

type Actor = SessionPayload["user"];

type TaskPermissionContext = {
  id: string;
  title: string;
  status: TaskStatus;
  assignedToId: string | null;
  archivedAt: Date | null;
};

type SubtaskPermissionContext = {
  id: string;
  taskId: string;
  title: string;
  assignedToId: string | null;
  sortOrder: number;
  archivedAt: Date | null;
  task: {
    assignedToId: string | null;
    archivedAt: Date | null;
  };
};

function parseOptionalDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function assertOwner(actor: Actor) {
  if (actor.role !== "OWNER_ADMIN") {
    throw new DomainError(403, "FORBIDDEN", "Owner access is required.");
  }
}

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

async function requireTaskEditor(taskId: string, actor: Actor) {
  const task = await getTaskPermissionContext(taskId);

  if (
    !canEditTask({
      role: actor.role,
      userId: actor.id,
      assignedToId: task.assignedToId
    })
  ) {
    throw new DomainError(
      403,
      "FORBIDDEN",
      "Collaborators can only edit tasks assigned to them."
    );
  }

  return task;
}

async function getSubtaskPermissionContext(subtaskId: string): Promise<SubtaskPermissionContext> {
  const subtask = await prisma.subtask.findUnique({
    where: { id: subtaskId },
    select: {
      id: true,
      taskId: true,
      title: true,
      assignedToId: true,
      sortOrder: true,
      archivedAt: true,
      task: {
        select: {
          assignedToId: true,
          archivedAt: true
        }
      }
    }
  });

  if (!subtask) {
    throw new DomainError(404, "NOT_FOUND", "Checklist item not found.");
  }

  return subtask;
}

async function requireSubtaskEditor(subtaskId: string, actor: Actor) {
  const subtask = await getSubtaskPermissionContext(subtaskId);

  if (
    !canEditSubtask({
      role: actor.role,
      userId: actor.id,
      assignedToId: subtask.assignedToId,
      parentTaskAssignedToId: subtask.task.assignedToId
    })
  ) {
    throw new DomainError(
      403,
      "FORBIDDEN",
      "Collaborators can only edit checklist items assigned to them or their task."
    );
  }

  return subtask;
}

async function archiveTasksWithSubtasks(taskIds: string[]) {
  const archivedAt = new Date();

  await prisma.$transaction([
    prisma.task.updateMany({
      where: {
        id: { in: taskIds },
        archivedAt: null
      },
      data: { archivedAt }
    }),
    prisma.subtask.updateMany({
      where: {
        taskId: { in: taskIds },
        archivedAt: null
      },
      data: { archivedAt }
    })
  ]);
}

async function restoreTasksWithSubtasks(taskIds: string[]) {
  await prisma.$transaction([
    prisma.task.updateMany({
      where: {
        id: { in: taskIds },
        archivedAt: { not: null }
      },
      data: { archivedAt: null }
    }),
    prisma.subtask.updateMany({
      where: {
        taskId: { in: taskIds }
      },
      data: { archivedAt: null }
    })
  ]);
}

export async function updateTaskCommand(input: {
  actor: Actor;
  payload: TaskWorkspaceUpdateInput;
}): Promise<TaskWorkspaceData> {
  const currentTask = await requireTaskEditor(input.payload.taskId, input.actor);

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

export async function archiveTaskCommand(input: {
  actor: Actor;
  payload: TaskArchiveInput;
}) {
  assertOwner(input.actor);
  const task = await getTaskPermissionContext(input.payload.taskId);

  if (!task.archivedAt) {
    await archiveTasksWithSubtasks([task.id]);

    await logActivity({
      actorId: input.actor.id,
      taskId: task.id,
      type: "TASK_UPDATED",
      entityType: "Task",
      entityId: task.id,
      description: `Archived task "${task.title}".`
    });
  }

  return getTaskWorkspace(task.id);
}

export async function restoreTaskCommand(input: {
  actor: Actor;
  payload: TaskArchiveInput;
}) {
  assertOwner(input.actor);
  const task = await getTaskPermissionContext(input.payload.taskId);

  if (task.archivedAt) {
    await restoreTasksWithSubtasks([task.id]);

    await logActivity({
      actorId: input.actor.id,
      taskId: task.id,
      type: "TASK_UPDATED",
      entityType: "Task",
      entityId: task.id,
      description: `Restored task "${task.title}".`
    });
  }

  return getTaskWorkspace(task.id);
}

export async function createTaskCommentCommand(input: {
  actor: Actor;
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

export async function createSubtaskCommand(input: {
  actor: Actor;
  payload: TaskSubtaskCreateInput;
}) {
  const task = await getTaskPermissionContext(input.payload.taskId);

  if (task.archivedAt) {
    throw new DomainError(409, "FORBIDDEN", "Restore the task before adding checklist items.");
  }

  if (input.actor.role !== "OWNER_ADMIN" && task.assignedToId !== input.actor.id) {
    throw new DomainError(
      403,
      "FORBIDDEN",
      "Collaborators can only add checklist items to tasks assigned to them."
    );
  }

  const lastSubtask = await prisma.subtask.findFirst({
    where: { taskId: input.payload.taskId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true }
  });

  const subtask = await prisma.subtask.create({
    data: {
      taskId: input.payload.taskId,
      title: input.payload.title.trim(),
      notes: input.payload.notes?.trim() || null,
      dueDate: parseOptionalDate(input.payload.dueDate),
      assignedToId:
        input.actor.role === "OWNER_ADMIN"
          ? input.payload.assignedToId ?? null
          : input.actor.id,
      sortOrder: (lastSubtask?.sortOrder ?? 0) + 1
    }
  });

  await logActivity({
    actorId: input.actor.id,
    taskId: task.id,
    type: "TASK_UPDATED",
    entityType: "Subtask",
    entityId: subtask.id,
    description: `Added checklist item "${subtask.title}".`
  });

  return getTaskWorkspace(task.id);
}

export async function updateSubtaskCommand(input: {
  actor: Actor;
  payload: TaskSubtaskUpdateInput;
}) {
  const currentSubtask = await requireSubtaskEditor(input.payload.subtaskId, input.actor);

  if (
    input.actor.role !== "OWNER_ADMIN" &&
    (input.payload.assignedToId ?? null) !== currentSubtask.assignedToId
  ) {
    throw new DomainError(
      403,
      "FORBIDDEN",
      "Only owner admins can change checklist item assignment."
    );
  }

  await prisma.subtask.update({
    where: { id: input.payload.subtaskId },
    data: {
      title: input.payload.title.trim(),
      notes: input.payload.notes?.trim() || null,
      dueDate: parseOptionalDate(input.payload.dueDate),
      assignedToId:
        input.actor.role === "OWNER_ADMIN"
          ? input.payload.assignedToId ?? null
          : currentSubtask.assignedToId,
      isComplete: input.payload.isComplete,
      sortOrder: input.payload.sortOrder
    }
  });

  await logActivity({
    actorId: input.actor.id,
    taskId: currentSubtask.taskId,
    type: "TASK_UPDATED",
    entityType: "Subtask",
    entityId: input.payload.subtaskId,
    description: `Updated checklist item "${input.payload.title.trim()}".`
  });

  return getTaskWorkspace(currentSubtask.taskId);
}

export async function deleteSubtaskCommand(input: {
  actor: Actor;
  payload: TaskSubtaskDeleteInput;
}) {
  const currentSubtask = await requireSubtaskEditor(input.payload.subtaskId, input.actor);

  await prisma.subtask.delete({
    where: { id: input.payload.subtaskId }
  });

  await logActivity({
    actorId: input.actor.id,
    taskId: currentSubtask.taskId,
    type: "TASK_UPDATED",
    entityType: "Subtask",
    entityId: input.payload.subtaskId,
    description: `Removed checklist item "${currentSubtask.title}".`
  });

  return getTaskWorkspace(currentSubtask.taskId);
}

export async function archiveSubtaskCommand(input: {
  actor: Actor;
  payload: TaskSubtaskArchiveInput;
}) {
  assertOwner(input.actor);
  const currentSubtask = await getSubtaskPermissionContext(input.payload.subtaskId);

  if (!currentSubtask.archivedAt) {
    await prisma.subtask.update({
      where: { id: input.payload.subtaskId },
      data: { archivedAt: new Date() }
    });

    await logActivity({
      actorId: input.actor.id,
      taskId: currentSubtask.taskId,
      type: "TASK_UPDATED",
      entityType: "Subtask",
      entityId: input.payload.subtaskId,
      description: `Archived checklist item "${currentSubtask.title}".`
    });
  }

  return getTaskWorkspace(currentSubtask.taskId);
}

export async function restoreSubtaskCommand(input: {
  actor: Actor;
  payload: TaskSubtaskArchiveInput;
}) {
  assertOwner(input.actor);
  const currentSubtask = await getSubtaskPermissionContext(input.payload.subtaskId);

  if (currentSubtask.archivedAt) {
    await prisma.subtask.update({
      where: { id: input.payload.subtaskId },
      data: { archivedAt: null }
    });

    await logActivity({
      actorId: input.actor.id,
      taskId: currentSubtask.taskId,
      type: "TASK_UPDATED",
      entityType: "Subtask",
      entityId: input.payload.subtaskId,
      description: `Restored checklist item "${currentSubtask.title}".`
    });
  }

  return getTaskWorkspace(currentSubtask.taskId);
}

export async function createTaskDependencyCommand(input: {
  actor: Actor;
  payload: TaskDependencyCreateInput;
}) {
  const task = await requireTaskEditor(input.payload.taskId, input.actor);

  if (task.archivedAt) {
    throw new DomainError(409, "FORBIDDEN", "Restore the task before adding new dependencies.");
  }

  const dependencyTask = await prisma.task.findUnique({
    where: { id: input.payload.dependsOnTaskId },
    select: { id: true, title: true }
  });

  if (!dependencyTask) {
    throw new DomainError(404, "NOT_FOUND", "Dependency task not found.");
  }

  const existingDependency = await prisma.taskDependency.findUnique({
    where: {
      taskId_dependsOnTaskId: {
        taskId: input.payload.taskId,
        dependsOnTaskId: input.payload.dependsOnTaskId
      }
    },
    select: { taskId: true }
  });

  if (existingDependency) {
    throw new DomainError(409, "VALIDATION_ERROR", "That dependency already exists.");
  }

  await prisma.taskDependency.create({
    data: {
      taskId: input.payload.taskId,
      dependsOnTaskId: input.payload.dependsOnTaskId
    }
  });

  await logActivity({
    actorId: input.actor.id,
    taskId: input.payload.taskId,
    type: "TASK_UPDATED",
    entityType: "TaskDependency",
    entityId: `${input.payload.taskId}:${input.payload.dependsOnTaskId}`,
    description: `Added dependency on "${dependencyTask.title}".`
  });

  return getTaskWorkspace(input.payload.taskId);
}

export async function deleteTaskDependencyCommand(input: {
  actor: Actor;
  payload: TaskDependencyDeleteInput;
}) {
  await requireTaskEditor(input.payload.taskId, input.actor);

  const dependencyTask = await prisma.task.findUnique({
    where: { id: input.payload.dependsOnTaskId },
    select: { title: true }
  });

  await prisma.taskDependency.delete({
    where: {
      taskId_dependsOnTaskId: {
        taskId: input.payload.taskId,
        dependsOnTaskId: input.payload.dependsOnTaskId
      }
    }
  });

  await logActivity({
    actorId: input.actor.id,
    taskId: input.payload.taskId,
    type: "TASK_UPDATED",
    entityType: "TaskDependency",
    entityId: `${input.payload.taskId}:${input.payload.dependsOnTaskId}`,
    description: dependencyTask
      ? `Removed dependency on "${dependencyTask.title}".`
      : "Removed a task dependency."
  });

  return getTaskWorkspace(input.payload.taskId);
}

export async function bulkUpdateTasksCommand(input: {
  actor: Actor;
  payload: TaskBulkActionInput;
}): Promise<TaskBulkActionResult> {
  assertOwner(input.actor);

  const tasks = await prisma.task.findMany({
    where: { id: { in: input.payload.taskIds } },
    select: {
      id: true,
      title: true,
      dueDate: true,
      archivedAt: true
    }
  });

  if (tasks.length !== input.payload.taskIds.length) {
    throw new DomainError(404, "NOT_FOUND", "One or more selected tasks could not be found.");
  }

  const actionableTasks =
    input.payload.action === "archive"
      ? tasks.filter((task) => !task.archivedAt)
      : input.payload.action === "restore"
        ? tasks.filter((task) => task.archivedAt)
        : tasks;

  if (actionableTasks.length === 0) {
    throw new DomainError(
      409,
      "VALIDATION_ERROR",
      input.payload.action === "archive"
        ? "All selected tasks are already archived."
        : input.payload.action === "restore"
          ? "All selected tasks are already active."
          : "No selected tasks could be updated."
    );
  }

  switch (input.payload.action) {
    case "assign":
      await prisma.task.updateMany({
        where: { id: { in: actionableTasks.map((task) => task.id) } },
        data: { assignedToId: input.payload.assignedToId ?? null }
      });
      break;
    case "clearAssignee":
      await prisma.task.updateMany({
        where: { id: { in: actionableTasks.map((task) => task.id) } },
        data: { assignedToId: null }
      });
      break;
    case "status":
      await prisma.task.updateMany({
        where: { id: { in: actionableTasks.map((task) => task.id) } },
        data: {
          status: input.payload.status,
          blockedReason:
            input.payload.status === "BLOCKED"
              ? input.payload.blockedReason?.trim() || null
              : null,
          completedAt: input.payload.status === "COMPLETE" ? new Date() : null
        }
      });
      break;
    case "priority":
      await prisma.task.updateMany({
        where: { id: { in: actionableTasks.map((task) => task.id) } },
        data: { priority: input.payload.priority }
      });
      break;
    case "setDueDate":
      await prisma.task.updateMany({
        where: { id: { in: actionableTasks.map((task) => task.id) } },
        data: { dueDate: parseOptionalDate(input.payload.dueDate) }
      });
      break;
    case "archive":
      await archiveTasksWithSubtasks(actionableTasks.map((task) => task.id));
      break;
    case "restore":
      await restoreTasksWithSubtasks(actionableTasks.map((task) => task.id));
      break;
  }

  const actionDescription =
    input.payload.action === "assign"
      ? "Bulk reassigned tasks."
      : input.payload.action === "clearAssignee"
        ? "Bulk cleared task owners."
        : input.payload.action === "status"
          ? `Bulk updated task status to ${input.payload.status}.`
          : input.payload.action === "priority"
            ? `Bulk updated task priority to ${input.payload.priority}.`
            : input.payload.action === "setDueDate"
              ? "Bulk set task due dates."
              : input.payload.action === "archive"
                ? "Bulk archived tasks."
                : "Bulk restored tasks.";

  await Promise.all(
    actionableTasks.map((task) =>
      logActivity({
        actorId: input.actor.id,
        taskId: task.id,
        type:
          input.payload.action === "status"
            ? "TASK_STATUS_CHANGED"
            : input.payload.action === "assign" || input.payload.action === "clearAssignee"
              ? "TASK_ASSIGNED"
              : "TASK_UPDATED",
        entityType: "Task",
        entityId: task.id,
        description: actionDescription
      })
    )
  );

  const skippedTaskIds = input.payload.taskIds.filter(
    (taskId) => !actionableTasks.some((task) => task.id === taskId)
  );
  const updatedLabel =
    input.payload.action === "archive"
      ? "Archived"
      : input.payload.action === "restore"
        ? "Restored"
        : "Updated";

  return {
    action: input.payload.action,
    updatedTaskIds: actionableTasks.map((task) => task.id),
    skippedTaskIds,
    message: `${updatedLabel} ${actionableTasks.length} task${
      actionableTasks.length === 1 ? "" : "s"
    }${
      skippedTaskIds.length > 0
        ? `. ${skippedTaskIds.length} already ${
            input.payload.action === "archive" ? "archived" : "active"
          } task${skippedTaskIds.length === 1 ? " was" : "s were"} skipped.`
        : "."
    }`
  };
}
