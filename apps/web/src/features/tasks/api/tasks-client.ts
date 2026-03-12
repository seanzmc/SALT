import type { TaskListResponse, TaskWorkspaceData } from "@salt/types";

import { apiClient } from "../../../lib/api-client";

export function getTaskList() {
  return apiClient<TaskListResponse>("/api/tasks", {
    method: "GET"
  });
}

export function getTaskWorkspace(taskId: string) {
  return apiClient<TaskWorkspaceData>(`/api/tasks/${taskId}`, {
    method: "GET"
  });
}
