import type {
  AdminCreateUserInput,
  AdminMutationMessage,
  AdminReactivateUserInput,
  AdminSetupData,
  AdminSetupSubtask,
  AdminSetupTask,
  AdminStatusResetInput,
  AdminSubtaskSetupUpdateInput,
  AdminTaskSetupUpdateInput,
  AdminUpdateUserInput,
  AdminUserRecord,
  AdminDeactivateUserInput
} from "@salt/types";

import { apiClient } from "../../../lib/api-client";

export function getAdminSetupData() {
  return apiClient<AdminSetupData>("/api/admin/setup", {
    method: "GET"
  });
}

export function resetAdminStatuses(payload: AdminStatusResetInput) {
  return apiClient<AdminMutationMessage>("/api/admin/reset-statuses", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateAdminTaskSetup(payload: AdminTaskSetupUpdateInput) {
  return apiClient<AdminSetupTask>(`/api/admin/tasks/${payload.taskId}/setup`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function updateAdminSubtaskSetup(payload: AdminSubtaskSetupUpdateInput) {
  return apiClient<AdminSetupSubtask>(`/api/admin/subtasks/${payload.subtaskId}/setup`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function createAdminUser(payload: AdminCreateUserInput) {
  return apiClient<AdminUserRecord>("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateAdminUser(payload: AdminUpdateUserInput) {
  return apiClient<AdminUserRecord>(`/api/admin/users/${payload.userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function deactivateAdminUser(payload: AdminDeactivateUserInput) {
  return apiClient<AdminMutationMessage>(`/api/admin/users/${payload.userId}/deactivate`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function reactivateAdminUser(payload: AdminReactivateUserInput) {
  return apiClient<AdminMutationMessage>(`/api/admin/users/${payload.userId}/reactivate`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
