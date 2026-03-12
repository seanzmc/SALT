import type {
  ForgotPasswordInput,
  MessageResponse,
  PasswordResetTokenValidation,
  ResetPasswordInput,
  SessionPayload
} from "@salt/types";

import { apiClient } from "../../../lib/api-client";

export function getCurrentSession() {
  return apiClient<SessionPayload>("/api/auth/me", {
    method: "GET"
  });
}

export function loginWithCredentials(input: { email: string; password: string }) {
  return apiClient<SessionPayload>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function logout() {
  return apiClient<void>("/api/auth/logout", {
    method: "POST"
  });
}

export function requestPasswordReset(input: ForgotPasswordInput) {
  return apiClient<MessageResponse>("/api/auth/password/forgot", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function validateResetToken(token: string) {
  return apiClient<PasswordResetTokenValidation>(
    `/api/auth/password/reset/validate?token=${encodeURIComponent(token)}`,
    {
      method: "GET"
    }
  );
}

export function resetPassword(input: ResetPasswordInput) {
  return apiClient<MessageResponse>("/api/auth/password/reset", {
    method: "POST",
    body: JSON.stringify(input)
  });
}
