import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ApiErrorResponse,
  DocumentWorkspaceData,
  SessionPayload,
  TaskArchiveInput,
  TaskBulkActionInput,
  TaskBulkActionResult,
  TaskCreateInput,
  TaskCommentCreateInput,
  TaskDependencyCreateInput,
  TaskDependencyDeleteInput,
  TaskSort,
  TaskSortDirection,
  TaskListFilters,
  TaskListResponse,
  TaskSummary,
  TaskWorkspaceComment,
  TaskWorkspaceData,
  TaskWorkspaceSearchState,
  TaskWorkspaceSubtask,
  TaskWorkspaceUpdateInput
} from "@salt/types";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { ApiClientError } from "../../../lib/api-client";
import { SlideOverPanel } from "../../../app/components/slide-over-panel";
import {
  WorkspacePageHeader,
  WorkspaceSurface
} from "../../../app/components/workspace-page";
import { useToast } from "../../../app/providers/toast-provider";
import { useAuthSessionQuery } from "../../auth/hooks/use-auth-session-query";
import {
  getDocumentList,
  linkDocumentToTask,
  unlinkDocumentFromTask,
  uploadDocument
} from "../../documents/api/documents-client";
import {
  archiveSubtask,
  archiveTask,
  bulkUpdateTasks,
  createTask,
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
import { TaskCreatePanel } from "../components/task-create-panel";
import { TaskChecklistPreviewPanel } from "../components/task-checklist-preview-panel";
import { TaskListPanel } from "../components/task-list-panel";
import { TaskShelf } from "../components/task-shelf";
import { WorkspaceFilters } from "../components/workspace-filters";
import { taskQueryKeys } from "../lib/query-keys";
import {
  DEFAULT_TASK_WORKSPACE_STATE,
  buildTaskSearchParams,
  getTaskWorkspaceSearchState,
  toTaskListFilters,
  updateTaskSearchState
} from "../lib/url-state";

function getDefaultSortOrder(sort: TaskSort): TaskSortDirection {
  return sort === "priority" ? "desc" : "asc";
}

function compareStrings(left: string, right: string, direction: TaskSortDirection) {
  return direction === "asc" ? left.localeCompare(right) : right.localeCompare(left);
}

function sortTasks(tasks: TaskSummary[], sort: TaskSort, order: TaskSortDirection) {
  return [...tasks].sort((left, right) => {
    switch (sort) {
      case "title":
        return compareStrings(left.title, right.title, order);
      case "status":
        return compareStrings(left.status, right.status, order);
      case "priority":
        return compareStrings(left.priority, right.priority, order);
      case "dueDate": {
        const leftValue = left.dueDate ? new Date(left.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        const rightValue = right.dueDate ? new Date(right.dueDate).getTime() : Number.MAX_SAFE_INTEGER;

        if (leftValue === rightValue) {
          return left.title.localeCompare(right.title);
        }

        return order === "asc" ? leftValue - rightValue : rightValue - leftValue;
      }
      default:
        return 0;
    }
  });
}

function matchesAssigneeFilters(
  task: TaskSummary,
  assigneeFilters: TaskListFilters["assignee"],
  currentUserId?: string
) {
  if (!assigneeFilters || assigneeFilters.length === 0) {
    return true;
  }

  return assigneeFilters.some((assignee) => {
    if (assignee === "unassigned") {
      return !task.assignedTo;
    }

    if (assignee === "me") {
      return task.assignedTo?.id === currentUserId;
    }

    return task.assignedTo?.id === assignee;
  });
}

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

  if (filters.status && filters.status.length > 0 && !filters.status.includes(task.status)) {
    return false;
  }

  if (filters.section && filters.section.length > 0 && !filters.section.includes(task.section.slug)) {
    return false;
  }

  if (filters.priority && filters.priority.length > 0 && !filters.priority.includes(task.priority)) {
    return false;
  }

  if (filters.archived === "active" && task.archivedAt) {
    return false;
  }

  if (filters.archived === "archived" && !task.archivedAt) {
    return false;
  }

  if (!matchesAssigneeFilters(task, filters.assignee, currentUserId)) {
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
      | "title"
      | "description"
      | "notes"
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
      | "title"
      | "description"
      | "notes"
      | "assignedTo"
      | "assignedToId"
      | "blockedReason"
      | "archivedAt"
      | "dueDate"
      | "dependencyStatuses"
      | "attachments"
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
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createTaskError, setCreateTaskError] = useState<string>();
  const [createTaskFieldErrors, setCreateTaskFieldErrors] = useState<
    ApiErrorResponse["error"]["fieldErrors"]
  >();
  const [createdTaskNotice, setCreatedTaskNotice] = useState<{
    taskId: string;
    title: string;
  } | null>(null);
  const [taskError, setTaskError] = useState<string>();
  const [commentError, setCommentError] = useState<string>();
  const [subtaskError, setSubtaskError] = useState<string>();
  const [dependencyError, setDependencyError] = useState<string>();
  const [archiveError, setArchiveError] = useState<string>();
  const [bulkError, setBulkError] = useState<string>();
  const [documentError, setDocumentError] = useState<string>();
  const [taskShelfExpanded, setTaskShelfExpanded] = useState(false);
  const [checklistPreviewTaskId, setChecklistPreviewTaskId] = useState<string>();
  const toast = useToast();
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

  const availableDocumentsQuery = useQuery({
    queryKey: ["documents", "list", "task-linker"],
    queryFn: () => getDocumentList({})
  });

  const currentUser = sessionQuery.data?.user;
  const visibleTasks = useMemo(
    () =>
      sortTasks(
        taskListQuery.data?.tasks ?? [],
        searchState.sort,
        searchState.order
      ),
    [taskListQuery.data?.tasks, searchState.order, searchState.sort]
  );
  const visibleTaskIdSet = useMemo(
    () => new Set(visibleTasks.map((task) => task.id)),
    [visibleTasks]
  );
  const allVisibleSelected =
    visibleTasks.length > 0 && visibleTasks.every((task) => selectedTaskIds.includes(task.id));
  const showBoardView = searchState.view === "board" && searchState.archived === "active";
  const checklistPreviewQuery = useQuery({
    queryKey: checklistPreviewTaskId
      ? taskQueryKeys.detail(checklistPreviewTaskId)
      : ["tasks", "detail", "preview-none"],
    queryFn: () => getTaskWorkspace(checklistPreviewTaskId!),
    enabled: Boolean(checklistPreviewTaskId)
  });

  useEffect(() => {
    setSelectedTaskIds((current) => {
      const next = current.filter((taskId) => visibleTaskIdSet.has(taskId));

      if (next.length === current.length && next.every((taskId, index) => taskId === current[index])) {
        return current;
      }

      return next;
    });
  }, [visibleTaskIdSet]);

  useEffect(() => {
    if (!selectedTaskId) {
      setTaskShelfExpanded(false);
    }
  }, [selectedTaskId]);

  useEffect(() => {
    if (checklistPreviewTaskId && !visibleTaskIdSet.has(checklistPreviewTaskId)) {
      setChecklistPreviewTaskId(undefined);
    }
  }, [checklistPreviewTaskId, visibleTaskIdSet]);

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

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onMutate: async () => {
      setCreateTaskError(undefined);
      setCreateTaskFieldErrors(undefined);
    },
    onError: (error) => {
      const message =
        error instanceof ApiClientError ? error.message : "Unable to create task.";
      setCreateTaskError(message);
      setCreateTaskFieldErrors(
        error instanceof ApiClientError ? error.payload?.error.fieldErrors : undefined
      );
      toast.error("Task creation failed", message);
    },
    onSuccess: (data) => {
      if (!data.task) {
        return;
      }

      const nextSearch = buildTaskSearchParams(searchState).toString();
      const isVisibleInCurrentContext = matchesTaskFilters(
        data.task,
        activeFilters,
        currentUser?.id
      );

      setCreateTaskOpen(false);
      setCreateTaskError(undefined);
      setCreateTaskFieldErrors(undefined);
      queryClient.setQueryData(taskQueryKeys.detail(data.task.id), data);
      queryClient.setQueryData<TaskListResponse>(taskQueryKeys.list(activeFilters), (current) =>
        current
          ? replaceTaskInList(current, data.task!, activeFilters, currentUser?.id)
          : current
      );
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: ["documents", "list"] });

      if (isVisibleInCurrentContext) {
        setCreatedTaskNotice(null);
        toast.success("Task created", data.task.title);
        navigate({
          pathname: `/tasks/${data.task.id}`,
          search: nextSearch ? `?${nextSearch}` : ""
        });
        return;
      }

      setCreatedTaskNotice({
        taskId: data.task.id,
        title: data.task.title
      });
      toast.success("Task created", `${data.task.title} is hidden by your current filters or search.`);
    }
  });

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
        title: payload.title,
        description: payload.description,
        notes: payload.notes,
        dueDate: payload.dueDate,
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
              title: payload.title,
              description: payload.description,
              notes: payload.notes,
              dueDate: payload.dueDate,
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
      const message =
        error instanceof ApiClientError ? error.message : "Unable to save task changes.";
      setTaskError(message);
      toast.error("Task update failed", message);

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
      toast.success("Task updated", data.task?.title);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.lists() });
    }
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: uploadDocument,
    onMutate: async () => {
      setDocumentError(undefined);
      if (selectedTaskId) {
        await queryClient.cancelQueries({ queryKey: taskQueryKeys.detail(selectedTaskId) });
      }
    },
    onError: (error) => {
      const message =
        error instanceof ApiClientError ? error.message : "Unable to upload document.";
      setDocumentError(message);
      toast.error("Document upload failed", message);
    },
    onSuccess: (data: DocumentWorkspaceData) => {
      setDocumentError(undefined);
      const document = data.document;

      if (selectedTaskId && document && document.linkedTask?.id === selectedTaskId) {
        queryClient.setQueryData<TaskWorkspaceData>(
          taskQueryKeys.detail(selectedTaskId),
          (current) =>
            current?.task
              ? patchTaskDetail(current, {
                  attachments: [
                    {
                      id: document.id,
                      title: document.title,
                      category: document.category,
                      originalName: document.originalName,
                      storagePath: document.storagePath,
                      createdAt: document.createdAt
                    },
                    ...current.task.attachments.filter(
                      (attachment) => attachment.id !== document.id
                    )
                  ]
                })
              : current
        );
      }

      toast.success("Document uploaded", document?.title);
    },
    onSettled: () => {
      if (selectedTaskId) {
        void queryClient.invalidateQueries({ queryKey: taskQueryKeys.detail(selectedTaskId) });
      }
    }
  });

  const linkExistingDocumentsMutation = useMutation({
    mutationFn: async (payload: { taskId: string; documentIds: string[] }) => {
      await Promise.all(
        payload.documentIds.map((documentId) =>
          linkDocumentToTask({
            documentId,
            taskId: payload.taskId
          })
        )
      );

      return payload;
    },
    onMutate: async () => {
      setDocumentError(undefined);
      if (selectedTaskId) {
        await queryClient.cancelQueries({ queryKey: taskQueryKeys.detail(selectedTaskId) });
      }
    },
    onError: (error) => {
      const message =
        error instanceof ApiClientError ? error.message : "Unable to link existing documents.";
      setDocumentError(message);
      toast.error("Document link failed", message);
    },
    onSuccess: async (payload) => {
      setDocumentError(undefined);
      await queryClient.invalidateQueries({ queryKey: taskQueryKeys.detail(payload.taskId) });
      await queryClient.invalidateQueries({ queryKey: ["documents", "list"] });
      toast.success(
        "Existing documents linked",
        `${payload.documentIds.length} document${payload.documentIds.length === 1 ? "" : "s"} added`
      );
    }
  });

  const unlinkExistingDocumentMutation = useMutation({
    mutationFn: async (payload: { taskId: string; documentId: string }) => {
      await unlinkDocumentFromTask({
        documentId: payload.documentId,
        taskId: payload.taskId
      });

      return payload;
    },
    onMutate: async () => {
      setDocumentError(undefined);
      if (selectedTaskId) {
        await queryClient.cancelQueries({ queryKey: taskQueryKeys.detail(selectedTaskId) });
      }
    },
    onError: (error) => {
      const message =
        error instanceof ApiClientError ? error.message : "Unable to unlink document.";
      setDocumentError(message);
      toast.error("Document unlink failed", message);
    },
    onSuccess: async (payload) => {
      setDocumentError(undefined);
      await queryClient.invalidateQueries({ queryKey: taskQueryKeys.detail(payload.taskId) });
      await queryClient.invalidateQueries({ queryKey: ["documents", "list"] });
      toast.success("Document unlinked");
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
      const message =
        error instanceof ApiClientError ? error.message : "Unable to post comment.";
      setCommentError(message);
      toast.error("Comment failed", message);

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
      toast.success("Comment posted");
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
      const message =
        error instanceof ApiClientError ? error.message : "Unable to add checklist item.";
      setSubtaskError(message);
      toast.error("Checklist item failed", message);

      if (selectedTaskId && context?.previousDetail) {
        queryClient.setQueryData(taskQueryKeys.detail(selectedTaskId), context.previousDetail);
      }
    },
    onSuccess: (data) => {
      setSubtaskError(undefined);
      syncWorkspaceResult(data);
      toast.success("Checklist item added");
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
      const message =
        error instanceof ApiClientError ? error.message : "Unable to save checklist item.";
      setSubtaskError(message);
      toast.error("Checklist item save failed", message);

      if (selectedTaskId && context?.previousDetail) {
        queryClient.setQueryData(taskQueryKeys.detail(selectedTaskId), context.previousDetail);
      }
    },
    onSuccess: (data) => {
      setSubtaskError(undefined);
      syncWorkspaceResult(data);
      toast.success("Checklist item updated");
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
      const message =
        error instanceof ApiClientError ? error.message : "Unable to delete checklist item.";
      setSubtaskError(message);
      toast.error("Checklist item delete failed", message);

      if (selectedTaskId && context?.previousDetail) {
        queryClient.setQueryData(taskQueryKeys.detail(selectedTaskId), context.previousDetail);
      }
    },
    onSuccess: (data) => {
      setSubtaskError(undefined);
      syncWorkspaceResult(data);
      toast.success("Checklist item removed");
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
      const message =
        error instanceof ApiClientError ? error.message : "Unable to archive checklist item.";
      setSubtaskError(message);
      toast.error("Checklist item archive failed", message);

      if (selectedTaskId && context?.previousDetail) {
        queryClient.setQueryData(taskQueryKeys.detail(selectedTaskId), context.previousDetail);
      }
    },
    onSuccess: (data) => {
      setSubtaskError(undefined);
      syncWorkspaceResult(data);
      toast.success("Checklist item archived");
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
      const message =
        error instanceof ApiClientError ? error.message : "Unable to restore checklist item.";
      setSubtaskError(message);
      toast.error("Checklist item restore failed", message);

      if (selectedTaskId && context?.previousDetail) {
        queryClient.setQueryData(taskQueryKeys.detail(selectedTaskId), context.previousDetail);
      }
    },
    onSuccess: (data) => {
      setSubtaskError(undefined);
      syncWorkspaceResult(data);
      toast.success("Checklist item restored");
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
      const message =
        error instanceof ApiClientError ? error.message : "Unable to add dependency.";
      setDependencyError(message);
      toast.error("Dependency update failed", message);

      if (selectedTaskId && context?.previousDetail) {
        queryClient.setQueryData(taskQueryKeys.detail(selectedTaskId), context.previousDetail);
      }
    },
    onSuccess: (data) => {
      setDependencyError(undefined);
      syncWorkspaceResult(data);
      toast.success("Dependency added");
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
      const message =
        error instanceof ApiClientError ? error.message : "Unable to remove dependency.";
      setDependencyError(message);
      toast.error("Dependency update failed", message);

      if (selectedTaskId && context?.previousDetail) {
        queryClient.setQueryData(taskQueryKeys.detail(selectedTaskId), context.previousDetail);
      }
    },
    onSuccess: (data) => {
      setDependencyError(undefined);
      syncWorkspaceResult(data);
      toast.success("Dependency removed");
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
      const message =
        error instanceof ApiClientError ? error.message : "Unable to archive task.";
      setArchiveError(message);
      toast.error("Task archive failed", message);

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
      toast.success("Task archived", data.task?.title);
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
      const message =
        error instanceof ApiClientError ? error.message : "Unable to restore task.";
      setArchiveError(message);
      toast.error("Task restore failed", message);

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
      toast.success("Task restored", data.task?.title);
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
      const message =
        error instanceof ApiClientError ? error.message : "Unable to apply bulk action.";
      setBulkError(message);
      toast.error("Bulk action failed", message);

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
      toast.success(
        "Bulk action applied",
        `${result.updatedTaskIds.length} task${result.updatedTaskIds.length === 1 ? "" : "s"} updated.`
      );

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
  const checklistPreviewData =
    checklistPreviewTaskId && checklistPreviewTaskId === selectedTaskId
      ? taskWorkspaceQuery.data
      : checklistPreviewQuery.data;
  const checklistPreviewError =
    checklistPreviewTaskId && checklistPreviewTaskId === selectedTaskId
      ? taskWorkspaceQuery.error instanceof ApiClientError
        ? taskWorkspaceQuery.error.message
        : undefined
      : checklistPreviewQuery.error instanceof ApiClientError
        ? checklistPreviewQuery.error.message
        : undefined;

  function setSearchStatePatch(patch: Partial<TaskWorkspaceSearchState>) {
    setSearchParams(updateTaskSearchState(searchParams, patch), {
      replace: patch.q !== undefined
    });
  }

  function handleReset() {
    setSearchParams(buildTaskSearchParams(DEFAULT_TASK_WORKSPACE_STATE));
  }

  function handleSortChange(nextSort: TaskSort) {
    setSearchStatePatch({
      sort: nextSort,
      order:
        searchState.sort === nextSort
          ? searchState.order === "asc"
            ? "desc"
            : "asc"
          : getDefaultSortOrder(nextSort)
    });
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

  function toggleChecklistPreview(taskId: string) {
    setChecklistPreviewTaskId((current) => (current === taskId ? undefined : taskId));
  }

  return (
    <div className="space-y-6">
      <WorkspacePageHeader
        description="Search, sort, and review work from a single queue."
        eyebrow="Tasks"
        actions={
          currentUser?.role === "OWNER_ADMIN" ? (
            <button
              className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[0_14px_34px_-18px_rgba(33,95,84,0.7)] transition hover:opacity-95"
              onClick={() => {
                setCreatedTaskNotice(null);
                setCreateTaskError(undefined);
                setCreateTaskFieldErrors(undefined);
                setCreateTaskOpen(true);
              }}
              type="button"
            >
              New task
            </button>
          ) : null
        }
        title="Work queue"
      />

      <WorkspaceSurface
        bodyClassName="space-y-4"
        toolbar={
          <div className="space-y-3">
            <WorkspaceFilters
              archived={searchState.archived}
              assignee={searchState.assignee}
              currentUserId={currentUser?.id ?? ""}
              group={searchState.group}
              onChange={setSearchStatePatch}
              onReset={handleReset}
              order={searchState.order}
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

            {currentUser?.role === "OWNER_ADMIN" && selectedTaskIds.length > 0 ? (
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
          </div>
        }
      >
        {createdTaskNotice ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.15rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <div>
              <p className="font-medium">Task created, but it is hidden by the current filters or search.</p>
              <p className="mt-1 text-emerald-800/85">{createdTaskNotice.title}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="rounded-full border border-emerald-300 bg-white px-3 py-1.5 font-medium text-emerald-900 hover:bg-emerald-100/60"
                onClick={() => {
                  navigateToTask(createdTaskNotice.taskId);
                  setCreatedTaskNotice(null);
                }}
                type="button"
              >
                Show task
              </button>
              <button
                className="rounded-full border border-emerald-300 bg-white px-3 py-1.5 font-medium text-emerald-900 hover:bg-emerald-100/60"
                onClick={() => {
                  handleReset();
                  setCreatedTaskNotice(null);
                }}
                type="button"
              >
                Reset view
              </button>
              <button
                className="rounded-full px-2 py-1 text-xs font-medium text-emerald-900/75 hover:bg-emerald-100/60"
                onClick={() => setCreatedTaskNotice(null)}
                type="button"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : null}

        {searchState.view === "board" && searchState.archived !== "active" ? (
          <div className="rounded-[1.25rem] border border-border bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
            Board view stays focused on active work. Switch the archive filter back to Active to use
            the board.
          </div>
        ) : null}

        {taskListQuery.isLoading ? (
          <div className="rounded-[1.25rem] border border-border bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
            Loading task queue...
          </div>
        ) : taskListQuery.error instanceof ApiClientError ? (
          <div className="rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            {taskListQuery.error.message}
          </div>
        ) : searchState.view === "list" && checklistPreviewTaskId && currentUser ? (
          <>
            <TaskChecklistPreviewPanel
              currentUser={currentUser as SessionPayload["user"]}
              data={checklistPreviewData}
              error={checklistPreviewError}
              isLoading={
                checklistPreviewTaskId === selectedTaskId
                  ? taskWorkspaceQuery.isLoading
                  : checklistPreviewQuery.isLoading
              }
              isSavingSubtask={
                createSubtaskMutation.isPending ||
                updateSubtaskMutation.isPending ||
                deleteSubtaskMutation.isPending ||
                archiveSubtaskMutation.isPending ||
                restoreSubtaskMutation.isPending
              }
              onClose={() => setChecklistPreviewTaskId(undefined)}
              onOpenTask={(taskId) => navigateToTask(taskId)}
              onToggleSubtask={async (subtask) => {
                await updateSubtaskMutation.mutateAsync({
                  subtaskId: subtask.id,
                  title: subtask.title,
                  notes: subtask.notes,
                  dueDate: subtask.dueDate,
                  assignedToId: subtask.assignedToId,
                  isComplete: !subtask.isComplete,
                  sortOrder: subtask.sortOrder
                });
              }}
            />

            <TaskListPanel
              activeChecklistPreviewTaskId={checklistPreviewTaskId}
              activeTaskId={selectedTaskId}
              allVisibleSelected={allVisibleSelected}
              canSelectTasks={currentUser?.role === "OWNER_ADMIN"}
              group={searchState.group}
              onPrefetchTask={prefetchTask}
              onSortChange={handleSortChange}
              onToggleChecklistPreview={toggleChecklistPreview}
              onToggleSelectAllVisible={toggleSelectAllVisible}
              onToggleTaskSelection={toggleTaskSelection}
              order={searchState.order}
              search={search ? `?${search}` : ""}
              selectedTaskIds={selectedTaskIds}
              sort={searchState.sort}
              tasks={visibleTasks}
            />
          </>
        ) : showBoardView ? (
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
            activeChecklistPreviewTaskId={checklistPreviewTaskId}
            activeTaskId={selectedTaskId}
            allVisibleSelected={allVisibleSelected}
            canSelectTasks={currentUser?.role === "OWNER_ADMIN"}
            group={searchState.group}
            onPrefetchTask={prefetchTask}
            onSortChange={handleSortChange}
            onToggleChecklistPreview={toggleChecklistPreview}
            onToggleSelectAllVisible={toggleSelectAllVisible}
            onToggleTaskSelection={toggleTaskSelection}
            order={searchState.order}
            search={search ? `?${search}` : ""}
            selectedTaskIds={selectedTaskIds}
            sort={searchState.sort}
            tasks={visibleTasks}
          />
        )}
      </WorkspaceSurface>

      <SlideOverPanel
        className="sm:w-[min(34rem,calc(100vw-1rem))]"
        onClose={() => {
          setCreateTaskOpen(false);
          setCreateTaskError(undefined);
          setCreateTaskFieldErrors(undefined);
        }}
        open={createTaskOpen}
        zIndexClassName="z-40"
      >
        <TaskCreatePanel
          documents={availableDocumentsQuery.data?.documents ?? []}
          error={createTaskError}
          fieldErrors={createTaskFieldErrors}
          isPending={createTaskMutation.isPending}
          onClose={() => {
            setCreateTaskOpen(false);
            setCreateTaskError(undefined);
            setCreateTaskFieldErrors(undefined);
          }}
          onSubmit={async (payload: TaskCreateInput) => {
            await createTaskMutation.mutateAsync(payload);
          }}
          phases={taskListQuery.data?.phases ?? []}
          sections={taskListQuery.data?.sections ?? []}
          users={taskListQuery.data?.users ?? []}
        />
      </SlideOverPanel>

      <SlideOverPanel
        expanded={taskShelfExpanded}
        onClose={() =>
          navigate({
            pathname: "/tasks",
            search
          })
        }
        open={Boolean(selectedTaskId)}
      >
        {selectedTaskId ? (
          taskWorkspaceQuery.isLoading ? (
            <div className="flex h-full items-center justify-center px-6 py-8 text-sm text-muted-foreground">
              Loading task workspace...
            </div>
          ) : taskWorkspaceQuery.data && currentUser ? (
            <TaskShelf
              archiveError={archiveError}
              commentError={commentError}
              currentUser={currentUser as SessionPayload["user"]}
              data={taskWorkspaceQuery.data}
              dependencyError={dependencyError}
              documents={availableDocumentsQuery.data?.documents ?? []}
              documentError={documentError}
              isArchivingTask={archiveTaskMutation.isPending || restoreTaskMutation.isPending}
              isExpanded={taskShelfExpanded}
              isLinkingExistingDocuments={
                linkExistingDocumentsMutation.isPending || unlinkExistingDocumentMutation.isPending
              }
              isPostingComment={createCommentMutation.isPending}
              isUploadingDocument={uploadDocumentMutation.isPending}
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
              onLinkExistingDocuments={async (payload) => {
                await linkExistingDocumentsMutation.mutateAsync(payload);
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
              onSubmitDocumentUpload={async (payload) => {
                await uploadDocumentMutation.mutateAsync(payload);
              }}
              onSubmitTaskUpdate={async (payload) => {
                await updateTaskMutation.mutateAsync(payload);
              }}
              onToggleExpanded={() => setTaskShelfExpanded((current) => !current)}
              onUpdateSubtask={async (payload) => {
                await updateSubtaskMutation.mutateAsync(payload);
              }}
              onUnlinkExistingDocument={async (payload) => {
                await unlinkExistingDocumentMutation.mutateAsync(payload);
              }}
              subtaskError={subtaskError}
              taskError={taskError}
              taskSearch={search ? `?${search}` : ""}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 py-8 text-sm text-muted-foreground">
              Task unavailable.
            </div>
          )
        ) : null}
      </SlideOverPanel>
    </div>
  );
}
