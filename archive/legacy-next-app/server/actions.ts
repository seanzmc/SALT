"use server";

import { ActivityType, Role, TaskStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { compare, hash } from "bcryptjs";
import { ZodError } from "zod";

import { sendPasswordResetEmail } from "@/lib/mail";
import {
  createPasswordResetToken,
  getPasswordResetTokenRecord,
  getPasswordResetUrl
} from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";
import {
  adminCreateUserSchema,
  adminDeactivateUserSchema,
  adminReactivateUserSchema,
  adminResetStatusesSchema,
  adminSubtaskSetupSchema,
  adminTaskSetupSchema,
  adminUpdateUserSchema,
  accountEmailSchema,
  accountPasswordSchema,
  bulkTaskActionSchema,
  budgetUpdateSchema,
  forgotPasswordSchema,
  messageSchema,
  resetPasswordSchema,
  subtaskCreateSchema,
  subtaskDeleteSchema,
  subtaskUpdateSchema,
  subtaskArchiveSchema,
  taskDocumentLinkSchema,
  taskDocumentUnlinkSchema,
  taskArchiveSchema,
  taskDependencyCreateSchema,
  taskDependencyDeleteSchema,
  taskCommentSchema,
  taskCreateSchema,
  taskDeleteSchema,
  taskUpdateSchema,
  timelineUpdateSchema
} from "@/lib/validators";
import { logActivity } from "@/server/activity";
import { requireOwner, requireSession } from "@/server/authz";

function parseDate(value?: string | null) {
  return value ? new Date(value) : null;
}

type AccountActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

function validationErrorState(error: unknown): AccountActionState {
  if (error instanceof ZodError) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: error.flatten().fieldErrors
    };
  }

  return {
    status: "error",
    message: "Unable to save changes right now."
  };
}

const genericPasswordResetMessage =
  "If an account matches that email, a password reset link has been sent.";

function successState(message: string): AccountActionState {
  return {
    status: "success",
    message
  };
}

async function getTaskAccessContext(taskId: string) {
  return prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      title: true,
      status: true,
      archivedAt: true,
      sectionId: true,
      phaseId: true,
      assignedToId: true,
      thread: {
        select: {
          id: true
        }
      }
    }
  });
}

async function requireTaskEditPermission(taskId: string, user: { id: string; role: Role }) {
  const task = await getTaskAccessContext(taskId);

  if (!task) {
    throw new Error("Task not found.");
  }

  if (user.role !== Role.OWNER_ADMIN && task.assignedToId !== user.id) {
    throw new Error("Collaborators can only edit tasks assigned to them.");
  }

  return task;
}

