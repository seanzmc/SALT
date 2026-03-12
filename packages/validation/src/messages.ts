import { z } from "zod";

import {
  MESSAGE_THREAD_CATEGORY_VALUES,
  MESSAGE_THREAD_SCOPE_VALUES
} from "@salt/types";

const MESSAGE_SCOPE_WITH_ALL = ["ALL", ...MESSAGE_THREAD_SCOPE_VALUES] as const;
const MESSAGE_CATEGORY_WITH_ALL = ["ALL", ...MESSAGE_THREAD_CATEGORY_VALUES] as const;

export const messageThreadListQuerySchema = z.object({
  q: z.string().optional(),
  scope: z.enum(MESSAGE_SCOPE_WITH_ALL).optional(),
  category: z.enum(MESSAGE_CATEGORY_WITH_ALL).optional()
});

export const messageThreadIdParamSchema = z.object({
  threadId: z.string().cuid()
});

export const messageCreateSchema = z.object({
  threadId: z.string().cuid(),
  content: z.string().trim().min(1).max(3000)
});
