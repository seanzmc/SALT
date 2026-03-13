import { Router } from "express";

import {
  archiveSubtaskCommand,
  archiveTaskCommand,
  bulkUpdateTasksCommand,
  createSubtaskCommand,
  createTaskCommentCommand,
  createTaskDependencyCommand,
  deleteSubtaskCommand,
  deleteTaskDependencyCommand,
  getTaskWorkspace,
  listTasks,
  restoreSubtaskCommand,
  restoreTaskCommand,
  updateSubtaskCommand,
  updateTaskCommand
} from "@salt/domain";
import type {
  TaskArchiveInput,
  TaskBulkActionInput,
  TaskCommentCreateInput,
  TaskDependencyCreateInput,
  TaskDependencyDeleteInput,
  TaskListFilters,
  TaskSubtaskArchiveInput,
  TaskSubtaskCreateInput,
  TaskSubtaskDeleteInput,
  TaskSubtaskUpdateInput,
  TaskWorkspaceUpdateInput
} from "@salt/types";
import {
  subtaskArchiveSchema,
  subtaskCreateSchema,
  subtaskDeleteSchema,
  subtaskIdParamSchema,
  subtaskUpdateSchema,
  taskArchiveSchema,
  taskBulkActionSchema,
  taskCommentCreateSchema,
  taskDependencyCreateSchema,
  taskDependencyDeleteSchema,
  taskIdParamSchema,
  taskListQuerySchema,
  taskWorkspaceUpdateSchema
} from "@salt/validation";

import { AppError } from "../../lib/app-error.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { requireSession } from "../../middleware/auth-session.js";

export const tasksRouter = Router();

function validationError(message: string, fieldErrors?: Record<string, string[] | undefined>) {
  return new AppError(400, "VALIDATION_ERROR", message, fieldErrors);
}

tasksRouter.use(requireSession);

tasksRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const parsed = taskListQuerySchema.safeParse(request.query);

    if (!parsed.success) {
      throw validationError("Invalid task query filters.");
    }

    const filters: TaskListFilters & { currentUserId: string } = {
      q: parsed.data.q,
      status: parsed.data.status,
      section: parsed.data.section,
      priority: parsed.data.priority,
      assignee: parsed.data.assignee,
      queue: parsed.data.queue,
      archived: parsed.data.archived,
      sort: parsed.data.sort,
      currentUserId: request.authSession!.user.id
    };

    const data = await listTasks(filters);

    response.status(200).json(data);
  })
);

tasksRouter.post(
  "/bulk",
  asyncHandler(async (request, response) => {
    const parsed = taskBulkActionSchema.safeParse(request.body);

    if (!parsed.success) {
      throw validationError("Please correct the highlighted bulk-action fields.", parsed.error.flatten().fieldErrors);
    }

    const payload: TaskBulkActionInput = {
      taskIds: parsed.data.taskIds,
      action: parsed.data.action,
      assignedToId: parsed.data.assignedToId || null,
      status: parsed.data.status,
      priority: parsed.data.priority,
      dueDate: parsed.data.dueDate || null,
      blockedReason: parsed.data.blockedReason || null
    };

    const result = await bulkUpdateTasksCommand({
      actor: request.authSession!.user,
      payload
    });

    response.status(200).json(result);
  })
);

tasksRouter.get(
  "/:taskId",
  asyncHandler(async (request, response) => {
    const parsed = taskIdParamSchema.safeParse(request.params);

    if (!parsed.success) {
      throw validationError("Invalid task id.");
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
      throw validationError("Invalid task id.");
    }

    const parsed = taskWorkspaceUpdateSchema.safeParse({
      ...request.body,
      taskId: params.data.taskId
    });

    if (!parsed.success) {
      throw validationError(
        "Please correct the highlighted fields.",
        parsed.error.flatten().fieldErrors
      );
    }

    const payload: TaskWorkspaceUpdateInput = {
      taskId: parsed.data.taskId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      notes: parsed.data.notes || null,
      dueDate: parsed.data.dueDate || null,
      status: parsed.data.status,
      priority: parsed.data.priority,
      assignedToId: parsed.data.assignedToId || null,
      blockedReason: parsed.data.blockedReason || null
    };

    const data = await updateTaskCommand({
      actor: request.authSession!.user,
      payload
    });

    response.status(200).json(data);
  })
);

