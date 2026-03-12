import { z } from "zod";

import { ADMIN_RESET_TARGET_VALUES, ROLE_VALUES } from "@salt/types";

export const adminSetupQuerySchema = z.object({});

export const adminTaskSetupSchema = z.object({
  taskId: z.string().cuid(),
  dueDate: z.string().optional().or(z.literal("")),
  assignedToId: z.string().cuid().optional().or(z.literal(""))
});

export const adminSubtaskSetupSchema = z.object({
  subtaskId: z.string().cuid(),
  dueDate: z.string().optional().or(z.literal("")),
  assignedToId: z.string().cuid().optional().or(z.literal(""))
});

export const adminCreateUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(120),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(ROLE_VALUES)
});

export const adminUpdateUserSchema = z.object({
  userId: z.string().cuid(),
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(120),
  email: z.string().trim().email("Enter a valid email address."),
  password: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || value.length >= 8, "Password must be at least 8 characters."),
  role: z.enum(ROLE_VALUES)
});

export const adminDeactivateUserSchema = z
  .object({
    userId: z.string().cuid(),
    replacementUserId: z.string().cuid().optional().or(z.literal("")),
    transferTasks: z.boolean().default(false),
    transferSubtasks: z.boolean().default(false)
  })
  .superRefine((data, ctx) => {
    const wantsTransfer = data.transferTasks || data.transferSubtasks;

    if (wantsTransfer && !data.replacementUserId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["replacementUserId"],
        message: "Choose a replacement owner when transferring work."
      });
    }

    if (data.replacementUserId && data.replacementUserId === data.userId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["replacementUserId"],
        message: "Replacement owner must be a different active user."
      });
    }
  });

export const adminReactivateUserSchema = z.object({
  userId: z.string().cuid()
});

export const adminResetStatusesSchema = z.object({
  target: z.enum(ADMIN_RESET_TARGET_VALUES)
});
