import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  SessionPayload,
  TaskArchiveInput,
  TaskBulkActionInput,
  TaskBulkActionResult,
  TaskCommentCreateInput,
  TaskDependencyCreateInput,
  TaskDependencyDeleteInput,
  TaskListFilters,
  TaskListResponse,
  TaskSummary,
  TaskWorkspaceComment,
  TaskWorkspaceData,
  TaskWorkspaceSearchState,
  TaskWorkspaceSubtask,
  TaskWorkspaceUpdateInput
} from "@salt/types";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { ApiClientError } from "../../../lib/api-client";
import { useAuthSessionQuery } from "../../auth/hooks/use-auth-session-query";
import {
  archiveSubtask,
  archiveTask,
  bulkUpdateTasks,
  createSubtask,
  createTaskComment,
  createTaskDependency,
  deleteSubtask,
  deleteTaskDependency,
  getTaskList,
  getTaskWorkspace,
  restoreSubtask,
  restoreTask,
  updateSubtask,
  updateTaskWorkspace
} from "../api/tasks-client";
import { BulkActionsPanel } from "../components/bulk-actions-panel";
import { TaskBoardPanel } from "../components/task-board-panel";
import { TaskListPanel } from "../components/task-list-panel";
import { TaskShelf } from "../components/task-shelf";
import { WorkspaceFilters } from "../components/workspace-filters";
import { taskQueryKeys } from "../lib/query-keys";
import {
  buildTaskSearchParams,
  getTaskWorkspaceSearchState,
  toTaskListFilters,
  updateTaskSearchState
} from "../lib/url-state";

function matchesTaskFilters(
  task: TaskSummary,
  filters: TaskListFilters,
  currentUserId?: string
) {
  const now = new Date();
  const upcomingLimit = new Date(now);
  upcomingLimit.setDate(upcomingLimit.getDate() + 7);
  const staleLimit = new Date(now);
  staleLimit.setDate(staleLimit.getDate() - 7);
  const search = filters.q?.trim().toLowerCase();

  if (search) {
    const haystack = [task.title, task.description, task.notes]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (!haystack.includes(search)) {
      return false;
    }
  }

  if (filters.status && filters.status !== "ALL" && task.status !== filters.status) {
    return false;
  }

  if (filters.section && task.section.slug !== filters.section) {
    return false;
  }

  if (filters.priority && task.priority !== filters.priority) {
    return false;
  }

  if (filters.archived === "active" && task.archivedAt) {
    return false;
  }

  if (filters.archived === "archived" && !task.archivedAt) {
    return false;
  }

  if (filters.assignee === "unassigned" && task.assignedTo) {
    return false;
  }

  if (filters.assignee === "me" && task.assignedTo?.id !== currentUserId) {
    return false;
  }

  if (
    filters.assignee &&
    filters.assignee !== "me" &&
    filters.assignee !== "unassigned" &&
    task.assignedTo?.id !== filters.assignee
  ) {
    return false;
  }

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isComplete = task.status === "COMPLETE";

  switch (filters.queue) {
    case "my-work":
      return task.assignedTo?.id === currentUserId;
    case "overdue":
      return Boolean(dueDate && dueDate < now && !isComplete);
    case "upcoming":
      return Boolean(dueDate && dueDate >= now && dueDate <= upcomingLimit && !isComplete);
    case "blocked":
      return task.status === "BLOCKED";
    case "unassigned":
      return !task.assignedTo;
    case "stale":
      return new Date(task.updatedAt) < staleLimit && !isComplete;
    default:
      return true;
  }
}

function replaceTaskInList(
  current: TaskListResponse | undefined,
  task: TaskSummary,
  filters: TaskListFilters,
  currentUserId?: string
) {
  if (!current) {
    return current;
  }

  const nextTasks = current.tasks.filter((item) => item.id !== task.id);

  if (!matchesTaskFilters(task, filters, currentUserId)) {
    return {
      ...current,
      tasks: nextTasks
    };
  }

  const existingIndex = current.tasks.findIndex((item) => item.id === task.id);

  if (existingIndex < 0) {
    return {
      ...current,
      tasks: [task, ...nextTasks]
    };
  }

  const updatedTasks = [...current.tasks];
  updatedTasks.splice(existingIndex, 1, task);

  return {
    ...current,
    tasks: updatedTasks
  };
}

function patchTaskSummary(
  task: TaskSummary,
  patch: Partial<
    Pick<
      TaskSummary,
      | "status"
      | "priority"
      | "assignedTo"
      | "blockedReason"
      | "archivedAt"
      | "dueDate"
      | "dependencyStatuses"
    >
  >
) {
  return {
    ...task,
    ...patch,
    updatedAt: new Date().toISOString()
  };
}

function patchTaskDetail(
  current: TaskWorkspaceData | undefined,
  patch: Partial<
    Pick<
      NonNullable<TaskWorkspaceData["task"]>,
      | "status"
      | "priority"
      | "assignedTo"
      | "assignedToId"
      | "blockedReason"
      | "archivedAt"
      | "dueDate"
      | "dependencyStatuses"
      | "subtasks"
      | "dependencies"
      | "dependencyCandidates"
    >
  >
) {
  if (!current?.task) {
    return current;
  }

  return {
    ...current,
    task: {
      ...current.task,
      ...patch,
      updatedAt: new Date().toISOString()
    }
  };
}

