import type { UserRole } from "./auth";

export const TASK_STATUS_VALUES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "BLOCKED",
  "COMPLETE"
] as const;

export const PRIORITY_VALUES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export const OPENING_PRIORITY_VALUES = [
  "MUST_HAVE_BEFORE_OPENING",
  "CAN_PHASE_IN",
  "OPTIONAL_UPGRADE"
] as const;

export const TASK_QUEUE_VALUES = [
  "all",
  "my-work",
  "overdue",
  "upcoming",
  "blocked",
  "unassigned",
  "stale"
] as const;

export const TASK_ARCHIVE_VALUES = ["active", "archived", "all"] as const;
export const TASK_SORT_VALUES = ["dueDate", "priority", "title", "status"] as const;
export const TASK_VIEW_VALUES = ["list", "board"] as const;
export const TASK_BULK_ACTION_VALUES = [
  "assign",
  "clearAssignee",
  "status",
  "priority",
  "setDueDate",
  "archive",
  "restore"
] as const;

export type TaskStatus = (typeof TASK_STATUS_VALUES)[number];
export type TaskPriority = (typeof PRIORITY_VALUES)[number];
export type TaskOpeningPriority = (typeof OPENING_PRIORITY_VALUES)[number];
export type TaskQueue = (typeof TASK_QUEUE_VALUES)[number];
export type TaskArchiveView = (typeof TASK_ARCHIVE_VALUES)[number];
export type TaskSort = (typeof TASK_SORT_VALUES)[number];
export type TaskWorkspaceView = (typeof TASK_VIEW_VALUES)[number];
export type TaskBulkAction = (typeof TASK_BULK_ACTION_VALUES)[number];

export type TaskSummary = {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  openingPriority: TaskOpeningPriority;
  dueDate: string | null;
  archivedAt: string | null;
  blockedReason: string | null;
  updatedAt: string;
  section: {
    id: string;
    slug: string;
    title: string;
  };
  phase: {
    id: string;
    title: string;
  } | null;
  assignedTo: {
    id: string;
    name: string;
    role: UserRole;
  } | null;
  dependencyStatuses: TaskStatus[];
};

export type TaskWorkspaceComment = {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
  };
};

export type TaskWorkspaceSubtask = {
  id: string;
  title: string;
  notes: string | null;
  dueDate: string | null;
  archivedAt: string | null;
  assignedToId: string | null;
  assignedTo: {
    id: string;
    name: string;
  } | null;
  isComplete: boolean;
  sortOrder: number;
};

export type TaskWorkspaceDependency = {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate: string | null;
  assignedTo: {
    id?: string;
    name: string;
  } | null;
};

export type TaskWorkspaceDependencyCandidate = {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate: string | null;
  assignedTo: {
    id?: string;
    name: string;
  } | null;
};

export type TaskWorkspaceDocument = {
  id: string;
  title: string;
  category: string;
  originalName: string;
  storagePath: string;
  createdAt: string;
};

export type TaskWorkspaceData = {
  task: (TaskSummary & {
    sectionId: string;
    phaseId: string | null;
    assignedToId: string | null;
    comments: TaskWorkspaceComment[];
    subtasks: TaskWorkspaceSubtask[];
    dependencies: TaskWorkspaceDependency[];
    dependents: TaskWorkspaceDependency[];
    attachments: TaskWorkspaceDocument[];
    dependencyCandidates: TaskWorkspaceDependencyCandidate[];
  }) | null;
  users: Array<{
    id: string;
    name: string;
    role: UserRole;
  }>;
  sections: Array<{
    id: string;
    slug: string;
    title: string;
  }>;
  phases: Array<{
    id: string;
    title: string;
  }>;
};

export type TaskListFilters = {
  q?: string;
  status?: TaskStatus | "ALL";
  section?: string;
  priority?: TaskPriority;
  assignee?: string;
  queue?: TaskQueue;
  archived?: TaskArchiveView;
  sort?: TaskSort;
};

export type TaskWorkspaceSearchState = {
  q: string;
  status: TaskStatus | "ALL";
  section: string;
  priority: TaskPriority | "";
  assignee: string;
  queue: TaskQueue;
  archived: TaskArchiveView;
  sort: TaskSort;
  view: TaskWorkspaceView;
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

export type TaskListResponse = {
  tasks: TaskSummary[];
  sections: Array<{
    id: string;
    slug: string;
    title: string;
  }>;
  users: Array<{
    id: string;
    name: string;
    role: UserRole;
  }>;
  phases: Array<{
    id: string;
    title: string;
  }>;
  queueCounts: TaskQueueCounts;
};

export type TaskWorkspaceUpdateInput = {
  taskId: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToId: string | null;
  blockedReason: string | null;
};

export type TaskCommentCreateInput = {
  taskId: string;
  content: string;
};

export type TaskArchiveInput = {
  taskId: string;
};

export type TaskSubtaskCreateInput = {
  taskId: string;
  title: string;
  notes: string | null;
  dueDate: string | null;
  assignedToId: string | null;
};

export type TaskSubtaskUpdateInput = {
  subtaskId: string;
  title: string;
  notes: string | null;
  dueDate: string | null;
  assignedToId: string | null;
  isComplete: boolean;
  sortOrder: number;
};

export type TaskSubtaskArchiveInput = {
  subtaskId: string;
};

export type TaskSubtaskDeleteInput = {
  subtaskId: string;
};

export type TaskDependencyCreateInput = {
  taskId: string;
  dependsOnTaskId: string;
};

export type TaskDependencyDeleteInput = {
  taskId: string;
  dependsOnTaskId: string;
};

export type TaskBulkActionInput = {
  taskIds: string[];
  action: TaskBulkAction;
  assignedToId?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  blockedReason?: string | null;
};

export type TaskBulkActionResult = {
  action: TaskBulkAction;
  updatedTaskIds: string[];
  skippedTaskIds: string[];
  message: string;
};
