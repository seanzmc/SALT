import type {
  TaskCommentCreateInput,
  TaskListFilters,
  TaskListResponse,
  TaskWorkspaceComment,
  TaskWorkspaceData,
  TaskWorkspaceUpdateInput
} from "@salt/types";

import { apiClient } from "../../../lib/api-client";

function buildTaskQuery(filters: TaskListFilters) {
  const searchParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `/api/tasks?${query}` : "/api/tasks";
}

export function getTaskList(filters: TaskListFilters) {
  return apiClient<TaskListResponse>(buildTaskQuery(filters), {
    method: "GET"
  });
}

export function getTaskWorkspace(taskId: string) {
  return apiClient<TaskWorkspaceData>(`/api/tasks/${taskId}`, {
    method: "GET"
  });
}

export function updateTaskWorkspace(payload: TaskWorkspaceUpdateInput) {
  return apiClient<TaskWorkspaceData>(`/api/tasks/${payload.taskId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function createTaskComment(payload: TaskCommentCreateInput) {
  return apiClient<TaskWorkspaceComment>(`/api/tasks/${payload.taskId}/comments`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
