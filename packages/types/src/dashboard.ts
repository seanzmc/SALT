import type { DocumentRecord } from "./documents.js";
import type { MessageThreadSummary } from "./messages.js";
import type { TaskSummary } from "./tasks.js";

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

export type DashboardSummary = {
  overallCompletion: number;
  recentlyCompletedCount: number;
  queueCounts: {
    overdue: number;
    upcoming: number;
    blocked: number;
    unassigned: number;
    stale: number;
  };
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
