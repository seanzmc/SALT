import type {
  TaskGroupBy,
  TaskListFilters,
  TaskPriority,
  TaskSortDirection,
  TaskStatus,
  TaskWorkspaceSearchState
} from "@salt/types";

export const DEFAULT_TASK_WORKSPACE_STATE: TaskWorkspaceSearchState = {
  q: "",
  status: [],
  section: [],
  priority: [],
  assignee: [],
  queue: "all",
  archived: "active",
  sort: "dueDate",
  order: "asc",
  view: "list",
  group: "none"
};

function getMultiValue(searchParams: URLSearchParams, key: string) {
  const values = searchParams.getAll(key);

  if (values.length === 0) {
    const single = searchParams.get(key);
    if (!single || single === "ALL") {
      return [];
    }

    return Array.from(
      new Set(
        single
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      )
    );
  }

  return Array.from(new Set(values.filter(Boolean)));
}

export function getTaskWorkspaceSearchState(
  searchParams: URLSearchParams
): TaskWorkspaceSearchState {
  return {
    q: searchParams.get("q") ?? DEFAULT_TASK_WORKSPACE_STATE.q,
    status: getMultiValue(searchParams, "status") as TaskStatus[],
    section: getMultiValue(searchParams, "section"),
    priority: getMultiValue(searchParams, "priority") as TaskPriority[],
    assignee: getMultiValue(searchParams, "assignee"),
    queue:
      (searchParams.get("queue") as TaskWorkspaceSearchState["queue"] | null) ??
      DEFAULT_TASK_WORKSPACE_STATE.queue,
    archived:
      (searchParams.get("archived") as TaskWorkspaceSearchState["archived"] | null) ??
      DEFAULT_TASK_WORKSPACE_STATE.archived,
    sort:
      (searchParams.get("sort") as TaskWorkspaceSearchState["sort"] | null) ??
      DEFAULT_TASK_WORKSPACE_STATE.sort,
    order:
      (searchParams.get("order") as TaskSortDirection | null) ??
      DEFAULT_TASK_WORKSPACE_STATE.order,
    view:
      (searchParams.get("view") as TaskWorkspaceSearchState["view"] | null) ??
      DEFAULT_TASK_WORKSPACE_STATE.view,
    group:
      (searchParams.get("group") as TaskGroupBy | null) ?? DEFAULT_TASK_WORKSPACE_STATE.group
  };
}

export function toTaskListFilters(
  state: TaskWorkspaceSearchState,
  overrides: Partial<TaskWorkspaceSearchState> = {}
): TaskListFilters {
  const next = { ...state, ...overrides };

  return {
    q: next.q || undefined,
    status: next.status.length > 0 ? next.status : undefined,
    section: next.section.length > 0 ? next.section : undefined,
    priority: next.priority.length > 0 ? next.priority : undefined,
    assignee: next.assignee.length > 0 ? next.assignee : undefined,
    queue: next.queue,
    archived: next.archived,
    sort: next.sort,
    order: next.order
  };
}

export function buildTaskSearchParams(
  state: TaskWorkspaceSearchState
): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (state.q) {
    searchParams.set("q", state.q);
  }

  state.status.forEach((value) => searchParams.append("status", value));
  state.section.forEach((value) => searchParams.append("section", value));
  state.priority.forEach((value) => searchParams.append("priority", value));
  state.assignee.forEach((value) => searchParams.append("assignee", value));

  if (state.queue !== DEFAULT_TASK_WORKSPACE_STATE.queue) {
    searchParams.set("queue", state.queue);
  }

  if (state.archived !== DEFAULT_TASK_WORKSPACE_STATE.archived) {
    searchParams.set("archived", state.archived);
  }

  if (state.sort !== DEFAULT_TASK_WORKSPACE_STATE.sort) {
    searchParams.set("sort", state.sort);
  }

  if (state.order !== DEFAULT_TASK_WORKSPACE_STATE.order) {
    searchParams.set("order", state.order);
  }

  if (state.view !== DEFAULT_TASK_WORKSPACE_STATE.view) {
    searchParams.set("view", state.view);
  }

  if (state.group !== DEFAULT_TASK_WORKSPACE_STATE.group) {
    searchParams.set("group", state.group);
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
