import bcrypt from "bcryptjs";
import { Role, TaskStatus } from "@prisma/client";

import { prisma } from "@salt/db";
import type {
  AdminCreateUserInput,
  AdminDeactivateUserInput,
  AdminReactivateUserInput,
  AdminStatusResetInput,
  AdminSubtaskSetupUpdateInput,
  AdminTaskSetupUpdateInput,
  AdminUpdateUserInput,
  SessionPayload
} from "@salt/types";

import { logActivity } from "../activity/log.js";
import { DomainError } from "../shared/domain-error.js";
import { serializeAdminSubtask, serializeAdminTask, serializeAdminUser } from "./serializers.js";

type Actor = SessionPayload["user"];

function assertOwner(actor: Actor) {
  if (actor.role !== "OWNER_ADMIN") {
    throw new DomainError(403, "FORBIDDEN", "Owner access is required.");
  }
}

function parseOptionalDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function resetSetupStatusesCommand(input: {
  actor: Actor;
  payload: AdminStatusResetInput;
}) {
  assertOwner(input.actor);

  if (input.payload.target === "tasks" || input.payload.target === "all") {
    await prisma.task.updateMany({
      data: {
        status: TaskStatus.NOT_STARTED,
        completedAt: null,
        blockedReason: null
      }
    });
  }

  if (input.payload.target === "subtasks" || input.payload.target === "all") {
    await prisma.subtask.updateMany({
      data: {
        isComplete: false
      }
    });
  }

  return {
    message:
      input.payload.target === "all"
        ? "Task and checklist item statuses were reset."
        : input.payload.target === "tasks"
          ? "Task statuses were reset."
          : "Checklist item statuses were reset."
  };
}

export async function updateTaskSetupCommand(input: {
  actor: Actor;
  payload: AdminTaskSetupUpdateInput;
}) {
  assertOwner(input.actor);

  const currentTask = await prisma.task.findUnique({
    where: { id: input.payload.taskId },
    select: { id: true, assignedToId: true, dueDate: true, title: true }
  });

  if (!currentTask) {
    throw new DomainError(404, "NOT_FOUND", "Task not found.");
  }

  const nextAssignedToId = input.payload.assignedToId ?? null;
  const nextDueDate = parseOptionalDate(input.payload.dueDate);

  const task = await prisma.task.update({
    where: { id: input.payload.taskId },
    data: {
      assignedToId: nextAssignedToId,
      dueDate: nextDueDate
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
      status: true,
      assignedToId: true,
      assignedTo: {
        select: {
          name: true
        }
      },
      section: {
        select: {
          title: true
        }
      }
    }
  });

  if (currentTask.assignedToId !== nextAssignedToId) {
    await logActivity({
      actorId: input.actor.id,
      taskId: input.payload.taskId,
      type: "TASK_ASSIGNED",
      entityType: "Task",
      entityId: input.payload.taskId,
      description: "Updated task assignment from the setup workspace."
    });
  }

  await logActivity({
    actorId: input.actor.id,
    taskId: input.payload.taskId,
    type: "TASK_UPDATED",
    entityType: "Task",
    entityId: input.payload.taskId,
    description: `Updated setup fields for task "${currentTask.title}".`
  });

  return serializeAdminTask(task);
}

export async function updateSubtaskSetupCommand(input: {
  actor: Actor;
  payload: AdminSubtaskSetupUpdateInput;
}) {
  assertOwner(input.actor);

  const currentSubtask = await prisma.subtask.findUnique({
    where: { id: input.payload.subtaskId },
    select: { id: true }
  });

  if (!currentSubtask) {
    throw new DomainError(404, "NOT_FOUND", "Checklist item not found.");
  }

  const subtask = await prisma.subtask.update({
    where: { id: input.payload.subtaskId },
    data: {
      assignedToId: input.payload.assignedToId ?? null,
      dueDate: parseOptionalDate(input.payload.dueDate)
    },
    select: {
      id: true,
      title: true,
      isComplete: true,
      dueDate: true,
      assignedToId: true,
      task: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });

  return serializeAdminSubtask(subtask);
}

export async function createAdminUserCommand(input: {
  actor: Actor;
  payload: AdminCreateUserInput;
}) {
  assertOwner(input.actor);

  const email = input.payload.email.toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  });

  if (existingUser) {
    throw new DomainError(400, "VALIDATION_ERROR", "That email address is already in use.", {
      email: ["That email address is already in use."]
    });
  }

  const user = await prisma.user.create({
    data: {
      name: input.payload.name.trim(),
      email,
      passwordHash: await bcrypt.hash(input.payload.password, 10),
      role: input.payload.role
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      assignedTasks: {
        where: {
          archivedAt: null,
          status: { not: TaskStatus.COMPLETE }
        },
        select: { id: true }
      },
      assignedSubtasks: {
        where: {
          archivedAt: null,
          isComplete: false
        },
        select: { id: true }
      }
    }
  });

  return serializeAdminUser(user);
}

