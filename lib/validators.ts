import { DocumentCategory, OpeningPriority, PaymentStatus, Priority, Role, TaskStatus, TimelinePhaseStatus } from "@prisma/client";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const accountEmailSchema = z.object({
  email: z.string().trim().email()
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email()
});

export const accountPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Please confirm the new password.")
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Confirm password must match the new password.",
    path: ["confirmPassword"]
  });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Please confirm the new password.")
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Confirm password must match the new password.",
    path: ["confirmPassword"]
  });

export const taskUpdateSchema = z.object({
  taskId: z.string().cuid(),
  sectionId: z.string().cuid(),
  phaseId: z.string().cuid().optional().or(z.literal("")),
  title: z.string().min(3).max(180),
  description: z.string().max(4000).optional().or(z.literal("")),
  notes: z.string().max(4000).optional().or(z.literal("")),
  status: z.nativeEnum(TaskStatus),
  priority: z.nativeEnum(Priority),
  openingPriority: z.nativeEnum(OpeningPriority),
  dueDate: z.string().optional().or(z.literal("")),
  assignedToId: z.string().cuid().optional().or(z.literal("")),
  blockedReason: z.string().max(300).optional().or(z.literal(""))
}).superRefine((data, ctx) => {
  if (data.status === TaskStatus.BLOCKED && !data.blockedReason?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["blockedReason"],
      message: "Blocked reason is required when status is blocked."
    });
  }
});

export const taskCreateSchema = z.object({
  sectionId: z.string().cuid(),
  phaseId: z.string().cuid().optional().or(z.literal("")),
  title: z.string().trim().min(3).max(180),
  description: z.string().max(4000).optional().or(z.literal("")),
  notes: z.string().max(4000).optional().or(z.literal("")),
  priority: z.nativeEnum(Priority),
  openingPriority: z.nativeEnum(OpeningPriority),
  dueDate: z.string().optional().or(z.literal("")),
  assignedToId: z.string().cuid().optional().or(z.literal(""))
});

export const taskDeleteSchema = z.object({
  taskId: z.string().cuid()
});

export const taskCommentSchema = z.object({
  taskId: z.string().cuid(),
  content: z.string().min(1).max(2000)
});

export const subtaskCreateSchema = z.object({
  taskId: z.string().cuid(),
  title: z.string().trim().min(2).max(180),
  notes: z.string().max(4000).optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  assignedToId: z.string().cuid().optional().or(z.literal(""))
});

export const subtaskUpdateSchema = z.object({
  subtaskId: z.string().cuid(),
  title: z.string().trim().min(2).max(180),
  notes: z.string().max(4000).optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  assignedToId: z.string().cuid().optional().or(z.literal("")),
  isComplete: z.enum(["true", "false"]),
  sortOrder: z.coerce.number().int().min(0).max(9999)
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

export const adminResetStatusesSchema = z.object({
  target: z.enum(["tasks", "subtasks", "all"])
});

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
  role: z.nativeEnum(Role)
});

export const adminUpdateUserSchema = z.object({
  userId: z.string().cuid(),
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(120),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().optional().or(z.literal("")).refine(
    (value) => !value || value.length >= 8,
    "Password must be at least 8 characters."
  ),
  role: z.nativeEnum(Role)
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
