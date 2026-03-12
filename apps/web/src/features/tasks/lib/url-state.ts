import type {
  TaskArchiveView,
  TaskListFilters,
  TaskPriority,
  TaskQueue,
  TaskSort,
  TaskStatus
} from "@salt/types";

type TaskWorkspaceSearchState = {
  q: string;
  status: TaskStatus | "ALL";
  section: string;
  priority: TaskPriority | "";
  assignee: string;
  queue: TaskQueue;
  archived: TaskArchiveView;
  sort: TaskSort;
};

const DEFAULT_STATE: TaskWorkspaceSearchState = {
  q: "",
  status: "ALL",
  section: "",
  priority: "",
  assignee: "",
  queue: "all",
  archived: "active",
  sort: "dueDate"
};

export function getTaskWorkspaceSearchState(
  searchParams: URLSearchParams
): TaskWorkspaceSearchState {
  return {
    q: searchParams.get("q") ?? DEFAULT_STATE.q,
    status: (searchParams.get("status") as TaskStatus | "ALL" | null) ?? DEFAULT_STATE.status,
    section: searchParams.get("section") ?? DEFAULT_STATE.section,
    priority: (searchParams.get("priority") as TaskPriority | null) ?? DEFAULT_STATE.priority,
    assignee: searchParams.get("assignee") ?? DEFAULT_STATE.assignee,
    queue: (searchParams.get("queue") as TaskQueue | null) ?? DEFAULT_STATE.queue,
    archived:
      (searchParams.get("archived") as TaskArchiveView | null) ?? DEFAULT_STATE.archived,
    sort: (searchParams.get("sort") as TaskSort | null) ?? DEFAULT_STATE.sort
  };
}

export function toTaskListFilters(
  state: TaskWorkspaceSearchState,
  overrides: Partial<TaskWorkspaceSearchState> = {}
): TaskListFilters {
  const next = { ...state, ...overrides };

  return {
    q: next.q || undefined,
    status: next.status,
    section: next.section || undefined,
    priority: next.priority || undefined,
    assignee: next.assignee || undefined,
    queue: next.queue,
    archived: next.archived,
    sort: next.sort
  };
}

export function buildTaskSearchParams(
  state: TaskWorkspaceSearchState
): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (state.q) {
    searchParams.set("q", state.q);
  }

  if (state.status !== DEFAULT_STATE.status) {
    searchParams.set("status", state.status);
  }

  if (state.section) {
    searchParams.set("section", state.section);
  }

  if (state.priority) {
    searchParams.set("priority", state.priority);
  }

  if (state.assignee) {
    searchParams.set("assignee", state.assignee);
  }

  if (state.queue !== DEFAULT_STATE.queue) {
    searchParams.set("queue", state.queue);
  }

  if (state.archived !== DEFAULT_STATE.archived) {
    searchParams.set("archived", state.archived);
  }

  if (state.sort !== DEFAULT_STATE.sort) {
    searchParams.set("sort", state.sort);
  }

  return searchParams;
}

export function updateTaskSearchState(
  current: URLSearchParams,
  patch: Partial<TaskWorkspaceSearchState>
) {
  const currentState = getTaskWorkspaceSearchState(current);
  return buildTaskSearchParams({
    ...currentState,
    ...patch
  });
}
