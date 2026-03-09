import { DocumentCategory, OpeningPriority, PaymentStatus, Priority, Role, TaskStatus, TimelinePhaseStatus } from "@prisma/client";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const taskUpdateSchema = z.object({
  taskId: z.string().cuid(),
  title: z.string().min(3).max(180),
  description: z.string().max(4000).optional().or(z.literal("")),
  notes: z.string().max(4000).optional().or(z.literal("")),
  status: z.nativeEnum(TaskStatus),
  priority: z.nativeEnum(Priority),
  openingPriority: z.nativeEnum(OpeningPriority),
  dueDate: z.string().optional().or(z.literal("")),
  assignedToId: z.string().cuid().optional().or(z.literal("")),
  blockedReason: z.string().max(300).optional().or(z.literal(""))
});

export const taskCommentSchema = z.object({
  taskId: z.string().cuid(),
  content: z.string().min(1).max(2000)
});

export const budgetUpdateSchema = z.object({
  itemId: z.string().cuid(),
  actual: z.coerce.number().min(0),
  vendor: z.string().max(160).optional().or(z.literal("")),
  paidStatus: z.nativeEnum(PaymentStatus),
  notes: z.string().max(2000).optional().or(z.literal(""))
});

export const timelineUpdateSchema = z.object({
  phaseId: z.string().cuid(),
  status: z.nativeEnum(TimelinePhaseStatus),
  notes: z.string().max(2000).optional().or(z.literal("")),
  blockers: z.string().max(1000).optional().or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal(""))
});

export const messageSchema = z.object({
  threadId: z.string().cuid(),
  content: z.string().min(1).max(3000)
});

export const documentUploadSchema = z.object({
  title: z.string().min(3).max(180),
  category: z.nativeEnum(DocumentCategory),
  notes: z.string().max(2000).optional().or(z.literal("")),
  linkedTaskId: z.string().cuid().optional().or(z.literal("")),
  linkedBudgetItemId: z.string().cuid().optional().or(z.literal(""))
});

export const roleSchema = z.nativeEnum(Role);
