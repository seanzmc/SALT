import { Router } from "express";

import { getTaskWorkspace, listTasks } from "@salt/domain";
import { taskIdParamSchema, taskListQuerySchema } from "@salt/validation";

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
