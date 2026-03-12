import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  SessionPayload,
  TaskCommentCreateInput,
  TaskListResponse,
  TaskSummary,
  TaskWorkspaceComment,
  TaskWorkspaceData,
  TaskWorkspaceUpdateInput
} from "@salt/types";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { ApiClientError } from "../../../lib/api-client";
import { useAuthSessionQuery } from "../../auth/hooks/use-auth-session-query";
import { createTaskComment, getTaskList, getTaskWorkspace, updateTaskWorkspace } from "../api/tasks-client";
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

function mergeTaskSummary(
  task: TaskSummary,
  patch: {
    status: TaskSummary["status"];
    priority: TaskSummary["priority"];
    assignedTo: TaskSummary["assignedTo"];
    blockedReason: string | null;
  }
) {
  return {
    ...task,
    status: patch.status,
    priority: patch.priority,
    assignedTo: patch.assignedTo,
    blockedReason: patch.blockedReason,
    updatedAt: new Date().toISOString()
  };
}

function updateTaskInListCache(
  current: TaskListResponse | undefined,
  taskId: string,
  patch: {
    status: TaskSummary["status"];
    priority: TaskSummary["priority"];
    assignedTo: TaskSummary["assignedTo"];
    blockedReason: string | null;
  }
) {
  if (!current) {
    return current;
  }

  return {
    ...current,
    tasks: current.tasks.map((task) =>
      task.id === taskId ? mergeTaskSummary(task, patch) : task
    )
  };
}

function updateTaskInDetailCache(
  current: TaskWorkspaceData | undefined,
  patch: {
    status: TaskSummary["status"];
    priority: TaskSummary["priority"];
    assignedTo: TaskSummary["assignedTo"];
    assignedToId: string | null;
    blockedReason: string | null;
  }
) {
  if (!current?.task) {
    return current;
  }

  return {
    ...current,
    task: {
      ...current.task,
      status: patch.status,
      priority: patch.priority,
      assignedTo: patch.assignedTo,
      assignedToId: patch.assignedToId,
      blockedReason: patch.blockedReason,
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
      comments: [comment, ...current.task.comments]
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
      )
    }
  };
}

