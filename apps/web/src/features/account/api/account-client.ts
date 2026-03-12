import type {
  AccountEmailUpdateInput,
  AccountPasswordUpdateInput,
  MessageResponse
} from "@salt/types";

import { apiClient } from "../../../lib/api-client";

export function updateAccountEmail(payload: AccountEmailUpdateInput) {
  return apiClient<MessageResponse>("/api/account/email", {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function updateAccountPassword(payload: AccountPasswordUpdateInput) {
  return apiClient<MessageResponse>("/api/account/password", {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}
