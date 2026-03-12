import { z } from "zod";

import { PAYMENT_STATUS_VALUES } from "@salt/types";

export const budgetListQuerySchema = z.object({
  category: z.string().optional()
});

export const budgetItemIdParamSchema = z.object({
  itemId: z.string().cuid()
});

export const budgetItemUpdateSchema = z.object({
  itemId: z.string().cuid(),
  actual: z.coerce.number().min(0),
  vendor: z.string().max(160).optional().or(z.literal("")),
  paidStatus: z.enum(PAYMENT_STATUS_VALUES),
  notes: z.string().max(2000).optional().or(z.literal(""))
});
