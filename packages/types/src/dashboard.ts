import type { DocumentRecord } from "./documents";
import type { MessageThreadSummary } from "./messages";

export type DashboardSummary = {
  overallCompletion: number;
  queueCounts: {
    overdue: number;
    upcoming: number;
    blocked: number;
    unassigned: number;
    stale: number;
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
