import { TaskStatus } from "@prisma/client";

export type ChecklistQueue =
  | "all"
  | "my-work"
  | "overdue"
  | "upcoming"
  | "blocked"
  | "unassigned"
  | "stale";

export type ChecklistArchived = "active" | "archived" | "all";
export type ChecklistGroup = "none" | "section";
export type ChecklistSort = "dueDate" | "priority" | "title" | "status";
export type ChecklistView = "list" | "board";
export type ChecklistCleanupMode =
  | "overdue"
  | "blocked"
  | "unassigned"
  | "stale"
  | "upcoming";

export type ChecklistBulkAction =
  | "assign"
  | "clearAssignee"
  | "status"
  | "priority"
  | "setDueDate"
  | "shiftDueDate"
  | "markComplete"
  | "archive"
  | "restore";

export type ChecklistWorkspaceState = {
  q: string;
  status: string;
  section: string;
  priority: string;
  assignee: string;
  queue: ChecklistQueue;
  archived: ChecklistArchived;
  group: ChecklistGroup;
  sort: ChecklistSort;
  view: ChecklistView;
  cleanup: string;
  bulk: string;
};

export type ChecklistTaskRecord = {
  id: string;
  title: string;
  description?: string | null;
  notes?: string | null;
  archivedAt?: Date | string | null;
  updatedAt?: Date | string;
  assignedToId?: string | null;
  section: { title: string; slug?: string | null };
  assignedTo: { name: string } | null;
  priority: string;
  status: string;
  dueDate: Date | string | null;
  taskDependencies: Array<{ dependsOnTask: { status: string } }>;
};

export type TaskQueueCounts = {
  all: number;
  myWork: number;
  overdue: number;
  upcoming: number;
  blocked: number;
  unassigned: number;
  stale: number;
};

export type SerializedTaskWorkspaceData = {
  task: null | {
    id: string;
    sectionId: string;
    phaseId: string | null;
    title: string;
    description: string | null;
    notes: string | null;
    status: string;
    priority: string;
    openingPriority: string;
    dueDate: string | null;
    archivedAt: string | null;
    blockedReason: string | null;
    assignedToId: string | null;
    section: { title: string };
    phase: { title: string } | null;
    assignedTo: { name: string } | null;
    subtasks: Array<{
      id: string;
      title: string;
      notes: string | null;
      dueDate: string | null;
      archivedAt: string | null;
      assignedToId: string | null;
      assignedTo: { id: string; name: string } | null;
      isComplete: boolean;
      sortOrder: number;
    }>;
    taskTags: Array<{ tag: { name: string } }>;
    taskDependencies: Array<{
      dependsOnTask: {
        id: string;
        title: string;
        status: string;
        dueDate: string | null;
        assignedTo: { name: string } | null;
      };
    }>;
    dependsOn: Array<{
      task: {
        id: string;
        title: string;
        status: string;
        dueDate: string | null;
        assignedTo: { name: string } | null;
      };
    }>;
    comments: Array<{
      id: string;
      content: string;
      createdAt: string;
      author: { name: string };
    }>;
    attachments: Array<{
      id: string;
      document: {
        id: string;
        title: string;
        category: string;
        notes: string | null;
        originalName: string;
        storagePath: string;
        uploadedBy: { name: string };
        createdAt: string;
      };
    }>;
  };
  users: Array<{ id: string; name: string; role: string }>;
  sections: Array<{ id: string; title: string }>;
  phases: Array<{ id: string; title: string }>;
  dependencyCandidates: Array<{
    id: string;
    title: string;
    status: string;
    dueDate: string | null;
    assignedTo: { name: string } | null;
  }>;
  availableDocuments: Array<{
    id: string;
    title: string;
    category: string;
    createdAt: string;
    linkedTask: { title: string } | null;
  }>;
};

const cleanupModes: ChecklistCleanupMode[] = [
  "overdue",
  "blocked",
  "unassigned",
  "stale",
  "upcoming"
];

