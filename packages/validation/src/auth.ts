import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8)
});

export const accountEmailSchema = z.object({
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

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email()
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

export const sessionCookieSchema = z.object({
  userId: z.string().cuid()
});
