import { z } from "zod";

import {
  PRIORITY_VALUES,
  TASK_ARCHIVE_VALUES,
  TASK_QUEUE_VALUES,
  TASK_SORT_VALUES,
  TASK_STATUS_VALUES
} from "@salt/types";

const TASK_STATUS_WITH_ALL = ["ALL", ...TASK_STATUS_VALUES] as const;

export const taskListQuerySchema = z.object({
  q: z.string().optional(),
  status: z.enum(TASK_STATUS_WITH_ALL).optional(),
  section: z.string().optional(),
  priority: z.enum(PRIORITY_VALUES).optional(),
  assignee: z.string().optional(),
  queue: z.enum(TASK_QUEUE_VALUES).optional(),
  archived: z.enum(TASK_ARCHIVE_VALUES).optional(),
  sort: z.enum(TASK_SORT_VALUES).optional()
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
    status: z.enum(TASK_STATUS_VALUES),
    priority: z.enum(PRIORITY_VALUES),
    assignedToId: z.string().cuid().optional().or(z.literal("")),
    blockedReason: z.string().max(300).optional().or(z.literal(""))
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

export const taskCommentCreateSchema = z.object({
  taskId: z.string().cuid(),
  content: z.string().trim().min(1).max(2000)
});