tasksRouter.post(
  "/:taskId/comments",
  asyncHandler(async (request, response) => {
    const params = taskIdParamSchema.safeParse(request.params);

    if (!params.success) {
      throw validationError("Invalid task id.");
    }

    const parsed = taskCommentCreateSchema.safeParse({
      taskId: params.data.taskId,
      content: request.body.content
    });

    if (!parsed.success) {
      throw validationError(
        "Please enter a comment before posting.",
        parsed.error.flatten().fieldErrors
      );
    }

    const payload: TaskCommentCreateInput = {
      taskId: parsed.data.taskId,
      content: parsed.data.content
    };

    const comment = await createTaskCommentCommand({
      actor: request.authSession!.user,
      payload
    });

    response.status(201).json(comment);
  })
);

tasksRouter.post(
  "/:taskId/subtasks",
  asyncHandler(async (request, response) => {
    const params = taskIdParamSchema.safeParse(request.params);

    if (!params.success) {
      throw validationError("Invalid task id.");
    }

    const parsed = subtaskCreateSchema.safeParse({
      ...request.body,
      taskId: params.data.taskId
    });

    if (!parsed.success) {
      throw validationError(
        "Please correct the highlighted checklist-item fields.",
        parsed.error.flatten().fieldErrors
      );
    }

    const payload: TaskSubtaskCreateInput = {
      taskId: parsed.data.taskId,
      title: parsed.data.title,
      notes: parsed.data.notes || null,
      dueDate: parsed.data.dueDate || null,
      assignedToId: parsed.data.assignedToId || null
    };

    const data = await createSubtaskCommand({
      actor: request.authSession!.user,
      payload
    });

    response.status(201).json(data);
  })
);

tasksRouter.patch(
  "/subtasks/:subtaskId",
  asyncHandler(async (request, response) => {
    const params = subtaskIdParamSchema.safeParse(request.params);

    if (!params.success) {
      throw validationError("Invalid checklist item id.");
    }

    const parsed = subtaskUpdateSchema.safeParse({
      ...request.body,
      subtaskId: params.data.subtaskId
    });

    if (!parsed.success) {
      throw validationError(
        "Please correct the highlighted checklist-item fields.",
        parsed.error.flatten().fieldErrors
      );
    }

    const payload: TaskSubtaskUpdateInput = {
      subtaskId: parsed.data.subtaskId,
      title: parsed.data.title,
      notes: parsed.data.notes || null,
      dueDate: parsed.data.dueDate || null,
      assignedToId: parsed.data.assignedToId || null,
      isComplete: parsed.data.isComplete,
      sortOrder: parsed.data.sortOrder
    };

    const data = await updateSubtaskCommand({
      actor: request.authSession!.user,
      payload
    });

    response.status(200).json(data);
  })
);

tasksRouter.delete(
  "/subtasks/:subtaskId",
  asyncHandler(async (request, response) => {
    const params = subtaskIdParamSchema.safeParse(request.params);

    if (!params.success) {
      throw validationError("Invalid checklist item id.");
    }

    const parsed = subtaskDeleteSchema.safeParse(params.data);

    if (!parsed.success) {
      throw validationError("Invalid checklist item id.");
    }

    const payload: TaskSubtaskDeleteInput = {
      subtaskId: parsed.data.subtaskId
    };

    const data = await deleteSubtaskCommand({
      actor: request.authSession!.user,
      payload
    });

    response.status(200).json(data);
  })
);

