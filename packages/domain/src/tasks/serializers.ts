import type {
  TaskListResponse,
  TaskSummary,
  TaskWorkspaceData,
  TaskWorkspaceDependency
} from "@salt/types";

function toIsoString(value: Date | null) {
  return value ? value.toISOString() : null;
}

function serializeDependency(input: {
  id: string;
  title: string;
  status: TaskSummary["status"];
  dueDate: Date | null;
  assignedTo: { id?: string; name: string } | null;
}): TaskWorkspaceDependency {
  return {
    id: input.id,
    title: input.title,
    status: input.status,
    dueDate: toIsoString(input.dueDate),
    assignedTo: input.assignedTo
  };
}

export function serializeTaskSummary(task: {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  status: TaskSummary["status"];
  priority: TaskSummary["priority"];
  openingPriority: TaskSummary["openingPriority"];
  dueDate: Date | null;
  archivedAt: Date | null;
  blockedReason: string | null;
  updatedAt: Date;
  section: { id: string; slug: string; title: string };
  phase: { id: string; title: string } | null;
  assignedTo: TaskSummary["assignedTo"];
  taskDependencies: Array<{ dependsOnTask: { status: TaskSummary["status"] } }>;
}): TaskSummary {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    notes: task.notes,
    status: task.status,
    priority: task.priority,
    openingPriority: task.openingPriority,
    dueDate: toIsoString(task.dueDate),
    archivedAt: toIsoString(task.archivedAt),
    blockedReason: task.blockedReason,
    updatedAt: task.updatedAt.toISOString(),
    section: task.section,
    phase: task.phase,
    assignedTo: task.assignedTo,
    dependencyStatuses: task.taskDependencies.map((item) => item.dependsOnTask.status)
  };
}

export function serializeTaskListResponse(input: {
  tasks: Parameters<typeof serializeTaskSummary>[0][];
  sections: TaskListResponse["sections"];
  users: TaskListResponse["users"];
  phases: TaskListResponse["phases"];
  queueCounts: TaskListResponse["queueCounts"];
}): TaskListResponse {
  return {
    tasks: input.tasks.map(serializeTaskSummary),
    sections: input.sections,
    users: input.users,
    phases: input.phases,
    queueCounts: input.queueCounts
  };
}

export function serializeTaskWorkspace(input: {
  task: any;
  users: TaskWorkspaceData["users"];
  sections: TaskWorkspaceData["sections"];
  phases: TaskWorkspaceData["phases"];
  dependencyCandidates: Array<{
    id: string;
    title: string;
    status: TaskSummary["status"];
    dueDate: Date | null;
    assignedTo: { id?: string; name: string } | null;
  }>;
}): TaskWorkspaceData {
  return {
    task: input.task
      ? {
          ...serializeTaskSummary(input.task),
          sectionId: input.task.sectionId,
          phaseId: input.task.phaseId,
          assignedToId: input.task.assignedToId,
          comments: input.task.comments.map((comment: any) => ({
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt.toISOString(),
            author: {
              id: comment.author.id,
              name: comment.author.name
            }
          })),
          subtasks: input.task.subtasks.map((subtask: any) => ({
            id: subtask.id,
            title: subtask.title,
            notes: subtask.notes,
            dueDate: toIsoString(subtask.dueDate),
            archivedAt: toIsoString(subtask.archivedAt),
            assignedToId: subtask.assignedToId,
            assignedTo: subtask.assignedTo,
            isComplete: subtask.isComplete,
            sortOrder: subtask.sortOrder
          })),
          dependencies: input.task.taskDependencies.map((item: any) =>
            serializeDependency({
              id: item.dependsOnTask.id,
              title: item.dependsOnTask.title,
              status: item.dependsOnTask.status,
              dueDate: item.dependsOnTask.dueDate,
              assignedTo: item.dependsOnTask.assignedTo
            })
          ),
          dependents: input.task.dependsOn.map((item: any) =>
            serializeDependency({
              id: item.task.id,
              title: item.task.title,
              status: item.task.status,
              dueDate: item.task.dueDate,
              assignedTo: item.task.assignedTo
            })
          ),
          attachments: input.task.attachments.map((attachment: any) => ({
            id: attachment.document.id,
            title: attachment.document.title,
            category: attachment.document.category,
            originalName: attachment.document.originalName,
            storagePath: attachment.document.storagePath,
            createdAt: attachment.document.createdAt.toISOString()
          })),
          dependencyCandidates: input.dependencyCandidates.map((candidate) =>
            serializeDependency(candidate)
          )
        }
      : null,
    users: input.users,
    sections: input.sections,
    phases: input.phases
  };
}
