import { z } from "zod";

import {
  OPENING_PRIORITY_VALUES,
  PRIORITY_VALUES,
  TASK_GROUP_VALUES,
  TASK_BULK_ACTION_VALUES,
  TASK_ARCHIVE_VALUES,
  TASK_QUEUE_VALUES,
  TASK_SORT_VALUES,
  TASK_SORT_DIRECTION_VALUES,
  TASK_STATUS_VALUES,
  TASK_VIEW_VALUES
} from "@salt/types";

function multiValueEnum<const TValues extends readonly [string, ...string[]]>(values: TValues) {
  return z.preprocess(
    (value) => {
      if (!value) {
        return undefined;
      }

      const rawValues = Array.isArray(value) ? value : [value];
      const nextValues = rawValues
        .flatMap((entry) => entry.split(","))
        .map((entry) => entry.trim())
        .filter(Boolean);

      return nextValues.length > 0 ? Array.from(new Set(nextValues)) : undefined;
    },
    z.array(z.enum(values)).optional()
  );
}

function multiValueString() {
  return z.preprocess(
    (value) => {
      if (!value) {
        return undefined;
      }

      const rawValues = Array.isArray(value) ? value : [value];
      const nextValues = rawValues
        .flatMap((entry) => entry.split(","))
        .map((entry) => entry.trim())
        .filter(Boolean);

      return nextValues.length > 0 ? Array.from(new Set(nextValues)) : undefined;
    },
    z.array(z.string()).optional()
  );
}

export const taskListQuerySchema = z.object({
  q: z.string().optional(),
  status: multiValueEnum(TASK_STATUS_VALUES),
  section: multiValueString(),
  priority: multiValueEnum(PRIORITY_VALUES),
  assignee: multiValueString(),
  queue: z.enum(TASK_QUEUE_VALUES).optional(),
  archived: z.enum(TASK_ARCHIVE_VALUES).optional(),
  sort: z.enum(TASK_SORT_VALUES).optional(),
  order: z.enum(TASK_SORT_DIRECTION_VALUES).optional(),
  view: z.enum(TASK_VIEW_VALUES).optional(),
  group: z.enum(TASK_GROUP_VALUES).optional()
});

export const taskIdParamSchema = z.object({
  taskId: z.string().cuid()
});

export const taskCommentSchema = z.object({
  taskId: z.string().cuid(),
  content: z.string().min(1).max(2000)
});

export const taskWorkspaceUpdateSchema = z
  .object({
    taskId: z.string().cuid(),
    title: z.string().trim().min(2).max(180),
    description: z.string().max(4000).optional().nullable().or(z.literal("")),
    notes: z.string().max(4000).optional().nullable().or(z.literal("")),
    dueDate: z.string().optional().nullable().or(z.literal("")),
    status: z.enum(TASK_STATUS_VALUES),
    priority: z.enum(PRIORITY_VALUES),
    assignedToId: z.string().cuid().optional().nullable().or(z.literal("")),
    blockedReason: z.string().max(300).optional().nullable().or(z.literal(""))
  })
  .superRefine((data, ctx) => {
    if (data.status === "BLOCKED" && !data.blockedReason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["blockedReason"],
        message: "Blocked reason is required when status is blocked."
      });
    }
  });

export const taskCreateSchema = z.object({
  sectionId: z.string().cuid(),
  phaseId: z.string().cuid().optional().nullable().or(z.literal("")),
  title: z.string().trim().min(3).max(180),
  description: z.string().max(4000).optional().nullable().or(z.literal("")),
  notes: z.string().max(4000).optional().nullable().or(z.literal("")),
  priority: z.enum(PRIORITY_VALUES),
  openingPriority: z.enum(OPENING_PRIORITY_VALUES),
  dueDate: z.string().optional().nullable().or(z.literal("")),
  assignedToId: z.string().cuid().optional().nullable().or(z.literal(""))
});

export const taskCommentCreateSchema = z.object({
  taskId: z.string().cuid(),
  content: z.string().trim().min(1).max(2000)
});

export const subtaskIdParamSchema = z.object({
  subtaskId: z.string().cuid()
});

export const taskArchiveSchema = z.object({
  taskId: z.string().cuid()
});

export const subtaskCreateSchema = z.object({
  taskId: z.string().cuid(),
  title: z.string().trim().min(2).max(180),
  notes: z.string().max(4000).optional().nullable().or(z.literal("")),
  dueDate: z.string().optional().nullable().or(z.literal("")),
  assignedToId: z.string().cuid().optional().nullable().or(z.literal(""))
});

export const subtaskUpdateSchema = z.object({
  subtaskId: z.string().cuid(),
  title: z.string().trim().min(2).max(180),
  notes: z.string().max(4000).optional().nullable().or(z.literal("")),
  dueDate: z.string().optional().nullable().or(z.literal("")),
  assignedToId: z.string().cuid().optional().nullable().or(z.literal("")),
  isComplete: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(9999)
});

export const subtaskArchiveSchema = z.object({
  subtaskId: z.string().cuid()
});

export const subtaskDeleteSchema = z.object({
  subtaskId: z.string().cuid()
});

export const taskDependencyCreateSchema = z
  .object({
    taskId: z.string().cuid(),
    dependsOnTaskId: z.string().cuid()
  })
  .superRefine((data, ctx) => {
    if (data.taskId === data.dependsOnTaskId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dependsOnTaskId"],
        message: "A task cannot depend on itself."
      });
    }
  });

export const taskDependencyDeleteSchema = z.object({
  taskId: z.string().cuid(),
  dependsOnTaskId: z.string().cuid()
});

export const taskBulkActionSchema = z
  .object({
    taskIds: z.array(z.string().cuid()).min(1, "Select at least one task."),
    action: z.enum(TASK_BULK_ACTION_VALUES),
    assignedToId: z.string().cuid().optional().nullable().or(z.literal("")),
    status: z.enum(TASK_STATUS_VALUES).optional(),
    priority: z.enum(PRIORITY_VALUES).optional(),
    dueDate: z.string().optional().nullable().or(z.literal("")),
    blockedReason: z.string().max(300).optional().nullable().or(z.literal(""))
  })
  .superRefine((data, ctx) => {
    if (data.action === "assign" && !data.assignedToId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assignedToId"],
        message: "Select an owner for reassignment."
      });
    }

    if (data.action === "status" && !data.status) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["status"],
        message: "Select a status."
      });
    }

    if (data.action === "status" && data.status === "BLOCKED" && !data.blockedReason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["blockedReason"],
        message: "Blocked reason is required when setting status to blocked."
      });
    }

    if (data.action === "priority" && !data.priority) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["priority"],
        message: "Select a priority."
      });
    }

    if (data.action === "setDueDate" && !data.dueDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dueDate"],
        message: "Choose a due date."
      });
    }
  });
