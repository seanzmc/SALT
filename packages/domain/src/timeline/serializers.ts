import type { TimelinePhaseRecord, TimelineWorkspaceData } from "@salt/types";

function toIsoString(value: Date | null) {
  return value ? value.toISOString() : null;
}

export function serializeTimelinePhase(phase: {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sortOrder: number;
  status: TimelinePhaseRecord["status"];
  startDate: Date | null;
  endDate: Date | null;
  notes: string | null;
  blockers: string | null;
  updatedAt: Date;
  milestones: Array<{
    id: string;
    title: string;
    notes: string | null;
    dueDate: Date | null;
    completedAt: Date | null;
    status: TimelinePhaseRecord["status"];
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "COMPLETE";
    dueDate: Date | null;
    assignedTo: {
      id: string;
      name: string;
    } | null;
  }>;
}): TimelinePhaseRecord {
  return {
    id: phase.id,
    slug: phase.slug,
    title: phase.title,
    description: phase.description,
    sortOrder: phase.sortOrder,
    status: phase.status,
    startDate: toIsoString(phase.startDate),
    endDate: toIsoString(phase.endDate),
    notes: phase.notes,
    blockers: phase.blockers,
    updatedAt: phase.updatedAt.toISOString(),
    milestones: phase.milestones.map((milestone) => ({
      id: milestone.id,
      title: milestone.title,
      notes: milestone.notes,
      dueDate: toIsoString(milestone.dueDate),
      completedAt: toIsoString(milestone.completedAt),
      status: milestone.status
    })),
    tasks: phase.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      dueDate: toIsoString(task.dueDate),
      assignedTo: task.assignedTo
    }))
  };
}

export function serializeTimelineWorkspace(input: {
  phases: Parameters<typeof serializeTimelinePhase>[0][];
}): TimelineWorkspaceData {
  return {
    phases: input.phases.map(serializeTimelinePhase)
  };
}
