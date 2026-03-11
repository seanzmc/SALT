"use server";

import { ActivityType, Role, TaskStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
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
  adminResetStatusesSchema,
  adminSubtaskSetupSchema,
  adminTaskSetupSchema,
  adminUpdateUserSchema,
  accountEmailSchema,
  accountPasswordSchema,
  budgetUpdateSchema,
  forgotPasswordSchema,
  messageSchema,
  resetPasswordSchema,
  taskCommentSchema,
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