export function getInitialChecklistState(
  searchParams: Record<string, string | string[] | undefined>
): ChecklistWorkspaceState {
  return {
    q: typeof searchParams.q === "string" ? searchParams.q : "",
    status: typeof searchParams.status === "string" ? searchParams.status : "ALL",
    section: typeof searchParams.section === "string" ? searchParams.section : "",
    priority: typeof searchParams.priority === "string" ? searchParams.priority : "",
    assignee: typeof searchParams.assignee === "string" ? searchParams.assignee : "",
    queue: isChecklistQueue(searchParams.queue) ? searchParams.queue : "all",
    archived: isChecklistArchived(searchParams.archived) ? searchParams.archived : "active",
    group: isChecklistGroup(searchParams.group) ? searchParams.group : "none",
    sort: isChecklistSort(searchParams.sort) ? searchParams.sort : "dueDate",
    view: isChecklistView(searchParams.view) ? searchParams.view : "list",
    cleanup: typeof searchParams.cleanup === "string" ? searchParams.cleanup : "",
    bulk: typeof searchParams.bulk === "string" ? searchParams.bulk : ""
  };
}

export function getChecklistCleanupMode(
  state: ChecklistWorkspaceState
): ChecklistCleanupMode | null {
  if (state.cleanup !== "1") {
    return null;
  }

  return cleanupModes.includes(state.queue as ChecklistCleanupMode)
    ? (state.queue as ChecklistCleanupMode)
    : null;
}

export function getCleanupCopy(mode: ChecklistCleanupMode | null) {
  if (mode === "overdue") {
    return {
      title: "Overdue cleanup",
      description:
        "You came from the dashboard overdue card. This view is already in list mode so you can select visible work and use bulk due-date or status updates."
    };
  }

  if (mode === "blocked") {
    return {
      title: "Blocked cleanup",
      description:
        "You came from the blocked attention card. Review the visible tasks, then use bulk status updates once blockers are resolved."
    };
  }

  if (mode === "unassigned") {
    return {
      title: "Assignment cleanup",
      description:
        "You came from the unassigned attention card. Select visible tasks and use bulk assign to clear ownership gaps quickly."
    };
  }

  if (mode === "stale") {
    return {
      title: "Needs update cleanup",
      description:
        "You came from the needs update attention card. Review stale work, then bulk-update status or ownership as needed."
    };
  }

  if (mode === "upcoming") {
    return {
      title: "Upcoming work cleanup",
      description:
        "You came from the due-this-week attention card. Use this list view to rebalance ownership and dates before deadlines slip."
    };
  }

  return null;
}

export function buildChecklistSearchParams(
  state: ChecklistWorkspaceState,
  overrides: Partial<ChecklistWorkspaceState & { taskId: string | null | undefined }> = {}
) {
  const nextState = {
    ...state,
    ...overrides
  };
  const search = new URLSearchParams();

  if (nextState.q) {
    search.set("q", nextState.q);
  }

  if (nextState.status && nextState.status !== "ALL") {
    search.set("status", nextState.status);
  }

  if (nextState.section) {
    search.set("section", nextState.section);
  }

  if (nextState.priority) {
    search.set("priority", nextState.priority);
  }

  if (nextState.assignee) {
    search.set("assignee", nextState.assignee);
  }

  if (nextState.queue !== "all") {
    search.set("queue", nextState.queue);
  }

  if (nextState.archived !== "active") {
    search.set("archived", nextState.archived);
  }

  if (nextState.group !== "none") {
    search.set("group", nextState.group);
  }

  if (nextState.sort !== "dueDate") {
    search.set("sort", nextState.sort);
  }

  if (nextState.view !== "list") {
    search.set("view", nextState.view);
  }

  if (nextState.cleanup) {
    search.set("cleanup", nextState.cleanup);
  }

  if (nextState.bulk) {
    search.set("bulk", nextState.bulk);
  }

  if (typeof nextState.taskId === "string" && nextState.taskId) {
    search.set("taskId", nextState.taskId);
  }

  return search;
}