tasksRouter.post(
  "/subtasks/:subtaskId/archive",
  asyncHandler(async (request, response) => {
    const params = subtaskIdParamSchema.safeParse(request.params);

    if (!params.success) {
      throw validationError("Invalid checklist item id.");
    }

    const parsed = subtaskArchiveSchema.safeParse(params.data);

    if (!parsed.success) {
      throw validationError("Invalid checklist item id.");
    }

    const payload: TaskSubtaskArchiveInput = {
      subtaskId: parsed.data.subtaskId
    };

    const data = await archiveSubtaskCommand({
      actor: request.authSession!.user,
      payload
    });

    response.status(200).json(data);
  })
);

tasksRouter.post(
  "/subtasks/:subtaskId/restore",
  asyncHandler(async (request, response) => {
    const params = subtaskIdParamSchema.safeParse(request.params);

    if (!params.success) {
      throw validationError("Invalid checklist item id.");
    }

    const parsed = subtaskArchiveSchema.safeParse(params.data);

    if (!parsed.success) {
      throw validationError("Invalid checklist item id.");
    }

    const payload: TaskSubtaskArchiveInput = {
      subtaskId: parsed.data.subtaskId
    };

    const data = await restoreSubtaskCommand({
      actor: request.authSession!.user,
      payload
    });

    response.status(200).json(data);
  })
);

tasksRouter.post(
  "/:taskId/dependencies",
  asyncHandler(async (request, response) => {
    const params = taskIdParamSchema.safeParse(request.params);

    if (!params.success) {
      throw validationError("Invalid task id.");
    }

    const parsed = taskDependencyCreateSchema.safeParse({
      taskId: params.data.taskId,
      dependsOnTaskId: request.body.dependsOnTaskId
    });

    if (!parsed.success) {
      throw validationError(
        "Please select a valid dependency.",
        parsed.error.flatten().fieldErrors
      );
    }

    const payload: TaskDependencyCreateInput = {
      taskId: parsed.data.taskId,
      dependsOnTaskId: parsed.data.dependsOnTaskId
    };

    const data = await createTaskDependencyCommand({
      actor: request.authSession!.user,
      payload
    });

    response.status(201).json(data);
  })
);

tasksRouter.delete(
  "/:taskId/dependencies/:dependsOnTaskId",
  asyncHandler(async (request, response) => {
    const params = taskDependencyDeleteSchema.safeParse(request.params);

    if (!params.success) {
      throw validationError("Invalid dependency id.");
    }

    const payload: TaskDependencyDeleteInput = {
      taskId: params.data.taskId,
      dependsOnTaskId: params.data.dependsOnTaskId
    };

    const data = await deleteTaskDependencyCommand({
      actor: request.authSession!.user,
      payload
    });

    response.status(200).json(data);
  })
);

tasksRouter.post(
  "/:taskId/archive",
  asyncHandler(async (request, response) => {
    const params = taskIdParamSchema.safeParse(request.params);

    if (!params.success) {
      throw validationError("Invalid task id.");
    }

    const parsed = taskArchiveSchema.safeParse(params.data);

    if (!parsed.success) {
      throw validationError("Invalid task id.");
    }

    const payload: TaskArchiveInput = {
      taskId: parsed.data.taskId
    };

    const data = await archiveTaskCommand({
      actor: request.authSession!.user,
      payload
    });

    response.status(200).json(data);
  })
);

tasksRouter.post(
  "/:taskId/restore",
  asyncHandler(async (request, response) => {
    const params = taskIdParamSchema.safeParse(request.params);

    if (!params.success) {
      throw validationError("Invalid task id.");
    }

    const parsed = taskArchiveSchema.safeParse(params.data);

    if (!parsed.success) {
      throw validationError("Invalid task id.");
    }

    const payload: TaskArchiveInput = {
      taskId: parsed.data.taskId
    };

    const data = await restoreTaskCommand({
      actor: request.authSession!.user,
      payload
    });

    response.status(200).json(data);
  })
);
