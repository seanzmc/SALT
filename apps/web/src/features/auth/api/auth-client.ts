import type { SessionPayload } from "@salt/types";

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
