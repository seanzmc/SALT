import type {
  TaskArchiveInput,
  TaskBulkActionInput,
  TaskBulkActionResult,
  TaskCreateInput,
  TaskCommentCreateInput,
  TaskDependencyCreateInput,
  TaskDependencyDeleteInput,
  TaskListFilters,
  TaskListResponse,
  TaskSubtaskArchiveInput,
  TaskSubtaskCreateInput,
  TaskSubtaskDeleteInput,
  TaskSubtaskUpdateInput,
  TaskWorkspaceComment,
  TaskWorkspaceData,
  TaskWorkspaceUpdateInput
} from "@salt/types";

import { apiClient } from "../../../lib/api-client";

function buildTaskQuery(filters: TaskListFilters) {
  const searchParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item) {
          searchParams.append(key, item);
        }
      });
      return;
    }

    if (value) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `/api/tasks?${query}` : "/api/tasks";
}

export function createTask(payload: TaskCreateInput) {
  return apiClient<TaskWorkspaceData>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(payload)
  });
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

export function createSubtask(payload: TaskSubtaskCreateInput) {
  return apiClient<TaskWorkspaceData>(`/api/tasks/${payload.taskId}/subtasks`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateSubtask(payload: TaskSubtaskUpdateInput) {
  return apiClient<TaskWorkspaceData>(`/api/tasks/subtasks/${payload.subtaskId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function deleteSubtask(payload: TaskSubtaskDeleteInput) {
  return apiClient<TaskWorkspaceData>(`/api/tasks/subtasks/${payload.subtaskId}`, {
    method: "DELETE"
  });
}

export function archiveSubtask(payload: TaskSubtaskArchiveInput) {
  return apiClient<TaskWorkspaceData>(`/api/tasks/subtasks/${payload.subtaskId}/archive`, {
    method: "POST"
  });
}

export function restoreSubtask(payload: TaskSubtaskArchiveInput) {
  return apiClient<TaskWorkspaceData>(`/api/tasks/subtasks/${payload.subtaskId}/restore`, {
    method: "POST"
  });
}

export function createTaskDependency(payload: TaskDependencyCreateInput) {
  return apiClient<TaskWorkspaceData>(`/api/tasks/${payload.taskId}/dependencies`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function deleteTaskDependency(payload: TaskDependencyDeleteInput) {
  return apiClient<TaskWorkspaceData>(
    `/api/tasks/${payload.taskId}/dependencies/${payload.dependsOnTaskId}`,
    {
      method: "DELETE"
    }
  );
}

export function archiveTask(payload: TaskArchiveInput) {
  return apiClient<TaskWorkspaceData>(`/api/tasks/${payload.taskId}/archive`, {
    method: "POST"
  });
}

export function restoreTask(payload: TaskArchiveInput) {
  return apiClient<TaskWorkspaceData>(`/api/tasks/${payload.taskId}/restore`, {
    method: "POST"
  });
}

export function bulkUpdateTasks(payload: TaskBulkActionInput) {
  return apiClient<TaskBulkActionResult>("/api/tasks/bulk", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