function appendOptimisticComment(
  current: TaskWorkspaceData | undefined,
  comment: TaskWorkspaceComment
) {
  if (!current?.task) {
    return current;
  }

  return {
    ...current,
    task: {
      ...current.task,
      comments: [comment, ...current.task.comments],
      updatedAt: new Date().toISOString()
    }
  };
}

function replaceOptimisticComment(
  current: TaskWorkspaceData | undefined,
  optimisticId: string,
  comment: TaskWorkspaceComment
) {
  if (!current?.task) {
    return current;
  }

  return {
    ...current,
    task: {
      ...current.task,
      comments: current.task.comments.map((item) =>
        item.id === optimisticId ? comment : item
      ),
      updatedAt: new Date().toISOString()
    }
  };
}

function appendOptimisticSubtask(
  current: TaskWorkspaceData | undefined,
  subtask: TaskWorkspaceSubtask
) {
  if (!current?.task) {
    return current;
  }

  return patchTaskDetail(current, {
    subtasks: [...current.task.subtasks, subtask]
  });
}

function updateOptimisticSubtask(
  current: TaskWorkspaceData | undefined,
  subtaskId: string,
  patch: Partial<TaskWorkspaceSubtask>
) {
  if (!current?.task) {
    return current;
  }

  return patchTaskDetail(current, {
    subtasks: current.task.subtasks.map((subtask) =>
      subtask.id === subtaskId ? { ...subtask, ...patch } : subtask
    )
  });
}

function removeOptimisticSubtask(current: TaskWorkspaceData | undefined, subtaskId: string) {
  if (!current?.task) {
    return current;
  }

  return patchTaskDetail(current, {
    subtasks: current.task.subtasks.filter((subtask) => subtask.id !== subtaskId)
  });
}

