import type { DocumentRecord } from "./documents.js";
import type { MessageThreadSummary } from "./messages.js";
import type { TaskSummary } from "./tasks.js";
import type { TimelinePhaseStatus } from "./timeline.js";

export type DashboardTaskPreview = {
  id: string;
  title: string;
  dueDate: string | null;
  updatedAt: string;
  blockedReason: string | null;
  section: Pick<TaskSummary["section"], "id" | "slug" | "title">;
  assignedTo: {
    id: string;
    name: string;
  } | null;
};

export type DashboardBreakdownItem = {
  label: string;
  value: number;
};

export type DashboardAttentionQueue = {
  count: number;
  items: DashboardTaskPreview[];
  breakdown?: DashboardBreakdownItem[];
};

export type DashboardProgressSnapshot = {
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
};

export type DashboardBudgetSnapshot = {
  itemCount: number;
  estimatedTotal: number;
  actualTotal: number;
  variance: number;
  mustHaveTotal: number;
  optionalTotal: number;
};

export type DashboardTimelineSnapshot = {
  totalPhases: number;
  completePhases: number;
  inProgressPhases: number;
  blockedPhases: number;
  currentPhase: {
    id: string;
    title: string;
    status: TimelinePhaseStatus;
    startDate: string | null;
    endDate: string | null;
    taskCount: number;
    milestoneCount: number;
  } | null;
};

export type DashboardSummary = {
  overallCompletion: number;
  progress: DashboardProgressSnapshot;
  queueCounts: {
    overdue: number;
    upcoming: number;
    blocked: number;
    unassigned: number;
    stale: number;
  };
  budget: DashboardBudgetSnapshot;
  timeline: DashboardTimelineSnapshot;
  attention: {
    overdue: DashboardAttentionQueue;
    upcoming: DashboardAttentionQueue;
    blocked: DashboardAttentionQueue;
    unassigned: DashboardAttentionQueue;
    stale: DashboardAttentionQueue;
  };
  recentDocuments: Pick<DocumentRecord, "id" | "title" | "category" | "createdAt" | "uploadedBy" | "linkedTask">[];
  recentMessages: Array<{
    id: string;
    content: string;
    createdAt: string;
    author: {
      id: string;
      name: string;
    };
    thread: Pick<MessageThreadSummary, "id" | "title"> & {
      task: {
        id: string;
        title: string;
      } | null;
    };
    linkedTaskId: string | null;
  }>;
};

export type DashboardActivityItem = {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  description: string;
  createdAt: string;
  actor: {
    id: string;
    name: string;
  } | null;
  task: {
    id: string;
    title: string;
  } | null;
};

export type DashboardActivityResponse = {
  activities: DashboardActivityItem[];
};

export type DashboardActivityDismissInput = {
  activityId: string;
};

export type DashboardActivityDismissResponse = {
  activityId: string;
};
