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
