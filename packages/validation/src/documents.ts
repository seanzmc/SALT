import { z } from "zod";

import { DOCUMENT_CATEGORY_VALUES } from "@salt/types";

export const documentListQuerySchema = z.object({
  q: z.string().optional(),
  category: z.enum(DOCUMENT_CATEGORY_VALUES).optional()
});

export const documentIdParamSchema = z.object({
  documentId: z.string().cuid()
});

export const documentUploadMetadataSchema = z.object({
  title: z.string().trim().min(3).max(180),
  category: z.enum(DOCUMENT_CATEGORY_VALUES),
  notes: z.string().max(2000).optional().or(z.literal("")),
  linkedTaskId: z.string().cuid().optional().or(z.literal("")),
  linkedBudgetItemId: z.string().cuid().optional().or(z.literal(""))
});

export const documentTaskLinkSchema = z.object({
  documentId: z.string().cuid(),
  taskId: z.string().cuid()
});

export const documentTaskUnlinkSchema = z.object({
  documentId: z.string().cuid(),
  taskId: z.string().cuid()
});
