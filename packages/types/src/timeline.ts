import type { TaskStatus } from "./tasks";

export const TIMELINE_PHASE_STATUS_VALUES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "BLOCKED",
  "COMPLETE"
] as const;

export type TimelinePhaseStatus = (typeof TIMELINE_PHASE_STATUS_VALUES)[number];

export type TimelineMilestoneRecord = {
  id: string;
  title: string;
  notes: string | null;
  dueDate: string | null;
  completedAt: string | null;
  status: TimelinePhaseStatus;
};

export type TimelineTaskReference = {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate: string | null;
  assignedTo: {
    id: string;
    name: string;
  } | null;
};

export type TimelinePhaseRecord = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sortOrder: number;
  status: TimelinePhaseStatus;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  blockers: string | null;
  milestones: TimelineMilestoneRecord[];
  tasks: TimelineTaskReference[];
  updatedAt: string;
};

export type TimelineWorkspaceData = {
  phases: TimelinePhaseRecord[];
};

export type TimelinePhaseUpdateInput = {
  phaseId: string;
  status: TimelinePhaseStatus;
  notes: string | null;
  blockers: string | null;
  startDate: string | null;
  endDate: string | null;
};