export function TasksWorkspacePage() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [taskError, setTaskError] = useState<string>();
  const [commentError, setCommentError] = useState<string>();
  const [subtaskError, setSubtaskError] = useState<string>();
  const [dependencyError, setDependencyError] = useState<string>();
  const [archiveError, setArchiveError] = useState<string>();
  const [bulkError, setBulkError] = useState<string>();
  const sessionQuery = useAuthSessionQuery();

  const selectedTaskId = params.taskId;
  const searchState = getTaskWorkspaceSearchState(searchParams);
  const deferredSearch = useDeferredValue(searchState.q);
  const activeFilters = useMemo(
    () => toTaskListFilters(searchState, { q: deferredSearch }),
    [deferredSearch, searchState]
  );
  const currentListKey = taskQueryKeys.list(activeFilters);

  const taskListQuery = useQuery({
    queryKey: currentListKey,
    queryFn: () => getTaskList(activeFilters),
    placeholderData: (previous) => previous
  });

  const taskWorkspaceQuery = useQuery({
    queryKey: selectedTaskId ? taskQueryKeys.detail(selectedTaskId) : ["tasks", "detail", "none"],
    queryFn: () => getTaskWorkspace(selectedTaskId!),
    enabled: Boolean(selectedTaskId)
  });

  const currentUser = sessionQuery.data?.user;
  const visibleTasks = taskListQuery.data?.tasks ?? [];
  const visibleTaskIdSet = useMemo(
    () => new Set(visibleTasks.map((task) => task.id)),
    [visibleTasks]
  );
  const allVisibleSelected =
    visibleTasks.length > 0 && visibleTasks.every((task) => selectedTaskIds.includes(task.id));
  const showBoardView = searchState.view === "board" && searchState.archived === "active";

  useEffect(() => {
    setSelectedTaskIds((current) => current.filter((taskId) => visibleTaskIdSet.has(taskId)));
  }, [visibleTaskIdSet]);

  function replaceCurrentListTask(task: TaskSummary) {
    queryClient.setQueryData<TaskListResponse>(currentListKey, (current) =>
      replaceTaskInList(current, task, activeFilters, currentUser?.id)
    );
  }

  function syncWorkspaceResult(data: TaskWorkspaceData) {
    if (!data.task) {
      return;
    }

    queryClient.setQueryData(taskQueryKeys.detail(data.task.id), data);
    replaceCurrentListTask(data.task);
  }

  function patchCurrentListTask(taskId: string, patch: Parameters<typeof patchTaskSummary>[1]) {
    queryClient.setQueryData<TaskListResponse>(currentListKey, (current) => {
      if (!current) {
        return current;
      }

      const task = current.tasks.find((item) => item.id === taskId);

      if (!task) {
        return current;
      }

      return replaceTaskInList(
        current,
        patchTaskSummary(task, patch),
        activeFilters,
        currentUser?.id
      );
    });
  }

  const updateTaskMutation = useMutation({
    mutationFn: updateTaskWorkspace,
    onMutate: async (payload) => {
      setTaskError(undefined);
      const allUsers = taskWorkspaceQuery.data?.users ?? taskListQuery.data?.users ?? [];
      const assignedTo =
        payload.assignedToId === null
          ? null
          : allUsers.find((user) => user.id === payload.assignedToId) ?? null;

      await queryClient.cancelQueries({ queryKey: currentListKey });
      if (selectedTaskId) {
        await queryClient.cancelQueries({ queryKey: taskQueryKeys.detail(selectedTaskId) });
      }

      const previousList = queryClient.getQueryData<TaskListResponse>(currentListKey);
      const previousDetail = selectedTaskId
        ? queryClient.getQueryData<TaskWorkspaceData>(taskQueryKeys.detail(selectedTaskId))
        : undefined;

      patchCurrentListTask(payload.taskId, {
        status: payload.status,
        priority: payload.priority,
        assignedTo,
        blockedReason: payload.status === "BLOCKED" ? payload.blockedReason ?? null : null
      });

      if (selectedTaskId) {
        queryClient.setQueryData<TaskWorkspaceData>(
          taskQueryKeys.detail(selectedTaskId),
          (current) =>
            patchTaskDetail(current, {
              status: payload.status,
              priority: payload.priority,
              assignedTo,
              assignedToId: payload.assignedToId,
              blockedReason: payload.status === "BLOCKED" ? payload.blockedReason ?? null : null
            })
        );
      }

      return {
        previousList,
        previousDetail
      };
    },
    onError: (error, _payload, context) => {
      setTaskError(
        error instanceof ApiClientError ? error.message : "Unable to save task changes."
      );

      if (context?.previousList) {
        queryClient.setQueryData(currentListKey, context.previousList);
      }

      if (selectedTaskId && context?.previousDetail) {
        queryClient.setQueryData(taskQueryKeys.detail(selectedTaskId), context.previousDetail);
      }
    },
    onSuccess: (data) => {
      setTaskError(undefined);
      syncWorkspaceResult(data);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.lists() });
    }
  });

  const createCommentMutation = useMutation({
    mutationFn: createTaskComment,
    onMutate: async (payload) => {
      setCommentError(undefined);
      if (!selectedTaskId || !currentUser) {
        return {};
      }

      await queryClient.cancelQueries({ queryKey: taskQueryKeys.detail(selectedTaskId) });

      const previousDetail = queryClient.getQueryData<TaskWorkspaceData>(
        taskQueryKeys.detail(selectedTaskId)
      );
      const optimisticId = `optimistic-comment-${Date.now()}`;

      queryClient.setQueryData<TaskWorkspaceData>(
        taskQueryKeys.detail(selectedTaskId),
        (current) =>
          appendOptimisticComment(current, {
            id: optimisticId,
            content: payload.content,
            createdAt: new Date().toISOString(),
            author: {
              id: currentUser.id,
              name: currentUser.name
            }
          })
      );

      patchCurrentListTask(payload.taskId, {});

      return {
        previousDetail,
        optimisticId
      };
    },
    onError: (error, _payload, context) => {
      setCommentError(
        error instanceof ApiClientError ? error.message : "Unable to post comment."
      );

      if (selectedTaskId && context?.previousDetail) {
        queryClient.setQueryData(taskQueryKeys.detail(selectedTaskId), context.previousDetail);
      }
    },
    onSuccess: (comment, payload, context) => {
      setCommentError(undefined);
      if (!selectedTaskId) {
        return;
      }

      queryClient.setQueryData<TaskWorkspaceData>(
        taskQueryKeys.detail(selectedTaskId),
        (current) =>
          context?.optimisticId
            ? replaceOptimisticComment(current, context.optimisticId, comment)
            : appendOptimisticComment(current, comment)
      );

      patchCurrentListTask(payload.taskId, {});
    }
  });

  const createSubtaskMutation = useMutation({
    mutationFn: createSubtask,
    onMutate: async (payload) => {
      setSubtaskError(undefined);
      if (!selectedTaskId) {
        return {};
      }

      await queryClient.cancelQueries({ queryKey: taskQueryKeys.detail(selectedTaskId) });

      const previousDetail = queryClient.getQueryData<TaskWorkspaceData>(
        taskQueryKeys.detail(selectedTaskId)
      );
      const assignedTo =
        payload.assignedToId === null
          ? currentUser?.role === "COLLABORATOR" && currentUser
            ? { id: currentUser.id, name: currentUser.name }
            : null
          : taskWorkspaceQuery.data?.users.find((user) => user.id === payload.assignedToId) ?? null;
      const optimisticId = `optimistic-subtask-${Date.now()}`;

      queryClient.setQueryData<TaskWorkspaceData>(
        taskQueryKeys.detail(selectedTaskId),
        (current) =>
          appendOptimisticSubtask(current, {
            id: optimisticId,
            title: payload.title,
            notes: payload.notes,
            dueDate: payload.dueDate,
            archivedAt: null,
            assignedToId: assignedTo?.id ?? null,
            assignedTo,
            isComplete: false,
            sortOrder: current?.task?.subtasks.length ?? 0
          })
      );

      patchCurrentListTask(payload.taskId, {});

      return {
        previousDetail
      };
    },
    onError: (error, _payload, context) => {
      setSubtaskError(
        error instanceof ApiClientError ? error.message : "Unable to add checklist item."
      );

      if (selectedTaskId && context?.previousDetail) {
        queryClient.setQueryData(taskQueryKeys.detail(selectedTaskId), context.previousDetail);
      }
    },
    onSuccess: (data) => {
      setSubtaskError(undefined);
      syncWorkspaceResult(data);
    }
  });

  const updateSubtaskMutation = useMutation({
    mutationFn: updateSubtask,
    onMutate: async (payload) => {
      setSubtaskError(undefined);
      if (!selectedTaskId) {
        return {};
      }

      await queryClient.cancelQueries({ queryKey: taskQueryKeys.detail(selectedTaskId) });

      const previousDetail = queryClient.getQueryData<TaskWorkspaceData>(
        taskQueryKeys.detail(selectedTaskId)
      );
      const assignedTo =
        payload.assignedToId === null
          ? null
          : taskWorkspaceQuery.data?.users.find((user) => user.id === payload.assignedToId) ?? null;

      queryClient.setQueryData<TaskWorkspaceData>(
        taskQueryKeys.detail(selectedTaskId),
        (current) =>
          updateOptimisticSubtask(current, payload.subtaskId, {
            title: payload.title,
            notes: payload.notes,
            dueDate: payload.dueDate,
            assignedToId: payload.assignedToId,
            assignedTo,
            isComplete: payload.isComplete
          })
      );

      return {
        previousDetail
      };
    },
    onError: (error, _payload, context) => {
      setSubtaskError(
        error instanceof ApiClientError ? error.message : "Unable to save checklist item."
      );

      if (selectedTaskId && context?.previousDetail) {
        queryClient.setQueryData(taskQueryKeys.detail(selectedTaskId), context.previousDetail);
      }
    },
    onSuccess: (data) => {
      setSubtaskError(undefined);
      syncWorkspaceResult(data);
    }
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: deleteSubtask,
    onMutate: async (payload) => {
      setSubtaskError(undefined);
      if (!selectedTaskId) {
        return {};
      }

      await queryClient.cancelQueries({ queryKey: taskQueryKeys.detail(selectedTaskId) });

      const previousDetail = queryClient.getQueryData<TaskWorkspaceData>(
        taskQueryKeys.detail(selectedTaskId)
      );

      queryClient.setQueryData<TaskWorkspaceData>(
        taskQueryKeys.detail(selectedTaskId),
        (current) => removeOptimisticSubtask(current, payload.subtaskId)
      );

      return {
        previousDetail
      };
    },
    onError: (error, _payload, context) => {
      setSubtaskError(
        error instanceof ApiClientError ? error.message : "Unable to delete checklist item."
      );

      if (selectedTaskId && context?.previousDetail) {
        queryClient.setQueryData(taskQueryKeys.detail(selectedTaskId), context.previousDetail);
      }
    },
    onSuccess: (data) => {
      setSubtaskError(undefined);
      syncWorkspaceResult(data);
    }
  });

  const archiveSubtaskMutation = useMutation({
    mutationFn: archiveSubtask,
    onMutate: async (payload) => {
      setSubtaskError(undefined);
      if (!selectedTaskId) {
        return {};
      }

      await queryClient.cancelQueries({ queryKey: taskQueryKeys.detail(selectedTaskId) });

      const previousDetail = queryClient.getQueryData<TaskWorkspaceData>(
        taskQueryKeys.detail(selectedTaskId)
      );

      queryClient.setQueryData<TaskWorkspaceData>(
        taskQueryKeys.detail(selectedTaskId),
        (current) =>
          updateOptimisticSubtask(current, payload.subtaskId, {
            archivedAt: new Date().toISOString()
          })
      );

      return {
        previousDetail
      };
    },
    onError: (error, _payload, context) => {
      setSubtaskError(
        error instanceof ApiClientError ? error.message : "Unable to archive checklist item."
      );

      if (selectedTaskId && context?.previousDetail) {
        queryClient.setQueryData(taskQueryKeys.detail(selectedTaskId), context.previousDetail);
      }
    },
    onSuccess: (data) => {
      setSubtaskError(undefined);
      syncWorkspaceResult(data);
    }
  });

  const restoreSubtaskMutation = useMutation({
    mutationFn: restoreSubtask,
    onMutate: async (payload) => {
      setSubtaskError(undefined);
      if (!selectedTaskId) {
        return {};
      }

      await queryClient.cancelQueries({ queryKey: taskQueryKeys.detail(selectedTaskId) });

      const previousDetail = queryClient.getQueryData<TaskWorkspaceData>(
        taskQueryKeys.detail(selectedTaskId)
      );

      queryClient.setQueryData<TaskWorkspaceData>(
        taskQueryKeys.detail(selectedTaskId),
        (current) =>
          updateOptimisticSubtask(current, payload.subtaskId, {
            archivedAt: null
          })
      );

      return {
        previousDetail
      };
    },
    onError: (error, _payload, context) => {
      setSubtaskError(
        error instanceof ApiClientError ? error.message : "Unable to restore checklist item."
      );

      if (selectedTaskId && context?.previousDetail) {
        queryClient.setQueryData(taskQueryKeys.detail(selectedTaskId), context.previousDetail);
      }
    },
    onSuccess: (data) => {
      setSubtaskError(undefined);
      syncWorkspaceResult(data);
    }
  });

  const createDependencyMutation = useMutation({
    mutationFn: createTaskDependency,
    onMutate: async (payload) => {
      setDependencyError(undefined);
      if (!selectedTaskId) {
        return {};
      }

      await queryClient.cancelQueries({ queryKey: taskQueryKeys.detail(selectedTaskId) });

      const previousDetail = queryClient.getQueryData<TaskWorkspaceData>(
        taskQueryKeys.detail(selectedTaskId)
      );
      const candidate =
        taskWorkspaceQuery.data?.task?.dependencyCandidates.find(
          (item) => item.id === payload.dependsOnTaskId
        ) ?? null;

      if (candidate) {
        queryClient.setQueryData<TaskWorkspaceData>(
          taskQueryKeys.detail(selectedTaskId),
          (current) =>
            patchTaskDetail(current, {
              dependencies: [...(current?.task?.dependencies ?? []), candidate],
              dependencyCandidates:
                current?.task?.dependencyCandidates.filter(
                  (item) => item.id !== payload.dependsOnTaskId
                ) ?? [],
              dependencyStatuses: [
                ...(current?.task?.dependencyStatuses ?? []),
                candidate.status
              ]
            })
        );

        patchCurrentListTask(payload.taskId, {
          dependencyStatuses: [
            ...(taskWorkspaceQuery.data?.task?.dependencyStatuses ?? []),
            candidate.status
          ]
        });
      }

      return {
        previousDetail
      };
    },
    onError: (error, _payload, context) => {
      setDependencyError(
        error instanceof ApiClientError ? error.message : "Unable to add dependency."
      );

      if (selectedTaskId && context?.previousDetail) {
        queryClient.setQueryData(taskQueryKeys.detail(selectedTaskId), context.previousDetail);
      }
    },
    onSuccess: (data) => {
      setDependencyError(undefined);
      syncWorkspaceResult(data);
    }
  });

  const deleteDependencyMutation = useMutation({
    mutationFn: deleteTaskDependency,
    onMutate: async (payload) => {
      setDependencyError(undefined);
      if (!selectedTaskId) {
        return {};
      }

      await queryClient.cancelQueries({ queryKey: taskQueryKeys.detail(selectedTaskId) });

      const previousDetail = queryClient.getQueryData<TaskWorkspaceData>(
        taskQueryKeys.detail(selectedTaskId)
      );
      const removedDependency =
        taskWorkspaceQuery.data?.task?.dependencies.find(
          (item) => item.id === payload.dependsOnTaskId
        ) ?? null;
      const remainingStatuses =
        taskWorkspaceQuery.data?.task?.dependencies
          .filter((item) => item.id !== payload.dependsOnTaskId)
          .map((item) => item.status) ?? [];

      queryClient.setQueryData<TaskWorkspaceData>(
        taskQueryKeys.detail(selectedTaskId),
        (current) =>
          patchTaskDetail(current, {
            dependencies:
              current?.task?.dependencies.filter((item) => item.id !== payload.dependsOnTaskId) ??
              [],
            dependencyCandidates: removedDependency
              ? [...(current?.task?.dependencyCandidates ?? []), removedDependency].sort((a, b) =>
                  a.title.localeCompare(b.title)
                )
              : current?.task?.dependencyCandidates ?? [],
            dependencyStatuses: remainingStatuses
          })
      );

      patchCurrentListTask(payload.taskId, {
        dependencyStatuses: remainingStatuses
      });

      return {
        previousDetail
      };
    },
    onError: (error, _payload, context) => {
      setDependencyError(
        error instanceof ApiClientError ? error.message : "Unable to remove dependency."
      );

      if (selectedTaskId && context?.previousDetail) {
        queryClient.setQueryData(taskQueryKeys.detail(selectedTaskId), context.previousDetail);
      }
    },
    onSuccess: (data) => {
      setDependencyError(undefined);
      syncWorkspaceResult(data);
    }
  });

  const archiveTaskMutation = useMutation({
    mutationFn: archiveTask,
    onMutate: async (payload) => {
      setArchiveError(undefined);
      if (!selectedTaskId) {
        return {};
      }

      await queryClient.cancelQueries({ queryKey: currentListKey });
      await queryClient.cancelQueries({ queryKey: taskQueryKeys.detail(selectedTaskId) });

      const previousList = queryClient.getQueryData<TaskListResponse>(currentListKey);
      const previousDetail = queryClient.getQueryData<TaskWorkspaceData>(
        taskQueryKeys.detail(selectedTaskId)
      );
      const archivedAt = new Date().toISOString();

      patchCurrentListTask(payload.taskId, {
        archivedAt
      });

      queryClient.setQueryData<TaskWorkspaceData>(
        taskQueryKeys.detail(selectedTaskId),
        (current) =>
          patchTaskDetail(current, {
            archivedAt,
            subtasks:
              current?.task?.subtasks.map((subtask) => ({
                ...subtask,
                archivedAt: subtask.archivedAt ?? archivedAt
              })) ?? []
          })
      );

      return {
        previousList,
        previousDetail
      };
    },
    onError: (error, _payload, context) => {
      setArchiveError(
        error instanceof ApiClientError ? error.message : "Unable to archive task."
      );

      if (context?.previousList) {
        queryClient.setQueryData(currentListKey, context.previousList);
      }

      if (selectedTaskId && context?.previousDetail) {
        queryClient.setQueryData(taskQueryKeys.detail(selectedTaskId), context.previousDetail);
      }
    },
    onSuccess: (data) => {
      setArchiveError(undefined);
      syncWorkspaceResult(data);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.lists() });
    }
  });

  const restoreTaskMutation = useMutation({
    mutationFn: restoreTask,
    onMutate: async (payload) => {
      setArchiveError(undefined);
      if (!selectedTaskId) {
        return {};
      }

      await queryClient.cancelQueries({ queryKey: currentListKey });
      await queryClient.cancelQueries({ queryKey: taskQueryKeys.detail(selectedTaskId) });

      const previousList = queryClient.getQueryData<TaskListResponse>(currentListKey);
      const previousDetail = queryClient.getQueryData<TaskWorkspaceData>(
        taskQueryKeys.detail(selectedTaskId)
      );

      patchCurrentListTask(payload.taskId, {
        archivedAt: null
      });

      queryClient.setQueryData<TaskWorkspaceData>(
        taskQueryKeys.detail(selectedTaskId),
        (current) =>
          patchTaskDetail(current, {
            archivedAt: null,
            subtasks:
              current?.task?.subtasks.map((subtask) => ({
                ...subtask,
                archivedAt: null
              })) ?? []
          })
      );

      return {
        previousList,
        previousDetail
      };
    },
    onError: (error, _payload, context) => {
      setArchiveError(
        error instanceof ApiClientError ? error.message : "Unable to restore task."
      );

      if (context?.previousList) {
        queryClient.setQueryData(currentListKey, context.previousList);
      }

      if (selectedTaskId && context?.previousDetail) {
        queryClient.setQueryData(taskQueryKeys.detail(selectedTaskId), context.previousDetail);
      }
    },
    onSuccess: (data) => {
      setArchiveError(undefined);
      syncWorkspaceResult(data);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.lists() });
    }
  });

  const bulkMutation = useMutation({
    mutationFn: bulkUpdateTasks,
    onMutate: async (payload) => {
      setBulkError(undefined);
      await queryClient.cancelQueries({ queryKey: currentListKey });
      if (selectedTaskId) {
        await queryClient.cancelQueries({ queryKey: taskQueryKeys.detail(selectedTaskId) });
      }

      const previousList = queryClient.getQueryData<TaskListResponse>(currentListKey);
      const previousDetail = selectedTaskId
        ? queryClient.getQueryData<TaskWorkspaceData>(taskQueryKeys.detail(selectedTaskId))
        : undefined;
      const userLookup = new Map((taskListQuery.data?.users ?? []).map((user) => [user.id, user]));
      const archivedAt = new Date().toISOString();

      payload.taskIds.forEach((taskId) => {
        switch (payload.action) {
          case "assign":
            patchCurrentListTask(taskId, {
              assignedTo: payload.assignedToId
                ? taskListQuery.data?.users.find((user) => user.id === payload.assignedToId) ?? null
                : null
            });
            break;
          case "clearAssignee":
            patchCurrentListTask(taskId, {
              assignedTo: null
            });
            break;
          case "status":
            patchCurrentListTask(taskId, {
              status: payload.status!,
              blockedReason:
                payload.status === "BLOCKED" ? payload.blockedReason ?? null : null
            });
            break;
          case "priority":
            patchCurrentListTask(taskId, {
              priority: payload.priority!
            });
            break;
          case "setDueDate":
            patchCurrentListTask(taskId, {
              dueDate: payload.dueDate ?? null
            });
            break;
          case "archive":
            patchCurrentListTask(taskId, {
              archivedAt
            });
            break;
          case "restore":
            patchCurrentListTask(taskId, {
              archivedAt: null
            });
            break;
        }
      });

      if (selectedTaskId && payload.taskIds.includes(selectedTaskId)) {
        queryClient.setQueryData<TaskWorkspaceData>(
          taskQueryKeys.detail(selectedTaskId),
          (current) => {
            if (!current?.task) {
              return current;
            }

            switch (payload.action) {
              case "assign":
                return patchTaskDetail(current, {
                  assignedToId: payload.assignedToId ?? null,
                  assignedTo: payload.assignedToId
                    ? userLookup.get(payload.assignedToId) ?? null
                    : null
                });
              case "clearAssignee":
                return patchTaskDetail(current, {
                  assignedToId: null,
                  assignedTo: null
                });
              case "status":
                return patchTaskDetail(current, {
                  status: payload.status!,
                  blockedReason:
                    payload.status === "BLOCKED" ? payload.blockedReason ?? null : null
                });
              case "priority":
                return patchTaskDetail(current, {
                  priority: payload.priority!
                });
              case "setDueDate":
                return patchTaskDetail(current, {
                  dueDate: payload.dueDate ?? null
                });
              case "archive":
                return patchTaskDetail(current, {
                  archivedAt,
                  subtasks: current.task.subtasks.map((subtask) => ({
                    ...subtask,
                    archivedAt: subtask.archivedAt ?? archivedAt
                  }))
                });
              case "restore":
                return patchTaskDetail(current, {
                  archivedAt: null,
                  subtasks: current.task.subtasks.map((subtask) => ({
                    ...subtask,
                    archivedAt: null
                  }))
                });
            }
          }
        );
      }

      return {
        previousList,
        previousDetail
      };
    },
    onError: (error, _payload, context) => {
      setBulkError(
        error instanceof ApiClientError ? error.message : "Unable to apply bulk action."
      );

      if (context?.previousList) {
        queryClient.setQueryData(currentListKey, context.previousList);
      }

      if (selectedTaskId && context?.previousDetail) {
        queryClient.setQueryData(taskQueryKeys.detail(selectedTaskId), context.previousDetail);
      }
    },
    onSuccess: async (result) => {
      setBulkError(undefined);
      setSelectedTaskIds([]);

      await Promise.all(
        result.updatedTaskIds.map((taskId) =>
          queryClient.invalidateQueries({ queryKey: taskQueryKeys.detail(taskId) })
        )
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.lists() });
      if (selectedTaskId) {
        void queryClient.invalidateQueries({ queryKey: taskQueryKeys.detail(selectedTaskId) });
      }
    }
  });

  const search = buildTaskSearchParams(searchState).toString();
  const selectedTaskIndex = visibleTasks.findIndex((task) => task.id === selectedTaskId);
  const previousTaskId =
    selectedTaskIndex > 0 ? visibleTasks[selectedTaskIndex - 1]?.id : undefined;
  const nextTaskId =
    selectedTaskIndex >= 0 && selectedTaskIndex < visibleTasks.length - 1
      ? visibleTasks[selectedTaskIndex + 1]?.id
      : undefined;

  function setSearchStatePatch(patch: Partial<TaskWorkspaceSearchState>) {
    setSearchParams(updateTaskSearchState(searchParams, patch), {
      replace: patch.q !== undefined
    });
  }

  function handleReset() {
    setSearchParams(
      buildTaskSearchParams({
        q: "",
        status: "ALL",
        section: "",
        priority: "",
        assignee: "",
        queue: "all",
        archived: "active",
        sort: "dueDate",
        view: "list"
      })
    );
  }

  function prefetchTask(taskId: string) {
    void queryClient.prefetchQuery({
      queryKey: taskQueryKeys.detail(taskId),
      queryFn: () => getTaskWorkspace(taskId)
    });
  }

  function navigateToTask(taskId?: string) {
    if (!taskId) {
      return;
    }

    navigate({
      pathname: `/tasks/${taskId}`,
      search
    });
  }

  function toggleTaskSelection(taskId: string) {
    setSelectedTaskIds((current) =>
      current.includes(taskId)
        ? current.filter((item) => item !== taskId)
        : [...current, taskId]
    );
  }

  function toggleSelectAllVisible() {
    setSelectedTaskIds((current) => {
      if (allVisibleSelected) {
        return current.filter((taskId) => !visibleTaskIdSet.has(taskId));
      }

      return Array.from(new Set([...current, ...visibleTasks.map((task) => task.id)]));
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-border bg-white/85 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.4)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Tasks Workspace v2
        </p>
        <h2 className="mt-2 text-3xl font-semibold">Fast, stable task flow</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          The queue stays anchored while subtasks, dependencies, archive state, comments, and
          owner-only bulk actions all stay inside the SPA workspace.
        </p>
      </section>

      <WorkspaceFilters
        archived={searchState.archived}
        assignee={searchState.assignee}
        currentUserId={currentUser?.id ?? ""}
        onChange={setSearchStatePatch}
        onReset={handleReset}
        priority={searchState.priority}
        q={searchState.q}
        queue={searchState.queue}
        queueCounts={
          taskListQuery.data?.queueCounts ?? {
            all: 0,
            myWork: 0,
            overdue: 0,
            upcoming: 0,
            blocked: 0,
            unassigned: 0,
            stale: 0
          }
        }
        sections={taskListQuery.data?.sections ?? []}
        section={searchState.section}
        sort={searchState.sort}
        status={searchState.status}
        users={taskListQuery.data?.users ?? []}
        view={searchState.view}
      />

      {currentUser?.role === "OWNER_ADMIN" ? (
        <BulkActionsPanel
          archiveView={searchState.archived}
          error={bulkError}
          isPending={bulkMutation.isPending}
          onClearSelection={() => setSelectedTaskIds([])}
          onSubmit={async (values) => {
            await bulkMutation.mutateAsync({
              taskIds: selectedTaskIds,
              action: values.action,
              assignedToId: values.assignedToId || null,
              status: values.status,
              priority: values.priority,
              dueDate: values.dueDate || null,
              blockedReason: values.blockedReason || null
            } satisfies TaskBulkActionInput);
          }}
          selectedCount={selectedTaskIds.length}
          users={taskListQuery.data?.users ?? []}
          visibleCount={visibleTasks.length}
        />
      ) : null}

      {searchState.view === "board" && searchState.archived !== "active" ? (
        <div className="rounded-[1.5rem] border border-border bg-card/90 p-4 text-sm text-muted-foreground shadow-sm">
          Board view stays focused on active work. Switch the archive filter back to Active to use
          the board.
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] xl:items-start">
        <div className="space-y-4">
          {taskListQuery.isLoading ? (
            <div className="rounded-[1.75rem] border border-border bg-card/90 p-5 text-sm text-muted-foreground shadow-sm">
              Loading task queue…
            </div>
          ) : null}

          {taskListQuery.error instanceof ApiClientError ? (
            <div className="rounded-[1.75rem] border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              {taskListQuery.error.message}
            </div>
          ) : null}

          {showBoardView ? (
            <TaskBoardPanel
              activeTaskId={selectedTaskId}
              canSelectTasks={currentUser?.role === "OWNER_ADMIN"}
              onPrefetchTask={prefetchTask}
              onToggleTaskSelection={toggleTaskSelection}
              search={search ? `?${search}` : ""}
              selectedTaskIds={selectedTaskIds}
              tasks={visibleTasks}
            />
          ) : (
            <TaskListPanel
              activeTaskId={selectedTaskId}
              allVisibleSelected={allVisibleSelected}
              canSelectTasks={currentUser?.role === "OWNER_ADMIN"}
              onPrefetchTask={prefetchTask}
              onToggleSelectAllVisible={toggleSelectAllVisible}
              onToggleTaskSelection={toggleTaskSelection}
              search={search ? `?${search}` : ""}
              selectedTaskIds={selectedTaskIds}
              tasks={visibleTasks}
            />
          )}
        </div>

        <div className="min-w-0">
          {selectedTaskId ? (
            taskWorkspaceQuery.isLoading ? (
              <section className="rounded-[1.75rem] border border-border bg-card/90 p-5 text-sm text-muted-foreground shadow-sm xl:sticky xl:top-6">
                Loading task workspace…
              </section>
            ) : taskWorkspaceQuery.data && currentUser ? (
              <TaskShelf
                archiveError={archiveError}
                commentError={commentError}
                currentUser={currentUser as SessionPayload["user"]}
                data={taskWorkspaceQuery.data}
                dependencyError={dependencyError}
                isArchivingTask={archiveTaskMutation.isPending || restoreTaskMutation.isPending}
                isPostingComment={createCommentMutation.isPending}
                isSavingDependency={
                  createDependencyMutation.isPending || deleteDependencyMutation.isPending
                }
                isSavingSubtask={
                  createSubtaskMutation.isPending ||
                  updateSubtaskMutation.isPending ||
                  deleteSubtaskMutation.isPending ||
                  archiveSubtaskMutation.isPending ||
                  restoreSubtaskMutation.isPending
                }
                isSavingTask={updateTaskMutation.isPending}
                onAddDependency={async (payload) => {
                  await createDependencyMutation.mutateAsync(payload);
                }}
                onArchiveSubtask={async (payload) => {
                  await archiveSubtaskMutation.mutateAsync(payload);
                }}
                onArchiveTask={async (payload) => {
                  await archiveTaskMutation.mutateAsync(payload);
                }}
                onClose={() =>
                  navigate({
                    pathname: "/tasks",
                    search
                  })
                }
                onCreateSubtask={async (payload) => {
                  await createSubtaskMutation.mutateAsync(payload);
                }}
                onDeleteSubtask={async (payload) => {
                  await deleteSubtaskMutation.mutateAsync(payload);
                }}
                onNext={nextTaskId ? () => navigateToTask(nextTaskId) : undefined}
                onPrevious={previousTaskId ? () => navigateToTask(previousTaskId) : undefined}
                onRemoveDependency={async (payload) => {
                  await deleteDependencyMutation.mutateAsync(payload as TaskDependencyDeleteInput);
                }}
                onRestoreSubtask={async (payload) => {
                  await restoreSubtaskMutation.mutateAsync(payload);
                }}
                onRestoreTask={async (payload) => {
                  await restoreTaskMutation.mutateAsync(payload as TaskArchiveInput);
                }}
                onSubmitComment={async (payload) => {
                  await createCommentMutation.mutateAsync(payload);
                }}
                onSubmitTaskUpdate={async (payload) => {
                  await updateTaskMutation.mutateAsync(payload);
                }}
                onUpdateSubtask={async (payload) => {
                  await updateSubtaskMutation.mutateAsync(payload);
                }}
                subtaskError={subtaskError}
                taskError={taskError}
              />
            ) : (
              <section className="rounded-[1.75rem] border border-border bg-card/90 p-5 text-sm text-muted-foreground shadow-sm">
                Task unavailable.
              </section>
            )
          ) : (
            <section className="flex min-h-[24rem] items-center justify-center rounded-[1.75rem] border border-dashed border-border bg-card/80 p-8 text-center shadow-sm xl:sticky xl:top-6">
              <div>
                <p className="font-medium">Select a task to keep working in context.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  The left queue remains stable while task details, updates, dependencies, and
                  checklist work stay in the right-side shelf.
                </p>
                {visibleTasks[0] ? (
                  <Link
                    className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                    to={{
                      pathname: `/tasks/${visibleTasks[0].id}`,
                      search
                    }}
                  >
                    Open first visible task
                  </Link>
                ) : null}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
