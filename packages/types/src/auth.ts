export const ROLE_VALUES = ["OWNER_ADMIN", "COLLABORATOR"] as const;

export type UserRole = (typeof ROLE_VALUES)[number];

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type SessionPayload = {
  user: SessionUser;
};

export type AuthErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "INVALID_CREDENTIALS"
  | "INACTIVE_USER"
  | "NOT_FOUND"
  | "VALIDATION_ERROR";

export type AccountEmailUpdateInput = {
  email: string;
};

export type AccountNameUpdateInput = {
  name: string;
};

export type AccountPasswordUpdateInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type ForgotPasswordInput = {
  email: string;
};

export type ResetPasswordInput = {
  token: string;
  newPassword: string;
  confirmPassword: string;
};

export type PasswordResetTokenValidation = {
  valid: boolean;
};
