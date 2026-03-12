import { Router } from "express";

import {
  createTaskCommentCommand,
  getTaskWorkspace,
  listTasks,
  updateTaskCommand
} from "@salt/domain";
import {
  taskCommentCreateSchema,
  taskIdParamSchema,
  taskListQuerySchema,
  taskWorkspaceUpdateSchema
} from "@salt/validation";

import { AppError } from "../../lib/app-error";
import { asyncHandler } from "../../lib/async-handler";
import { requireSession } from "../../middleware/auth-session";

export const tasksRouter = Router();

tasksRouter.use(requireSession);

tasksRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const parsed = taskListQuerySchema.safeParse(request.query);

    if (!parsed.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid task query filters.");
    }

    const data = await listTasks({
      ...parsed.data,
      currentUserId: request.authSession!.user.id
    });

    response.status(200).json(data);
  })
);

tasksRouter.get(
  "/:taskId",
  asyncHandler(async (request, response) => {
    const parsed = taskIdParamSchema.safeParse(request.params);

    if (!parsed.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid task id.");
    }

    const data = await getTaskWorkspace(parsed.data.taskId);

    if (!data.task) {
      throw new AppError(404, "NOT_FOUND", "Task not found.");
    }

    response.status(200).json(data);
  })
);

tasksRouter.patch(
  "/:taskId",
  asyncHandler(async (request, response) => {
    const params = taskIdParamSchema.safeParse(request.params);

    if (!params.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid task id.");
    }

    const parsed = taskWorkspaceUpdateSchema.safeParse({
      ...request.body,
      taskId: params.data.taskId
    });

    if (!parsed.success) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Please correct the highlighted fields.",
        parsed.error.flatten().fieldErrors
      );
    }

    const data = await updateTaskCommand({
      actor: request.authSession!.user,
      payload: {
        taskId: parsed.data.taskId,
        status: parsed.data.status,
        priority: parsed.data.priority,
        assignedToId: parsed.data.assignedToId || null,
        blockedReason: parsed.data.blockedReason || null
      }
    });

    response.status(200).json(data);
  })
);

tasksRouter.post(
  "/:taskId/comments",
  asyncHandler(async (request, response) => {
    const params = taskIdParamSchema.safeParse(request.params);

    if (!params.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid task id.");
    }

    const parsed = taskCommentCreateSchema.safeParse({
      taskId: params.data.taskId,
      content: request.body.content
    });

    if (!parsed.success) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Please enter a comment before posting.",
        parsed.error.flatten().fieldErrors
      );
    }

    const comment = await createTaskCommentCommand({
      actor: request.authSession!.user,
      payload: parsed.data
    });

    response.status(201).json(comment);
  })
);