async function getSubtaskAccessContext(subtaskId: string) {
  return prisma.subtask.findUnique({
    where: { id: subtaskId },
    select: {
      id: true,
      title: true,
      assignedToId: true,
      taskId: true,
      task: {
        select: {
          assignedToId: true
        }
      }
    }
  });
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

export async function updateTaskAction(formData: FormData) {
  const session = await requireSession();
  const parsed = taskUpdateSchema.parse(Object.fromEntries(formData));

  const currentTask = await requireTaskEditPermission(parsed.taskId, session.user);

  if (
    session.user.role !== Role.OWNER_ADMIN &&
    (parsed.assignedToId || null) !== currentTask.assignedToId
  ) {
    throw new Error("Only owner admins can change task assignment.");
  }

  if (
    session.user.role !== Role.OWNER_ADMIN &&
    (parsed.sectionId !== currentTask.sectionId ||
      (parsed.phaseId || null) !== currentTask.phaseId)
  ) {
    throw new Error("Only owner admins can change section or phase.");
  }

  await prisma.task.update({
    where: { id: parsed.taskId },
    data: {
      sectionId: parsed.sectionId,
      phaseId: parsed.phaseId || null,
      title: parsed.title,
      description: parsed.description || null,
      notes: parsed.notes || null,
      status: parsed.status,
      priority: parsed.priority,
      openingPriority: parsed.openingPriority,
      dueDate: parseDate(parsed.dueDate),
      assignedToId: parsed.assignedToId || null,
      blockedReason:
        parsed.status === TaskStatus.BLOCKED ? parsed.blockedReason?.trim() || null : null,
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
  revalidatePath("/settings/setup");
}

export async function updateTaskFeedbackAction(
  _previousState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  try {
    await updateTaskAction(formData);
    return successState("Task details saved.");
  } catch (error) {
    return validationErrorState(error);
  }
}

export async function bulkUpdateTasksAction(
  _previousState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const session = await requireOwner();

  try {
    const parsed = bulkTaskActionSchema.parse({
      taskIds: formData.getAll("taskIds"),
      action: formData.get("action"),
      assignedToId: formData.get("assignedToId"),
      status: formData.get("status") || undefined,
      priority: formData.get("priority") || undefined,
      dueDate: formData.get("dueDate"),
      shiftDays: formData.get("shiftDays") || undefined,
      blockedReason: formData.get("blockedReason")
    });

    const tasks = await prisma.task.findMany({
      where: { id: { in: parsed.taskIds } },
      select: {
        id: true,
        title: true,
        dueDate: true,
        archivedAt: true
      }
    });

    if (tasks.length !== parsed.taskIds.length) {
      return {
        status: "error",
        message: "One or more selected tasks could not be found."
      };
    }

    const actionableTasks =
      parsed.action === "archive"
        ? tasks.filter((task) => !task.archivedAt)
        : parsed.action === "restore"
          ? tasks.filter((task) => task.archivedAt)
          : tasks;

    if (actionableTasks.length === 0) {
      return {
        status: "error",
        message:
          parsed.action === "archive"
            ? "All selected tasks are already archived."
            : parsed.action === "restore"
              ? "All selected tasks are already active."
              : "No selected tasks could be updated."
      };
    }

    switch (parsed.action) {
      case "assign":
        await prisma.task.updateMany({
          where: { id: { in: parsed.taskIds } },
          data: { assignedToId: parsed.assignedToId || null }
        });
        break;
      case "clearAssignee":
        await prisma.task.updateMany({
          where: { id: { in: parsed.taskIds } },
          data: { assignedToId: null }
        });
        break;
      case "status":
        await prisma.task.updateMany({
          where: { id: { in: parsed.taskIds } },
          data: {
            status: parsed.status,
            blockedReason:
              parsed.status === TaskStatus.BLOCKED ? parsed.blockedReason?.trim() || null : null,
            completedAt: parsed.status === TaskStatus.COMPLETE ? new Date() : null
          }
        });
        break;
      case "priority":
        await prisma.task.updateMany({
          where: { id: { in: parsed.taskIds } },
          data: { priority: parsed.priority }
        });
        break;
      case "setDueDate":
        await prisma.task.updateMany({
          where: { id: { in: parsed.taskIds } },
          data: { dueDate: parseDate(parsed.dueDate) }
        });
        break;
      case "shiftDueDate":
        await prisma.$transaction(
          tasks.map((task) =>
            prisma.task.update({
              where: { id: task.id },
              data: {
                dueDate: task.dueDate
                  ? new Date(task.dueDate.getTime() + Number(parsed.shiftDays) * 86400000)
                  : null
              }
            })
          )
        );
        break;
      case "markComplete":
        await prisma.task.updateMany({
          where: { id: { in: parsed.taskIds } },
          data: {
            status: TaskStatus.COMPLETE,
            completedAt: new Date(),
            blockedReason: null
          }
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
      parsed.action === "assign"
        ? "Bulk reassigned tasks."
        : parsed.action === "clearAssignee"
          ? "Bulk cleared task owners."
          : parsed.action === "status"
            ? `Bulk updated task status to ${parsed.status}.`
            : parsed.action === "priority"
              ? `Bulk updated task priority to ${parsed.priority}.`
              : parsed.action === "setDueDate"
                ? "Bulk set task due dates."
                : parsed.action === "shiftDueDate"
                  ? `Bulk shifted task due dates by ${parsed.shiftDays} days.`
                  : parsed.action === "archive"
                    ? "Bulk archived tasks."
                    : parsed.action === "restore"
                      ? "Bulk restored tasks."
                      : "Bulk marked tasks complete.";

    await Promise.all(
      actionableTasks.map((task) =>
        logActivity({
          actorId: session.user.id,
          taskId: task.id,
          type:
            parsed.action === "status" || parsed.action === "markComplete"
              ? ActivityType.TASK_STATUS_CHANGED
              : parsed.action === "assign" || parsed.action === "clearAssignee"
                ? ActivityType.TASK_ASSIGNED
                : ActivityType.TASK_UPDATED,
          entityType: "Task",
          entityId: task.id,
          description: actionDescription
        })
      )
    );

    revalidatePath("/dashboard");
    revalidatePath("/checklists");
    revalidatePath("/settings/setup");
    actionableTasks.forEach((task) => {
      revalidatePath(`/checklists/${task.id}`);
    });

    const skippedCount = parsed.taskIds.length - actionableTasks.length;
    const updatedLabel =
      parsed.action === "archive"
        ? "Archived"
        : parsed.action === "restore"
          ? "Restored"
          : "Updated";

    return successState(
      `${updatedLabel} ${actionableTasks.length} task${actionableTasks.length === 1 ? "" : "s"}${
        skippedCount > 0
          ? `. ${skippedCount} already ${parsed.action === "archive" ? "archived" : "active"} ${skippedCount === 1 ? "task was" : "tasks were"} skipped.`
          : "."
      }`
    );
  } catch (error) {
    return validationErrorState(error);
  }
}

export async function createTaskAction(formData: FormData) {
  const session = await requireOwner();
  const parsed = taskCreateSchema.parse(Object.fromEntries(formData));

  const task = await prisma.task.create({
    data: {
      sectionId: parsed.sectionId,
      phaseId: parsed.phaseId || null,
      createdById: session.user.id,
      assignedToId: parsed.assignedToId || null,
      title: parsed.title,
      description: parsed.description || null,
      notes: parsed.notes || null,
      priority: parsed.priority,
      openingPriority: parsed.openingPriority,
      dueDate: parseDate(parsed.dueDate)
    }
  });

  await logActivity({
    actorId: session.user.id,
    taskId: task.id,
    type: ActivityType.TASK_CREATED,
    entityType: "Task",
    entityId: task.id,
    description: `Created task "${task.title}".`
  });

  if (task.assignedToId) {
    await logActivity({
      actorId: session.user.id,
      taskId: task.id,
      type: ActivityType.TASK_ASSIGNED,
      entityType: "Task",
      entityId: task.id,
      description: "Assigned task during creation."
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/checklists");
  revalidatePath("/settings/setup");

  redirect(`/checklists/${task.id}`);
}

export async function deleteTaskAction(formData: FormData) {
  const session = await requireOwner();
  const parsed = taskDeleteSchema.parse(Object.fromEntries(formData));
  const task = await getTaskAccessContext(parsed.taskId);

  if (!task) {
    throw new Error("Task not found.");
  }

  await prisma.$transaction(async (tx) => {
    if (task.thread?.id) {
      await tx.messageThread.delete({
        where: { id: task.thread.id }
      });
    }

    await tx.task.delete({
      where: { id: parsed.taskId }
    });
  });

  await logActivity({
    actorId: session.user.id,
    type: ActivityType.TASK_UPDATED,
    entityType: "Task",
    entityId: parsed.taskId,
    description: `Deleted task "${task.title}".`
  });

  revalidatePath("/dashboard");
  revalidatePath("/checklists");
  revalidatePath("/settings/setup");

  redirect("/checklists");
}

export async function archiveTaskAction(formData: FormData) {
  const session = await requireOwner();
  const parsed = taskArchiveSchema.parse(Object.fromEntries(formData));
  const task = await getTaskAccessContext(parsed.taskId);

  if (!task) {
    throw new Error("Task not found.");
  }

  await archiveTasksWithSubtasks([parsed.taskId]);

  await logActivity({
    actorId: session.user.id,
    taskId: parsed.taskId,
    type: ActivityType.TASK_UPDATED,
    entityType: "Task",
    entityId: parsed.taskId,
    description: `Archived task "${task.title}".`
  });

  revalidatePath("/dashboard");
  revalidatePath("/checklists");
  revalidatePath(`/checklists/${parsed.taskId}`);
  revalidatePath("/settings/setup");

  redirect("/checklists");
}

export async function restoreTaskAction(formData: FormData) {
  const session = await requireOwner();
  const parsed = taskArchiveSchema.parse(Object.fromEntries(formData));
  const task = await prisma.task.findUnique({
    where: { id: parsed.taskId },
    select: { id: true, title: true, archivedAt: true }
  });

  if (!task) {
    throw new Error("Task not found.");
  }

  await restoreTasksWithSubtasks([parsed.taskId]);

  await logActivity({
    actorId: session.user.id,
    taskId: parsed.taskId,
    type: ActivityType.TASK_UPDATED,
    entityType: "Task",
    entityId: parsed.taskId,
    description: `Restored task "${task.title}".`
  });

  revalidatePath("/dashboard");
  revalidatePath("/checklists");
  revalidatePath(`/checklists/${parsed.taskId}`);
  revalidatePath("/settings/setup");
}

export async function linkTaskDocumentAction(formData: FormData) {
  const session = await requireSession();
  const parsed = taskDocumentLinkSchema.parse(Object.fromEntries(formData));
  const task = await requireTaskEditPermission(parsed.taskId, session.user);

  if (task.archivedAt) {
    throw new Error("Archived tasks cannot receive new document attachments.");
  }

  const document = await prisma.document.findUnique({
    where: { id: parsed.documentId },
    select: {
      id: true,
      title: true,
      linkedTaskId: true
    }
  });

  if (!document) {
    throw new Error("Document not found.");
  }

  await prisma.$transaction(async (tx) => {
    const existing = await tx.taskAttachment.findUnique({
      where: {
        taskId_documentId: {
          taskId: parsed.taskId,
          documentId: parsed.documentId
        }
      }
    });

    if (!existing) {
      await tx.taskAttachment.create({
        data: {
          taskId: parsed.taskId,
          documentId: parsed.documentId
        }
      });
    }

    if (!document.linkedTaskId) {
      await tx.document.update({
        where: { id: parsed.documentId },
        data: { linkedTaskId: parsed.taskId }
      });
    }
  });

  await logActivity({
    actorId: session.user.id,
    taskId: parsed.taskId,
    type: ActivityType.TASK_UPDATED,
    entityType: "TaskAttachment",
    entityId: parsed.documentId,
    description: `Linked document "${document.title}" to the task.`
  });

  revalidatePath("/documents");
  revalidatePath("/dashboard");
  revalidatePath("/checklists");
  revalidatePath(`/checklists/${parsed.taskId}`);
}

export async function linkTaskDocumentFeedbackAction(
  _previousState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  try {
    await linkTaskDocumentAction(formData);
    return successState("Document linked to the task.");
  } catch (error) {
    return validationErrorState(error);
  }
}

export async function unlinkTaskDocumentAction(formData: FormData) {
  const session = await requireSession();
  const parsed = taskDocumentUnlinkSchema.parse(Object.fromEntries(formData));
  const task = await requireTaskEditPermission(parsed.taskId, session.user);

  const document = await prisma.document.findUnique({
    where: { id: parsed.documentId },
    select: {
      id: true,
      title: true,
      linkedTaskId: true
    }
  });

  if (!document) {
    throw new Error("Document not found.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.taskAttachment.deleteMany({
      where: {
        taskId: parsed.taskId,
        documentId: parsed.documentId
      }
    });

    if (document.linkedTaskId === parsed.taskId) {
      const remainingAttachment = await tx.taskAttachment.findFirst({
        where: {
          documentId: parsed.documentId,
          taskId: { not: parsed.taskId }
        },
        select: {
          taskId: true
        }
      });

      await tx.document.update({
        where: { id: parsed.documentId },
        data: {
          linkedTaskId: remainingAttachment?.taskId ?? null
        }
      });
    }
  });

  await logActivity({
    actorId: session.user.id,
    taskId: task.id,
    type: ActivityType.TASK_UPDATED,
    entityType: "TaskAttachment",
    entityId: parsed.documentId,
    description: `Unlinked document "${document.title}" from the task.`
  });

  revalidatePath("/documents");
  revalidatePath("/dashboard");
  revalidatePath("/checklists");
  revalidatePath(`/checklists/${parsed.taskId}`);
}

export async function unlinkTaskDocumentFeedbackAction(
  _previousState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  try {
    await unlinkTaskDocumentAction(formData);
    return successState("Document unlinked from the task.");
  } catch (error) {
    return validationErrorState(error);
  }
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

export async function createTaskDependencyAction(formData: FormData) {
  const session = await requireSession();
  const parsed = taskDependencyCreateSchema.parse(Object.fromEntries(formData));
  const task = await requireTaskEditPermission(parsed.taskId, session.user);

  if (task.archivedAt) {
    throw new Error("Restore the task before adding new dependencies.");
  }

  const dependencyTask = await prisma.task.findUnique({
    where: { id: parsed.dependsOnTaskId },
    select: { id: true, title: true, status: true }
  });

  if (!dependencyTask) {
    throw new Error("Dependency task not found.");
  }

  const existingDependency = await prisma.taskDependency.findUnique({
    where: {
      taskId_dependsOnTaskId: {
        taskId: parsed.taskId,
        dependsOnTaskId: parsed.dependsOnTaskId
      }
    },
    select: { taskId: true }
  });

  if (existingDependency) {
    throw new Error("That dependency already exists.");
  }

  await prisma.taskDependency.create({
    data: {
      taskId: parsed.taskId,
      dependsOnTaskId: parsed.dependsOnTaskId
    }
  });

  await logActivity({
    actorId: session.user.id,
    taskId: parsed.taskId,
    type: ActivityType.TASK_UPDATED,
    entityType: "TaskDependency",
    entityId: `${parsed.taskId}:${parsed.dependsOnTaskId}`,
    description: `Added dependency on "${dependencyTask.title}".`
  });

  revalidatePath("/checklists");
  revalidatePath(`/checklists/${parsed.taskId}`);
  revalidatePath(`/checklists/${parsed.dependsOnTaskId}`);
  revalidatePath("/dashboard");
}

export async function createTaskDependencyFeedbackAction(
  _previousState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  try {
    await createTaskDependencyAction(formData);
    return successState("Dependency added.");
  } catch (error) {
    return validationErrorState(error);
  }
}

export async function deleteTaskDependencyAction(formData: FormData) {
  const session = await requireSession();
  const parsed = taskDependencyDeleteSchema.parse(Object.fromEntries(formData));
  await requireTaskEditPermission(parsed.taskId, session.user);

  const dependencyTask = await prisma.task.findUnique({
    where: { id: parsed.dependsOnTaskId },
    select: { title: true }
  });

  await prisma.taskDependency.delete({
    where: {
      taskId_dependsOnTaskId: {
        taskId: parsed.taskId,
        dependsOnTaskId: parsed.dependsOnTaskId
      }
    }
  });

  await logActivity({
    actorId: session.user.id,
    taskId: parsed.taskId,
    type: ActivityType.TASK_UPDATED,
    entityType: "TaskDependency",
    entityId: `${parsed.taskId}:${parsed.dependsOnTaskId}`,
    description: dependencyTask
      ? `Removed dependency on "${dependencyTask.title}".`
      : "Removed a task dependency."
  });

  revalidatePath("/checklists");
  revalidatePath(`/checklists/${parsed.taskId}`);
  revalidatePath(`/checklists/${parsed.dependsOnTaskId}`);
  revalidatePath("/dashboard");
}

export async function deleteTaskDependencyFeedbackAction(
  _previousState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  try {
    await deleteTaskDependencyAction(formData);
    return successState("Dependency removed.");
  } catch (error) {
    return validationErrorState(error);
  }
}

export async function createSubtaskAction(formData: FormData) {
  const session = await requireSession();
  const parsed = subtaskCreateSchema.parse(Object.fromEntries(formData));
  const task = await getTaskAccessContext(parsed.taskId);

  if (!task) {
    throw new Error("Task not found.");
  }

  if (task.archivedAt) {
    throw new Error("Restore the task before adding checklist items.");
  }

  if (
    session.user.role !== Role.OWNER_ADMIN &&
    task.assignedToId !== session.user.id
  ) {
    throw new Error("Collaborators can only add checklist items to tasks assigned to them.");
  }

  const lastSubtask = await prisma.subtask.findFirst({
    where: { taskId: parsed.taskId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true }
  });

  const subtask = await prisma.subtask.create({
    data: {
      taskId: parsed.taskId,
      title: parsed.title,
      notes: parsed.notes || null,
      dueDate: parseDate(parsed.dueDate),
      assignedToId:
        session.user.role === Role.OWNER_ADMIN ? parsed.assignedToId || null : session.user.id,
      sortOrder: (lastSubtask?.sortOrder ?? 0) + 1
    }
  });

  await logActivity({
    actorId: session.user.id,
    taskId: parsed.taskId,
    type: ActivityType.TASK_UPDATED,
    entityType: "Subtask",
    entityId: subtask.id,
    description: `Added checklist item "${subtask.title}".`
  });

  revalidatePath("/checklists");
  revalidatePath(`/checklists/${parsed.taskId}`);
  revalidatePath("/dashboard");
  revalidatePath("/settings/setup");
}

export async function createSubtaskFeedbackAction(
  _previousState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  try {
    await createSubtaskAction(formData);
    return successState("Checklist item added.");
  } catch (error) {
    return validationErrorState(error);
  }
}

export async function updateSubtaskAction(formData: FormData) {
  const session = await requireSession();
  const parsed = subtaskUpdateSchema.parse(Object.fromEntries(formData));
  const currentSubtask = await getSubtaskAccessContext(parsed.subtaskId);

  if (!currentSubtask) {
    throw new Error("Checklist item not found.");
  }

  const canCollaboratorEdit =
    currentSubtask.task.assignedToId === session.user.id ||
    currentSubtask.assignedToId === session.user.id;

  if (session.user.role !== Role.OWNER_ADMIN && !canCollaboratorEdit) {
    throw new Error("Collaborators can only edit checklist items assigned to them or their task.");
  }

  if (
    session.user.role !== Role.OWNER_ADMIN &&
    (parsed.assignedToId || null) !== currentSubtask.assignedToId
  ) {
    throw new Error("Only owner admins can change checklist item assignment.");
  }

  await prisma.subtask.update({
    where: { id: parsed.subtaskId },
    data: {
      title: parsed.title,
      notes: parsed.notes || null,
      dueDate: parseDate(parsed.dueDate),
      assignedToId: parsed.assignedToId || null,
      isComplete: parsed.isComplete === "true",
      sortOrder: parsed.sortOrder
    }
  });

  await logActivity({
    actorId: session.user.id,
    taskId: currentSubtask.taskId,
    type: ActivityType.TASK_UPDATED,
    entityType: "Subtask",
    entityId: parsed.subtaskId,
    description: `Updated checklist item "${parsed.title}".`
  });

  revalidatePath("/checklists");
  revalidatePath(`/checklists/${currentSubtask.taskId}`);
  revalidatePath("/dashboard");
  revalidatePath("/settings/setup");
}

export async function updateSubtaskFeedbackAction(
  _previousState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  try {
    await updateSubtaskAction(formData);
    return successState("Checklist item saved.");
  } catch (error) {
    return validationErrorState(error);
  }
}

export async function deleteSubtaskAction(formData: FormData) {
  const session = await requireSession();
  const parsed = subtaskDeleteSchema.parse(Object.fromEntries(formData));
  const currentSubtask = await getSubtaskAccessContext(parsed.subtaskId);

  if (!currentSubtask) {
    throw new Error("Checklist item not found.");
  }

  const canCollaboratorEdit =
    currentSubtask.task.assignedToId === session.user.id ||
    currentSubtask.assignedToId === session.user.id;

  if (session.user.role !== Role.OWNER_ADMIN && !canCollaboratorEdit) {
    throw new Error("Collaborators can only remove checklist items assigned to them or their task.");
  }

  await prisma.subtask.delete({
    where: { id: parsed.subtaskId }
  });

  await logActivity({
    actorId: session.user.id,
    taskId: currentSubtask.taskId,
    type: ActivityType.TASK_UPDATED,
    entityType: "Subtask",
    entityId: parsed.subtaskId,
    description: `Removed checklist item "${currentSubtask.title}".`
  });

  revalidatePath("/checklists");
  revalidatePath(`/checklists/${currentSubtask.taskId}`);
  revalidatePath("/dashboard");
  revalidatePath("/settings/setup");
}

export async function deleteSubtaskFeedbackAction(
  _previousState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  try {
    await deleteSubtaskAction(formData);
    return successState("Checklist item removed.");
  } catch (error) {
    return validationErrorState(error);
  }
}

export async function archiveSubtaskAction(formData: FormData) {
  const session = await requireOwner();
  const parsed = subtaskArchiveSchema.parse(Object.fromEntries(formData));
  const currentSubtask = await getSubtaskAccessContext(parsed.subtaskId);

  if (!currentSubtask) {
    throw new Error("Checklist item not found.");
  }

  await prisma.subtask.update({
    where: { id: parsed.subtaskId },
    data: { archivedAt: new Date() }
  });

  await logActivity({
    actorId: session.user.id,
    taskId: currentSubtask.taskId,
    type: ActivityType.TASK_UPDATED,
    entityType: "Subtask",
    entityId: parsed.subtaskId,
    description: `Archived checklist item "${currentSubtask.title}".`
  });

  revalidatePath("/checklists");
  revalidatePath(`/checklists/${currentSubtask.taskId}`);
  revalidatePath("/settings/setup");
}

export async function archiveSubtaskFeedbackAction(
  _previousState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  try {
    await archiveSubtaskAction(formData);
    return successState("Checklist item archived.");
  } catch (error) {
    return validationErrorState(error);
  }
}

export async function restoreSubtaskAction(formData: FormData) {
  const session = await requireOwner();
  const parsed = subtaskArchiveSchema.parse(Object.fromEntries(formData));
  const currentSubtask = await getSubtaskAccessContext(parsed.subtaskId);

  if (!currentSubtask) {
    throw new Error("Checklist item not found.");
  }

  await prisma.subtask.update({
    where: { id: parsed.subtaskId },
    data: { archivedAt: null }
  });

  await logActivity({
    actorId: session.user.id,
    taskId: currentSubtask.taskId,
    type: ActivityType.TASK_UPDATED,
    entityType: "Subtask",
    entityId: parsed.subtaskId,
    description: `Restored checklist item "${currentSubtask.title}".`
  });

  revalidatePath("/checklists");
  revalidatePath(`/checklists/${currentSubtask.taskId}`);
  revalidatePath("/settings/setup");
}

export async function restoreSubtaskFeedbackAction(
  _previousState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  try {
    await restoreSubtaskAction(formData);
    return successState("Checklist item restored.");
  } catch (error) {
    return validationErrorState(error);
  }
}

export async function resetSetupStatusesAction(
  _previousState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  await requireOwner();

  try {
    const parsed = adminResetStatusesSchema.parse(Object.fromEntries(formData));

    if (parsed.target === "tasks" || parsed.target === "all") {
      await prisma.task.updateMany({
        data: {
          status: TaskStatus.NOT_STARTED,
          completedAt: null,
          blockedReason: null
        }
      });
    }

    if (parsed.target === "subtasks" || parsed.target === "all") {
      await prisma.subtask.updateMany({
        data: {
          isComplete: false
        }
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/checklists");
    revalidatePath("/settings/setup");

    return successState(
      parsed.target === "all"
        ? "Task and checklist item statuses were reset."
        : parsed.target === "tasks"
          ? "Task statuses were reset."
          : "Checklist item statuses were reset."
    );
  } catch (error) {
    return validationErrorState(error);
  }
}

export async function updateTaskSetupAction(
  _previousState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const session = await requireOwner();

  try {
    const parsed = adminTaskSetupSchema.parse(Object.fromEntries(formData));
    const currentTask = await prisma.task.findUnique({
      where: { id: parsed.taskId },
      select: { id: true, assignedToId: true, dueDate: true, title: true }
    });

    if (!currentTask) {
      return {
        status: "error",
        message: "Task not found."
      };
    }

    const nextAssignedToId = parsed.assignedToId || null;
    const nextDueDate = parseDate(parsed.dueDate);

    await prisma.task.update({
      where: { id: parsed.taskId },
      data: {
        assignedToId: nextAssignedToId,
        dueDate: nextDueDate
      }
    });

    if (currentTask.assignedToId !== nextAssignedToId) {
      await logActivity({
        actorId: session.user.id,
        taskId: parsed.taskId,
        type: ActivityType.TASK_ASSIGNED,
        entityType: "Task",
        entityId: parsed.taskId,
        description: "Updated task assignment from the setup workspace."
      });
    }

    await logActivity({
      actorId: session.user.id,
      taskId: parsed.taskId,
      type: ActivityType.TASK_UPDATED,
      entityType: "Task",
      entityId: parsed.taskId,
      description: `Updated setup fields for task "${currentTask.title}".`
    });

    revalidatePath("/checklists");
    revalidatePath(`/checklists/${parsed.taskId}`);
    revalidatePath("/dashboard");
    revalidatePath("/settings/setup");

    return successState("Task setup details updated.");
  } catch (error) {
    return validationErrorState(error);
  }
}

export async function updateSubtaskSetupAction(
  _previousState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  await requireOwner();

  try {
    const parsed = adminSubtaskSetupSchema.parse(Object.fromEntries(formData));
    const currentSubtask = await prisma.subtask.findUnique({
      where: { id: parsed.subtaskId },
      select: { id: true, taskId: true }
    });

    if (!currentSubtask) {
      return {
        status: "error",
        message: "Checklist item not found."
      };
    }

    await prisma.subtask.update({
      where: { id: parsed.subtaskId },
      data: {
        assignedToId: parsed.assignedToId || null,
        dueDate: parseDate(parsed.dueDate)
      }
    });

    revalidatePath("/checklists");
    revalidatePath(`/checklists/${currentSubtask.taskId}`);
    revalidatePath("/settings/setup");

    return successState("Checklist item updated.");
  } catch (error) {
    return validationErrorState(error);
  }
}

export async function createAdminUserAction(
  _previousState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  await requireOwner();

  try {
    const parsed = adminCreateUserSchema.parse(Object.fromEntries(formData));
    const email = parsed.email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (existingUser) {
      return {
        status: "error",
        message: "That email address is already in use.",
        fieldErrors: {
          email: ["That email address is already in use."]
        }
      };
    }

    await prisma.user.create({
      data: {
        name: parsed.name,
        email,
        passwordHash: await hash(parsed.password, 10),
        role: parsed.role
      }
    });

    revalidatePath("/settings/setup");

    return successState("User account created.");
  } catch (error) {
    return validationErrorState(error);
  }
}

export async function updateAdminUserAction(
  _previousState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const session = await requireOwner();

  try {
    const parsed = adminUpdateUserSchema.parse(Object.fromEntries(formData));
    const email = parsed.email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { id: parsed.userId },
      select: { id: true, role: true }
    });

    if (!user) {
      return {
        status: "error",
        message: "User account not found."
      };
    }

    if (user.id === session.user.id && parsed.role !== Role.OWNER_ADMIN) {
      return {
        status: "error",
        message: "The current signed-in owner must remain an owner admin.",
        fieldErrors: {
          role: ["The current signed-in owner must remain an owner admin."]
        }
      };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (existingUser && existingUser.id !== parsed.userId) {
      return {
        status: "error",
        message: "That email address is already in use.",
        fieldErrors: {
          email: ["That email address is already in use."]
        }
      };
    }

    await prisma.user.update({
      where: { id: parsed.userId },
      data: {
        name: parsed.name,
        email,
        role: parsed.role,
        ...(parsed.password
          ? {
              passwordHash: await hash(parsed.password, 10)
            }
          : {})
      }
    });

    revalidatePath("/settings/setup");
    revalidatePath("/settings/account");

    return successState("User account updated.");
  } catch (error) {
    return validationErrorState(error);
  }
}

export async function deactivateAdminUserAction(
  _previousState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const session = await requireOwner();

  try {
    const parsed = adminDeactivateUserSchema.parse(Object.fromEntries(formData));

    if (parsed.userId === session.user.id) {
      return {
        status: "error",
        message: "You cannot deactivate the currently signed-in owner.",
        fieldErrors: {
          userId: ["You cannot deactivate the currently signed-in owner."]
        }
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: parsed.userId },
      select: {
        id: true,
        name: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      return {
        status: "error",
        message: "User account not found."
      };
    }

    if (!user.isActive) {
      return {
        status: "success",
        message: "That user is already inactive."
      };
    }

    if (user.role === Role.OWNER_ADMIN) {
      const activeOwnerCount = await prisma.user.count({
        where: {
          role: Role.OWNER_ADMIN,
          isActive: true
        }
      });

      if (activeOwnerCount <= 1) {
        return {
          status: "error",
          message: "At least one active owner admin must remain."
        };
      }
    }

    const replacementUserId = parsed.replacementUserId || null;

    if (replacementUserId) {
      const replacementUser = await prisma.user.findUnique({
        where: { id: replacementUserId },
        select: { id: true, isActive: true }
      });

      if (!replacementUser?.isActive) {
        return {
          status: "error",
          message: "Replacement owner must be an active user.",
          fieldErrors: {
            replacementUserId: ["Replacement owner must be an active user."]
          }
        };
      }
    }

    const transferTasks = parsed.transferTasks === "true";
    const transferSubtasks = parsed.transferSubtasks === "true";

    const [openTaskCount, openSubtaskCount] = await Promise.all([
      prisma.task.count({
        where: {
          archivedAt: null,
          assignedToId: parsed.userId,
          status: { not: TaskStatus.COMPLETE }
        }
      }),
      prisma.subtask.count({
        where: {
          archivedAt: null,
          assignedToId: parsed.userId,
          isComplete: false
        }
      })
    ]);

    await prisma.$transaction(async (tx) => {
      if (transferTasks) {
        await tx.task.updateMany({
          where: {
            archivedAt: null,
            assignedToId: parsed.userId,
            status: { not: TaskStatus.COMPLETE }
          },
          data: {
            assignedToId: replacementUserId
          }
        });
      }

      if (transferSubtasks) {
        await tx.subtask.updateMany({
          where: {
            archivedAt: null,
            assignedToId: parsed.userId,
            isComplete: false
          },
          data: {
            assignedToId: replacementUserId
          }
        });
      }

      await tx.user.update({
        where: { id: parsed.userId },
        data: { isActive: false }
      });
    });

    await logActivity({
      actorId: session.user.id,
      type: ActivityType.TASK_UPDATED,
      entityType: "User",
      entityId: parsed.userId,
      description: `Deactivated user "${user.name}".`
    });

    revalidatePath("/checklists");
    revalidatePath("/dashboard");
    revalidatePath("/settings/setup");
    revalidatePath("/settings/account");

    return successState(
      `Deactivated ${user.name}.${transferTasks ? ` Reassigned ${openTaskCount} open task${openTaskCount === 1 ? "" : "s"}.` : ""}${transferSubtasks ? ` Reassigned ${openSubtaskCount} open checklist item${openSubtaskCount === 1 ? "" : "s"}.` : ""}`
    );
  } catch (error) {
    return validationErrorState(error);
  }
}

export async function reactivateAdminUserAction(
  _previousState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const session = await requireOwner();

  try {
    const parsed = adminReactivateUserSchema.parse(Object.fromEntries(formData));

    const user = await prisma.user.findUnique({
      where: { id: parsed.userId },
      select: {
        id: true,
        name: true,
        isActive: true
      }
    });

    if (!user) {
      return {
        status: "error",
        message: "User account not found."
      };
    }

    if (user.isActive) {
      return {
        status: "success",
        message: `${user.name} is already active.`
      };
    }

    await prisma.user.update({
      where: { id: parsed.userId },
      data: { isActive: true }
    });

    await logActivity({
      actorId: session.user.id,
      type: ActivityType.TASK_UPDATED,
      entityType: "User",
      entityId: parsed.userId,
      description: `Reactivated user "${user.name}".`
    });

    revalidatePath("/checklists");
    revalidatePath("/dashboard");
    revalidatePath("/settings/setup");
    revalidatePath("/settings/account");

    return successState(
      `Reactivated ${user.name}. They can sign in again and appear in active assignment lists.`
    );
  } catch (error) {
    return validationErrorState(error);
  }
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

export async function updateOwnerEmailAction(
  _previousState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const session = await requireOwner();

  try {
    const parsed = accountEmailSchema.parse(Object.fromEntries(formData));
    const email = parsed.email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true }
    });

    if (!user) {
      return {
        status: "error",
        message: "User account not found."
      };
    }

    if (user.email === email) {
      return {
        status: "success",
        message: "Email address is already up to date."
      };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (existingUser && existingUser.id !== session.user.id) {
      return {
        status: "error",
        message: "That email address is already in use."
      };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { email }
    });

    revalidatePath("/settings/account");

    return {
      status: "success",
      message: "Email address updated."
    };
  } catch (error) {
    return validationErrorState(error);
  }
}

export async function updateOwnerPasswordAction(
  _previousState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const session = await requireOwner();

  try {
    const parsed = accountPasswordSchema.parse(Object.fromEntries(formData));
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true }
    });

    if (!user) {
      return {
        status: "error",
        message: "User account not found."
      };
    }

    const currentPasswordMatches = await compare(
      parsed.currentPassword,
      user.passwordHash
    );

    if (!currentPasswordMatches) {
      return {
        status: "error",
        message: "Current password is incorrect.",
        fieldErrors: {
          currentPassword: ["Current password is incorrect."]
        }
      };
    }

    const newPasswordMatchesCurrent = await compare(
      parsed.newPassword,
      user.passwordHash
    );

    if (newPasswordMatchesCurrent) {
      return {
        status: "error",
        message: "Choose a new password that is different from the current password.",
        fieldErrors: {
          newPassword: [
            "Choose a new password that is different from the current password."
          ]
        }
      };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        passwordHash: await hash(parsed.newPassword, 10)
      }
    });

    revalidatePath("/settings/account");

    return {
      status: "success",
      message: "Password updated."
    };
  } catch (error) {
    return validationErrorState(error);
  }
}

export async function requestPasswordResetAction(
  _previousState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  try {
    const parsed = forgotPasswordSchema.parse(Object.fromEntries(formData));
    const email = parsed.email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true }
    });

    if (user) {
      const { token, tokenHash, expiresAt } = createPasswordResetToken();

      await prisma.passwordResetToken.deleteMany({
        where: {
          userId: user.id,
          OR: [{ usedAt: null }, { expiresAt: { lt: new Date() } }]
        }
      });

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt
        }
      });

      try {
        await sendPasswordResetEmail({
          email: user.email,
          name: user.name,
          resetUrl: getPasswordResetUrl(token)
        });
      } catch (error) {
        console.error("[password-reset] Failed to send reset email", error);
      }
    }

    return {
      status: "success",
      message: genericPasswordResetMessage
    };
  } catch (error) {
    return validationErrorState(error);
  }
}

