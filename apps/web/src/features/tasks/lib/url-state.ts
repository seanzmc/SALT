import type {
  TaskListFilters,
  TaskPriority,
  TaskStatus,
  TaskWorkspaceSearchState
} from "@salt/types";

const DEFAULT_STATE: TaskWorkspaceSearchState = {
  q: "",
  status: "ALL",
  section: "",
  priority: "",
  assignee: "",
  queue: "all",
  archived: "active",
  sort: "dueDate",
  view: "list"
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
    queue: (searchParams.get("queue") as TaskWorkspaceSearchState["queue"] | null) ?? DEFAULT_STATE.queue,
    archived:
      (searchParams.get("archived") as TaskWorkspaceSearchState["archived"] | null) ?? DEFAULT_STATE.archived,
    sort: (searchParams.get("sort") as TaskWorkspaceSearchState["sort"] | null) ?? DEFAULT_STATE.sort,
    view: (searchParams.get("view") as TaskWorkspaceSearchState["view"] | null) ?? DEFAULT_STATE.view
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

  if (state.view !== DEFAULT_STATE.view) {
    searchParams.set("view", state.view);
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
