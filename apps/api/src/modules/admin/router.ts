import { Router } from "express";
import type {
  AdminCreateUserInput,
  AdminReactivateUserInput,
  AdminStatusResetInput
} from "@salt/types";

import {
  createAdminUserCommand,
  deactivateAdminUserCommand,
  getAdminSetupData,
  reactivateAdminUserCommand,
  resetSetupStatusesCommand,
  updateAdminUserCommand,
  updateSubtaskSetupCommand,
  updateTaskSetupCommand
} from "@salt/domain";
import {
  adminCreateUserSchema,
  adminDeactivateUserSchema,
  adminReactivateUserSchema,
  adminResetStatusesSchema,
  adminSubtaskSetupSchema,
  adminTaskSetupSchema,
  adminUpdateUserSchema
} from "@salt/validation";

import { AppError } from "../../lib/app-error.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { requireOwner } from "../../middleware/auth-session.js";

export const adminRouter = Router();

function validationError(message: string, fieldErrors?: Record<string, string[] | undefined>) {
  return new AppError(400, "VALIDATION_ERROR", message, fieldErrors);
}

adminRouter.use(requireOwner);

adminRouter.get(
  "/setup",
  asyncHandler(async (_request, response) => {
    response.status(200).json(await getAdminSetupData());
  })
);

adminRouter.post(
  "/reset-statuses",
  asyncHandler(async (request, response) => {
    const parsed = adminResetStatusesSchema.safeParse(request.body);

    if (!parsed.success) {
      throw validationError("Invalid reset request.");
    }

    const payload: AdminStatusResetInput = {
      target: parsed.data.target
    };

    response.status(200).json(
      await resetSetupStatusesCommand({
        actor: request.authSession!.user,
        payload
      })
    );
  })
);

adminRouter.patch(
  "/tasks/:taskId/setup",
  asyncHandler(async (request, response) => {
    const parsed = adminTaskSetupSchema.safeParse({
      ...request.body,
      taskId: request.params.taskId
    });

    if (!parsed.success) {
      throw validationError(
        "Please correct the highlighted task setup fields.",
        parsed.error.flatten().fieldErrors
      );
    }

    response.status(200).json(
      await updateTaskSetupCommand({
        actor: request.authSession!.user,
        payload: {
          taskId: parsed.data.taskId,
          dueDate: parsed.data.dueDate || null,
          assignedToId: parsed.data.assignedToId || null
        }
      })
    );
  })
);

adminRouter.patch(
  "/subtasks/:subtaskId/setup",
  asyncHandler(async (request, response) => {
    const parsed = adminSubtaskSetupSchema.safeParse({
      ...request.body,
      subtaskId: request.params.subtaskId
    });

    if (!parsed.success) {
      throw validationError(
        "Please correct the highlighted checklist-item setup fields.",
        parsed.error.flatten().fieldErrors
      );
    }

    response.status(200).json(
      await updateSubtaskSetupCommand({
        actor: request.authSession!.user,
        payload: {
          subtaskId: parsed.data.subtaskId,
          dueDate: parsed.data.dueDate || null,
          assignedToId: parsed.data.assignedToId || null
        }
      })
    );
  })
);

adminRouter.post(
  "/users",
  asyncHandler(async (request, response) => {
    const parsed = adminCreateUserSchema.safeParse(request.body);

    if (!parsed.success) {
      throw validationError(
        "Please correct the highlighted user fields.",
        parsed.error.flatten().fieldErrors
      );
    }

    const payload: AdminCreateUserInput = {
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
      role: parsed.data.role
    };

    response.status(201).json(
      await createAdminUserCommand({
        actor: request.authSession!.user,
        payload
      })
    );
  })
);

adminRouter.patch(
  "/users/:userId",
  asyncHandler(async (request, response) => {
    const parsed = adminUpdateUserSchema.safeParse({
      ...request.body,
      userId: request.params.userId
    });

    if (!parsed.success) {
      throw validationError(
        "Please correct the highlighted user fields.",
        parsed.error.flatten().fieldErrors
      );
    }

    response.status(200).json(
      await updateAdminUserCommand({
        actor: request.authSession!.user,
        payload: {
          userId: parsed.data.userId,
          name: parsed.data.name,
          email: parsed.data.email,
          password: parsed.data.password || null,
          role: parsed.data.role
        }
      })
    );
  })
);

adminRouter.post(
  "/users/:userId/deactivate",
  asyncHandler(async (request, response) => {
    const parsed = adminDeactivateUserSchema.safeParse({
      userId: request.params.userId,
      replacementUserId: request.body.replacementUserId,
      transferTasks: Boolean(request.body.transferTasks),
      transferSubtasks: Boolean(request.body.transferSubtasks)
    });

    if (!parsed.success) {
      throw validationError(
        "Please correct the highlighted deactivation fields.",
        parsed.error.flatten().fieldErrors
      );
    }

    response.status(200).json(
      await deactivateAdminUserCommand({
        actor: request.authSession!.user,
        payload: {
          userId: parsed.data.userId,
          replacementUserId: parsed.data.replacementUserId || null,
          transferTasks: parsed.data.transferTasks,
          transferSubtasks: parsed.data.transferSubtasks
        }
      })
    );
  })
);

adminRouter.post(
  "/users/:userId/reactivate",
  asyncHandler(async (request, response) => {
    const parsed = adminReactivateUserSchema.safeParse({
      userId: request.params.userId
    });

    if (!parsed.success) {
      throw validationError("Invalid user id.");
    }

    const payload: AdminReactivateUserInput = {
      userId: parsed.data.userId
    };

    response.status(200).json(
      await reactivateAdminUserCommand({
        actor: request.authSession!.user,
        payload
      })
    );
  })
);