export async function updateAdminUserCommand(input: {
  actor: Actor;
  payload: AdminUpdateUserInput;
}) {
  assertOwner(input.actor);
  const email = input.payload.email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { id: input.payload.userId },
    select: { id: true, role: true }
  });

  if (!user) {
    throw new DomainError(404, "NOT_FOUND", "User account not found.");
  }

  if (user.id === input.actor.id && input.payload.role !== Role.OWNER_ADMIN) {
    throw new DomainError(
      400,
      "VALIDATION_ERROR",
      "The current signed-in owner must remain an owner admin.",
      {
        role: ["The current signed-in owner must remain an owner admin."]
      }
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  });

  if (existingUser && existingUser.id !== input.payload.userId) {
    throw new DomainError(400, "VALIDATION_ERROR", "That email address is already in use.", {
      email: ["That email address is already in use."]
    });
  }

  const updatedUser = await prisma.user.update({
    where: { id: input.payload.userId },
    data: {
      name: input.payload.name.trim(),
      email,
      role: input.payload.role,
      ...(input.payload.password
        ? {
            passwordHash: await bcrypt.hash(input.payload.password, 10)
          }
        : {})
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      assignedTasks: {
        where: {
          archivedAt: null,
          status: { not: TaskStatus.COMPLETE }
        },
        select: { id: true }
      },
      assignedSubtasks: {
        where: {
          archivedAt: null,
          isComplete: false
        },
        select: { id: true }
      }
    }
  });

  return serializeAdminUser(updatedUser);
}

export async function deactivateAdminUserCommand(input: {
  actor: Actor;
  payload: AdminDeactivateUserInput;
}) {
  assertOwner(input.actor);

  if (input.payload.userId === input.actor.id) {
    throw new DomainError(
      400,
      "VALIDATION_ERROR",
      "You cannot deactivate the currently signed-in owner.",
      {
        userId: ["You cannot deactivate the currently signed-in owner."]
      }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: input.payload.userId },
    select: {
      id: true,
      name: true,
      role: true,
      isActive: true
    }
  });

  if (!user) {
    throw new DomainError(404, "NOT_FOUND", "User account not found.");
  }

  if (!user.isActive) {
    return {
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
      throw new DomainError(400, "VALIDATION_ERROR", "At least one active owner admin must remain.");
    }
  }

  if (input.payload.replacementUserId) {
    const replacementUser = await prisma.user.findUnique({
      where: { id: input.payload.replacementUserId },
      select: { id: true, isActive: true }
    });

    if (!replacementUser?.isActive) {
      throw new DomainError(
        400,
        "VALIDATION_ERROR",
        "Replacement owner must be an active user.",
        {
          replacementUserId: ["Replacement owner must be an active user."]
        }
      );
    }
  }

  const [openTaskCount, openSubtaskCount] = await Promise.all([
    prisma.task.count({
      where: {
        archivedAt: null,
        assignedToId: input.payload.userId,
        status: { not: TaskStatus.COMPLETE }
      }
    }),
    prisma.subtask.count({
      where: {
        archivedAt: null,
        assignedToId: input.payload.userId,
        isComplete: false
      }
    })
  ]);

  await prisma.$transaction(async (tx) => {
    if (input.payload.transferTasks) {
      await tx.task.updateMany({
        where: {
          archivedAt: null,
          assignedToId: input.payload.userId,
          status: { not: TaskStatus.COMPLETE }
        },
        data: {
          assignedToId: input.payload.replacementUserId
        }
      });
    }

    if (input.payload.transferSubtasks) {
      await tx.subtask.updateMany({
        where: {
          archivedAt: null,
          assignedToId: input.payload.userId,
          isComplete: false
        },
        data: {
          assignedToId: input.payload.replacementUserId
        }
      });
    }

    await tx.user.update({
      where: { id: input.payload.userId },
      data: { isActive: false }
    });
  });

  await logActivity({
    actorId: input.actor.id,
    type: "TASK_UPDATED",
    entityType: "User",
    entityId: input.payload.userId,
    description: `Deactivated user "${user.name}".`
  });

  return {
    message: `Deactivated ${user.name}.${input.payload.transferTasks ? ` Reassigned ${openTaskCount} open task${openTaskCount === 1 ? "" : "s"}.` : ""}${input.payload.transferSubtasks ? ` Reassigned ${openSubtaskCount} open checklist item${openSubtaskCount === 1 ? "" : "s"}.` : ""}`
  };
}

export async function reactivateAdminUserCommand(input: {
  actor: Actor;
  payload: AdminReactivateUserInput;
}) {
  assertOwner(input.actor);

  const user = await prisma.user.findUnique({
    where: { id: input.payload.userId },
    select: {
      id: true,
      name: true,
      isActive: true
    }
  });

  if (!user) {
    throw new DomainError(404, "NOT_FOUND", "User account not found.");
  }

  if (user.isActive) {
    return {
      message: `${user.name} is already active.`
    };
  }

  await prisma.user.update({
    where: { id: input.payload.userId },
    data: { isActive: true }
  });

  await logActivity({
    actorId: input.actor.id,
    type: "TASK_UPDATED",
    entityType: "User",
    entityId: input.payload.userId,
    description: `Reactivated user "${user.name}".`
  });

  return {
    message: `Reactivated ${user.name}. They can sign in again and appear in active assignment lists.`
  };
}