export async function resetPasswordAction(
  _previousState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  try {
    const parsed = resetPasswordSchema.parse(Object.fromEntries(formData));
    const tokenRecord = await getPasswordResetTokenRecord(parsed.token);

    if (!tokenRecord || tokenRecord.usedAt || tokenRecord.expiresAt <= new Date()) {
      return {
        status: "error",
        message: "This reset link is invalid or has expired. Request a new one to continue."
      };
    }

    const newPasswordMatchesCurrent = await compare(
      parsed.newPassword,
      tokenRecord.user.passwordHash
    );

    if (newPasswordMatchesCurrent) {
      return {
        status: "error",
        message: "Choose a new password that is different from the current password.",
        fieldErrors: {
          newPassword: [
            "Choose a new password that is different from the current password."
          ]
        }
      };
    }

    const nextPasswordHash = await hash(parsed.newPassword, 10);

    // Password updates and token consumption happen together so a link can only be used once.
    await prisma.$transaction([
      prisma.user.update({
        where: { id: tokenRecord.userId },
        data: {
          passwordHash: nextPasswordHash
        }
      }),
      prisma.passwordResetToken.update({
        where: { id: tokenRecord.id },
        data: {
          usedAt: new Date()
        }
      }),
      prisma.passwordResetToken.deleteMany({
        where: {
          userId: tokenRecord.userId,
          id: { not: tokenRecord.id }
        }
      })
    ]);

    return {
      status: "success",
      message: "Password updated. You can now sign in with your new password."
    };
  } catch (error) {
    return validationErrorState(error);
  }
}