export function filterChecklistTasks(
  tasks: ChecklistTaskRecord[],
  state: ChecklistWorkspaceState,
  currentUserId: string
) {
  const now = new Date();
  const upcomingLimit = new Date(now);
  upcomingLimit.setDate(upcomingLimit.getDate() + 7);
  const staleLimit = new Date(now);
  staleLimit.setDate(staleLimit.getDate() - 7);
  const query = state.q.trim().toLowerCase();

  return tasks
    .filter((task) => {
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      const updatedAt = task.updatedAt ? new Date(task.updatedAt) : null;
      const isArchived = Boolean(task.archivedAt);
      const assignedToId = task.assignedToId ?? null;

      if (query) {
        const haystack = `${task.title} ${task.description ?? ""} ${task.notes ?? ""}`.toLowerCase();

        if (!haystack.includes(query)) {
          return false;
        }
      }

      if (state.status !== "ALL" && task.status !== state.status) {
        return false;
      }

      if (state.section && task.section.slug !== state.section) {
        return false;
      }

      if (state.priority && task.priority !== state.priority) {
        return false;
      }

      if (state.archived === "active" && isArchived) {
        return false;
      }

      if (state.archived === "archived" && !isArchived) {
        return false;
      }

      if (state.assignee === "me" && assignedToId !== currentUserId) {
        return false;
      }

      if (state.assignee === "unassigned" && assignedToId !== null) {
        return false;
      }

      if (
        state.assignee &&
        state.assignee !== "me" &&
        state.assignee !== "unassigned" &&
        assignedToId !== state.assignee
      ) {
        return false;
      }

      if (state.queue === "my-work" && assignedToId !== currentUserId) {
        return false;
      }

      if (state.queue === "overdue") {
        if (!dueDate || dueDate >= now || task.status === TaskStatus.COMPLETE) {
          return false;
        }
      }

      if (state.queue === "upcoming") {
        if (
          !dueDate ||
          dueDate < now ||
          dueDate > upcomingLimit ||
          task.status === TaskStatus.COMPLETE
        ) {
          return false;
        }
      }

      if (state.queue === "blocked" && task.status !== TaskStatus.BLOCKED) {
        return false;
      }

      if (state.queue === "unassigned") {
        if (assignedToId !== null || task.status === TaskStatus.COMPLETE) {
          return false;
        }
      }

      if (state.queue === "stale") {
        if (!updatedAt || updatedAt >= staleLimit || task.status === TaskStatus.COMPLETE) {
          return false;
        }
      }

      return true;
    })
    .sort((left, right) => sortChecklistTasks(left, right, state.sort));
}

export function getChecklistQueueCounts(
  tasks: ChecklistTaskRecord[],
  currentUserId: string
): TaskQueueCounts {
  const now = new Date();
  const upcomingLimit = new Date(now);
  upcomingLimit.setDate(upcomingLimit.getDate() + 7);
  const staleLimit = new Date(now);
  staleLimit.setDate(staleLimit.getDate() - 7);

  const activeTasks = tasks.filter((task) => !task.archivedAt);

  return {
    all: activeTasks.length,
    myWork: activeTasks.filter(
      (task) => task.assignedToId === currentUserId && task.status !== TaskStatus.COMPLETE
    ).length,
    overdue: activeTasks.filter((task) => {
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      return Boolean(dueDate && dueDate < now && task.status !== TaskStatus.COMPLETE);
    }).length,
    upcoming: activeTasks.filter((task) => {
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      return Boolean(
        dueDate &&
          dueDate >= now &&
          dueDate <= upcomingLimit &&
          task.status !== TaskStatus.COMPLETE
      );
    }).length,
    blocked: activeTasks.filter((task) => task.status === TaskStatus.BLOCKED).length,
    unassigned: activeTasks.filter(
      (task) => !task.assignedToId && task.status !== TaskStatus.COMPLETE
    ).length,
    stale: activeTasks.filter((task) => {
      const updatedAt = task.updatedAt ? new Date(task.updatedAt) : null;
      return Boolean(updatedAt && updatedAt < staleLimit && task.status !== TaskStatus.COMPLETE);
    }).length
  };
}