export function TasksWorkspacePage() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [taskError, setTaskError] = useState<string>();
  const [commentError, setCommentError] = useState<string>();
  const sessionQuery = useAuthSessionQuery();

  const selectedTaskId = params.taskId;
  const searchState = getTaskWorkspaceSearchState(searchParams);
  const deferredSearch = useDeferredValue(searchState.q);
  const activeFilters = useMemo(
    () => toTaskListFilters(searchState, { q: deferredSearch }),
    [deferredSearch, searchState]
  );

  const taskListQuery = useQuery({
    queryKey: taskQueryKeys.list(activeFilters),
    queryFn: () => getTaskList(activeFilters),
    placeholderData: (previous) => previous
  });

  const taskWorkspaceQuery = useQuery({
    queryKey: selectedTaskId ? taskQueryKeys.detail(selectedTaskId) : ["tasks", "detail", "none"],
    queryFn: () => getTaskWorkspace(selectedTaskId!),
    enabled: Boolean(selectedTaskId)
  });

  const currentUser = sessionQuery.data?.user;

  const updateTaskMutation = useMutation({
    mutationFn: updateTaskWorkspace,
    onMutate: async (payload) => {
      setTaskError(undefined);
      const allUsers = taskWorkspaceQuery.data?.users ?? taskListQuery.data?.users ?? [];
      const assignedTo =
        payload.assignedToId === null
          ? null
          : allUsers.find((user) => user.id === payload.assignedToId) ?? null;

      await queryClient.cancelQueries({ queryKey: taskQueryKeys.lists() });
      if (selectedTaskId) {
        await queryClient.cancelQueries({ queryKey: taskQueryKeys.detail(selectedTaskId) });
      }

      const previousLists = queryClient.getQueriesData<TaskListResponse>({
        queryKey: taskQueryKeys.lists()
      });
      const previousDetail = selectedTaskId
        ? queryClient.getQueryData<TaskWorkspaceData>(taskQueryKeys.detail(selectedTaskId))
        : undefined;

      queryClient.setQueriesData<TaskListResponse>(
        { queryKey: taskQueryKeys.lists() },
        (current) =>
          updateTaskInListCache(current, payload.taskId, {
            status: payload.status,
            priority: payload.priority,
            assignedTo,
            blockedReason:
              payload.status === "BLOCKED" ? payload.blockedReason ?? null : null
          })
      );

      if (selectedTaskId) {
        queryClient.setQueryData<TaskWorkspaceData>(
          taskQueryKeys.detail(selectedTaskId),
          (current) =>
            updateTaskInDetailCache(current, {
              status: payload.status,
              priority: payload.priority,
              assignedTo,
              assignedToId: payload.assignedToId,
              blockedReason:
                payload.status === "BLOCKED" ? payload.blockedReason ?? null : null
            })
        );
      }

      return {
        previousLists,
        previousDetail
      };
    },
    onError: (error, _payload, context) => {
      setTaskError(
        error instanceof ApiClientError ? error.message : "Unable to save task changes."
      );

      context?.previousLists.forEach(([key, value]) => {
        queryClient.setQueryData(key, value);
      });

      if (selectedTaskId && context?.previousDetail) {
        queryClient.setQueryData(taskQueryKeys.detail(selectedTaskId), context.previousDetail);
      }
    },
    onSuccess: (data, payload) => {
      setTaskError(undefined);
      queryClient.setQueryData(taskQueryKeys.detail(payload.taskId), data);
      queryClient.setQueriesData<TaskListResponse>(
        { queryKey: taskQueryKeys.lists() },
        (current) =>
          current && data.task
            ? {
                ...current,
                tasks: current.tasks.map((task) =>
                  task.id === payload.taskId ? data.task! : task
                )
              }
            : current
      );
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
      const optimisticId = `optimistic-${Date.now()}`;

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

      queryClient.setQueriesData<TaskListResponse>(
        { queryKey: taskQueryKeys.lists() },
        (current) =>
          current
            ? {
                ...current,
                tasks: current.tasks.map((task) =>
                  task.id === payload.taskId
                    ? { ...task, updatedAt: new Date().toISOString() }
                    : task
                )
              }
            : current
      );
    }
  });

  const search = buildTaskSearchParams(searchState).toString();
  const visibleTasks = taskListQuery.data?.tasks ?? [];
  const selectedTaskIndex = visibleTasks.findIndex((task) => task.id === selectedTaskId);
  const previousTaskId =
    selectedTaskIndex > 0 ? visibleTasks[selectedTaskIndex - 1]?.id : undefined;
  const nextTaskId =
    selectedTaskIndex >= 0 && selectedTaskIndex < visibleTasks.length - 1
      ? visibleTasks[selectedTaskIndex + 1]?.id
      : undefined;

  function setSearchStatePatch(
    patch: Partial<Parameters<typeof getTaskWorkspaceSearchState>[0] extends never ? never : ReturnType<typeof getTaskWorkspaceSearchState>>
  ) {
    setSearchParams(updateTaskSearchState(searchParams, patch), {
      replace: patch.q !== undefined
    });
  }

  function handleReset() {
    setSearchParams(buildTaskSearchParams({
      q: "",
      status: "ALL",
      section: "",
      priority: "",
      assignee: "",
      queue: "all",
      archived: "active",
      sort: "dueDate"
    }));
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

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-border bg-white/85 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.4)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Tasks Workspace v2
        </p>
        <h2 className="mt-2 text-3xl font-semibold">Fast, stable task flow</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          This is the first real product slice on the new stack: query-driven task queues,
          route-persistent selection, and a side shelf that keeps edits in context.
        </p>
      </section>

      <WorkspaceFilters
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
      />

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

          <TaskListPanel
            activeTaskId={selectedTaskId}
            onPrefetchTask={prefetchTask}
            search={search ? `?${search}` : ""}
            tasks={visibleTasks}
          />
        </div>

        <div className="min-w-0">
          {selectedTaskId ? (
            taskWorkspaceQuery.isLoading ? (
              <section className="rounded-[1.75rem] border border-border bg-card/90 p-5 text-sm text-muted-foreground shadow-sm xl:sticky xl:top-6">
                Loading task workspace…
              </section>
            ) : taskWorkspaceQuery.data ? (
              <TaskShelf
                commentError={commentError}
                currentUser={currentUser as SessionPayload["user"]}
                data={taskWorkspaceQuery.data}
                isPostingComment={createCommentMutation.isPending}
                isSavingTask={updateTaskMutation.isPending}
                onClose={() =>
                  navigate({
                    pathname: "/tasks",
                    search
                  })
                }
                onNext={nextTaskId ? () => navigateToTask(nextTaskId) : undefined}
                onPrevious={previousTaskId ? () => navigateToTask(previousTaskId) : undefined}
                onSubmitComment={async (payload) => {
                  await createCommentMutation.mutateAsync(payload);
                }}
                onSubmitTaskUpdate={async (payload) => {
                  await updateTaskMutation.mutateAsync(payload);
                }}
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
                  The left queue remains stable while task details, updates, and comments stay in
                  the right-side shelf.
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