export function serializeTaskWorkspaceData(data: {
  task: {
    id: string;
    sectionId: string;
    phaseId: string | null;
    title: string;
    description: string | null;
    notes: string | null;
    status: string;
    priority: string;
    openingPriority: string;
    dueDate: Date | null;
    archivedAt: Date | null;
    blockedReason: string | null;
    assignedToId: string | null;
    section: { title: string };
    phase: { title: string } | null;
    assignedTo: { name: string } | null;
    subtasks: Array<{
      id: string;
      title: string;
      notes: string | null;
      dueDate: Date | null;
      archivedAt: Date | null;
      assignedToId: string | null;
      assignedTo: { id: string; name: string } | null;
      isComplete: boolean;
      sortOrder: number;
    }>;
    taskTags: Array<{ tag: { name: string } }>;
    taskDependencies: Array<{
      dependsOnTask: {
        id: string;
        title: string;
        status: string;
        dueDate: Date | null;
        assignedTo: { name: string } | null;
      };
    }>;
    dependsOn: Array<{
      task: {
        id: string;
        title: string;
        status: string;
        dueDate: Date | null;
        assignedTo: { name: string } | null;
      };
    }>;
    comments: Array<{
      id: string;
      content: string;
      createdAt: Date;
      author: { name: string };
    }>;
    attachments: Array<{
      id: string;
      document: {
        id: string;
        title: string;
        category: string;
        notes: string | null;
        originalName: string;
        storagePath: string;
        uploadedBy: { name: string };
        createdAt: Date;
      };
    }>;
  } | null;
  users: Array<{ id: string; name: string; role: string }>;
  sections: Array<{ id: string; title: string }>;
  phases: Array<{ id: string; title: string }>;
  dependencyCandidates: Array<{
    id: string;
    title: string;
    status: string;
    dueDate: Date | null;
    assignedTo: { name: string } | null;
  }>;
  availableDocuments: Array<{
    id: string;
    title: string;
    category: string;
    createdAt: Date;
    linkedTask: { title: string } | null;
  }>;
}): SerializedTaskWorkspaceData {
  return {
    task: data.task
      ? {
          ...data.task,
          dueDate: data.task.dueDate?.toISOString() ?? null,
          archivedAt: data.task.archivedAt?.toISOString() ?? null,
          subtasks: data.task.subtasks.map((subtask) => ({
            ...subtask,
            dueDate: subtask.dueDate?.toISOString() ?? null,
            archivedAt: subtask.archivedAt?.toISOString() ?? null
          })),
          taskDependencies: data.task.taskDependencies.map((dependency) => ({
            dependsOnTask: {
              ...dependency.dependsOnTask,
              dueDate: dependency.dependsOnTask.dueDate?.toISOString() ?? null
            }
          })),
          dependsOn: data.task.dependsOn.map((dependency) => ({
            task: {
              ...dependency.task,
              dueDate: dependency.task.dueDate?.toISOString() ?? null
            }
          })),
          comments: data.task.comments.map((comment) => ({
            ...comment,
            createdAt: comment.createdAt.toISOString()
          })),
          attachments: data.task.attachments.map((attachment) => ({
            ...attachment,
            document: {
              ...attachment.document,
              createdAt: attachment.document.createdAt.toISOString()
            }
          }))
        }
      : null,
    users: data.users,
    sections: data.sections,
    phases: data.phases,
    dependencyCandidates: data.dependencyCandidates.map((candidate) => ({
      ...candidate,
      dueDate: candidate.dueDate?.toISOString() ?? null
    })),
    availableDocuments: data.availableDocuments.map((document) => ({
      ...document,
      createdAt: document.createdAt.toISOString()
    }))
  };
}

function sortChecklistTasks(
  left: ChecklistTaskRecord,
  right: ChecklistTaskRecord,
  sort: ChecklistSort
) {
  if (sort === "priority") {
    return comparePriority(right.priority) - comparePriority(left.priority);
  }

  if (sort === "title") {
    return left.title.localeCompare(right.title);
  }

  if (sort === "status") {
    return left.status.localeCompare(right.status);
  }

  const leftTime = left.dueDate ? new Date(left.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
  const rightTime = right.dueDate ? new Date(right.dueDate).getTime() : Number.MAX_SAFE_INTEGER;

  if (leftTime === rightTime) {
    return left.title.localeCompare(right.title);
  }

  return leftTime - rightTime;
}

function comparePriority(priority: string) {
  if (priority === "CRITICAL") {
    return 4;
  }

  if (priority === "HIGH") {
    return 3;
  }

  if (priority === "MEDIUM") {
    return 2;
  }

  return 1;
}

function isChecklistQueue(value: unknown): value is ChecklistQueue {
  return (
    value === "all" ||
    value === "my-work" ||
    value === "overdue" ||
    value === "upcoming" ||
    value === "blocked" ||
    value === "unassigned" ||
    value === "stale"
  );
}

function isChecklistArchived(value: unknown): value is ChecklistArchived {
  return value === "active" || value === "archived" || value === "all";
}

function isChecklistGroup(value: unknown): value is ChecklistGroup {
  return value === "none" || value === "section";
}

function isChecklistSort(value: unknown): value is ChecklistSort {
  return value === "dueDate" || value === "priority" || value === "title" || value === "status";
}

function isChecklistView(value: unknown): value is ChecklistView {
  return value === "list" || value === "board";
}
