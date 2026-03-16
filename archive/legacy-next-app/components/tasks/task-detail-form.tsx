"use client";

import type { FormEvent, ReactNode } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { OpeningPriority, Priority, Role, TaskStatus } from "@prisma/client";

import {
  archiveSubtaskFeedbackAction,
  archiveTaskAction,
  createSubtaskFeedbackAction,
  createTaskDependencyFeedbackAction,
  deleteSubtaskFeedbackAction,
  deleteTaskAction,
  deleteTaskDependencyFeedbackAction,
  restoreSubtaskFeedbackAction,
  restoreTaskAction,
  updateSubtaskFeedbackAction,
  updateTaskFeedbackAction
} from "@/server/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";

type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const initialState: ActionState = { status: "idle" };

function toDateValue(value: Date | string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function SubmitButton({
  idleLabel,
  pendingLabel,
  variant = "default"
}: {
  idleLabel: string;
  pendingLabel: string;
  variant?: "default" | "outline" | "danger";
}) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} type="submit" variant={variant}>
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}

function FormMessage({ state }: { state: ActionState }) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  return (
    <p className={`text-sm ${state.status === "success" ? "text-emerald-700" : "text-danger"}`}>
      {state.message}
    </p>
  );
}

function CollapsibleSection({
  title,
  description,
  defaultOpen = true,
  children
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details className="rounded-xl border border-border bg-secondary/10" open={defaultOpen}>
      <summary className="cursor-pointer list-none px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">{title}</h3>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Toggle
          </span>
        </div>
      </summary>
      <div className="border-t border-border px-4 py-4">{children}</div>
    </details>
  );
}

function DependencyCard({
  taskId,
  dependencyId,
  title,
  status,
  dueDate,
  assignee
}: {
  taskId: string;
  dependencyId: string;
  title: string;
  status: TaskStatus;
  dueDate?: Date | string | null;
  assignee?: { name: string } | null;
}) {
  const [state, action] = useFormState(deleteTaskDependencyFeedbackAction, initialState);

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">
            Status: {status.replaceAll("_", " ")} • Due {formatDate(dueDate ?? null)} •{" "}
            {assignee?.name ?? "Unassigned"}
          </p>
        </div>
        <form action={action} className="space-y-2">
          <input type="hidden" name="taskId" value={taskId} />
          <input type="hidden" name="dependsOnTaskId" value={dependencyId} />
          <SubmitButton idleLabel="Remove" pendingLabel="Removing..." variant="danger" />
          <FormMessage state={state} />
        </form>
      </div>
    </div>
  );
}

function SubtaskCard({
  subtask,
  taskArchived,
  users,
  currentRole
}: {
  subtask: {
    id: string;
    title: string;
    notes: string | null;
    dueDate: Date | string | null;
    archivedAt: Date | string | null;
    assignedToId: string | null;
    assignedTo: { id: string; name: string } | null;
    isComplete: boolean;
    sortOrder: number;
  };
  taskArchived: boolean;
  users: Array<{ id: string; name: string; role: Role }>;
  currentRole: Role;
}) {
  const [updateState, updateAction] = useFormState(updateSubtaskFeedbackAction, initialState);
  const [deleteState, deleteAction] = useFormState(deleteSubtaskFeedbackAction, initialState);
  const [archiveState, archiveAction] = useFormState(
    subtask.archivedAt ? restoreSubtaskFeedbackAction : archiveSubtaskFeedbackAction,
    initialState
  );

  return (
    <div className="rounded-lg border border-border p-3">
      <form action={updateAction} className="grid gap-3">
        <input type="hidden" name="subtaskId" value={subtask.id} />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={`subtask-title-${subtask.id}`}>Title</Label>
            <Input
              defaultValue={subtask.title}
              id={`subtask-title-${subtask.id}`}
              name="title"
              required
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={`subtask-notes-${subtask.id}`}>Notes</Label>
            <Textarea
              defaultValue={subtask.notes ?? ""}
              id={`subtask-notes-${subtask.id}`}
              name="notes"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`subtask-status-${subtask.id}`}>Status</Label>
            <Select
              defaultValue={subtask.isComplete ? "true" : "false"}
              id={`subtask-status-${subtask.id}`}
              name="isComplete"
            >
              <option value="false">Pending</option>
              <option value="true">Complete</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`subtask-dueDate-${subtask.id}`}>Due date</Label>
            <Input
              defaultValue={toDateValue(subtask.dueDate)}
              id={`subtask-dueDate-${subtask.id}`}
              name="dueDate"
              type="date"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`subtask-assignedToId-${subtask.id}`}>Assigned to</Label>
            <Select
              defaultValue={subtask.assignedToId ?? ""}
              disabled={currentRole !== Role.OWNER_ADMIN}
              id={`subtask-assignedToId-${subtask.id}`}
              name="assignedToId"
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role === Role.OWNER_ADMIN ? "Owner" : "Collaborator"})
                </option>
              ))}
            </Select>
            {currentRole !== Role.OWNER_ADMIN ? (
              <input type="hidden" name="assignedToId" value={subtask.assignedToId ?? ""} />
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`subtask-sort-${subtask.id}`}>Sort order</Label>
            <Input
              defaultValue={subtask.sortOrder}
              id={`subtask-sort-${subtask.id}`}
              name="sortOrder"
              type="number"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <SubmitButton idleLabel="Save item" pendingLabel="Saving..." />
          <FormMessage state={updateState} />
        </div>
      </form>

      <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
        <form action={deleteAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="subtaskId" value={subtask.id} />
          <SubmitButton idleLabel="Remove item" pendingLabel="Removing..." variant="danger" />
          <FormMessage state={deleteState} />
        </form>
        {currentRole === Role.OWNER_ADMIN && !taskArchived ? (
          <form action={archiveAction} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="subtaskId" value={subtask.id} />
            <SubmitButton
              idleLabel={subtask.archivedAt ? "Restore item" : "Archive item"}
              pendingLabel={subtask.archivedAt ? "Restoring..." : "Archiving..."}
              variant="outline"
            />
            <FormMessage state={archiveState} />
          </form>
        ) : null}
      </div>
    </div>
  );
}

export function TaskDetailForm({
  task,
  users,
  currentRole,
  sections,
  phases,
  dependencyCandidates,
  onTaskSummaryChange
}: {
  task: {
    id: string;
    sectionId: string;
    phaseId: string | null;
    title: string;
    description: string | null;
    notes: string | null;
    status: TaskStatus;
    priority: Priority;
    openingPriority: OpeningPriority;
    dueDate: Date | string | null;
    archivedAt: Date | string | null;
    blockedReason: string | null;
    section: { title: string };
    phase: { title: string } | null;
    assignedToId?: string | null;
    assignedTo: { name: string } | null;
    subtasks: Array<{
      id: string;
      title: string;
      notes: string | null;
      dueDate: Date | string | null;
      archivedAt: Date | string | null;
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
        status: TaskStatus;
        dueDate?: Date | string | null;
        assignedTo?: { name: string } | null;
      };
    }>;
    dependsOn: Array<{
      task: {
        id: string;
        title: string;
        status: TaskStatus;
        dueDate?: Date | string | null;
        assignedTo?: { name: string } | null;
      };
    }>;
  };
  users: Array<{ id: string; name: string; role: Role }>;
  currentRole: Role;
  sections: Array<{ id: string; title: string }>;
  phases: Array<{ id: string; title: string }>;
  dependencyCandidates: Array<{
    id: string;
    title: string;
    status: TaskStatus;
    dueDate: Date | string | null;
    assignedTo: { name: string } | null;
  }>;
  onTaskSummaryChange?: (patch: {
    title?: string;
    status?: TaskStatus;
    priority?: Priority;
    dueDate?: string | null;
  }) => void;
}) {
  const [taskState, taskAction] = useFormState(updateTaskFeedbackAction, initialState);
  const [dependencyState, dependencyAction] = useFormState(
    createTaskDependencyFeedbackAction,
    initialState
  );
  const [createSubtaskState, createSubtaskAction] = useFormState(
    createSubtaskFeedbackAction,
    initialState
  );
  const currentDependencyIds = new Set(
    task.taskDependencies.map((dependency) => dependency.dependsOnTask.id)
  );
  const availableDependencyCandidates = dependencyCandidates.filter(
    (candidate) => !currentDependencyIds.has(candidate.id)
  );
  const activeSubtasks = task.subtasks.filter((subtask) => !subtask.archivedAt);
  const archivedSubtasks = task.subtasks.filter((subtask) => subtask.archivedAt);

  function handleTaskSubmit(event: FormEvent<HTMLFormElement>) {
    if (!onTaskSummaryChange) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    onTaskSummaryChange({
      title: String(formData.get("title") ?? task.title).trim() || task.title,
      status: String(formData.get("status") ?? task.status) as TaskStatus,
      priority: String(formData.get("priority") ?? task.priority) as Priority,
      dueDate: String(formData.get("dueDate") ?? "").trim() || null
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{task.title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {task.section.title} {task.phase ? `• ${task.phase.title}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            {task.archivedAt ? <Badge variant="outline">Archived</Badge> : null}
            <Badge
              variant={
                task.status === "COMPLETE"
                  ? "success"
                  : task.status === "BLOCKED"
                    ? "warning"
                    : "secondary"
              }
            >
              {task.status.replaceAll("_", " ")}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <CollapsibleSection
          title="Task Info"
          description="Core task details, ownership, due date, and blocked status."
        >
          <form action={taskAction} className="space-y-4" onSubmit={handleTaskSubmit}>
            <input type="hidden" name="taskId" value={task.id} />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" defaultValue={task.title} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={task.description ?? ""} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" defaultValue={task.notes ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sectionId">Section</Label>
                <Select
                  defaultValue={task.sectionId}
                  disabled={currentRole !== Role.OWNER_ADMIN}
                  id="sectionId"
                  name="sectionId"
                >
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.title}
                    </option>
                  ))}
                </Select>
                {currentRole !== Role.OWNER_ADMIN ? (
                  <input type="hidden" name="sectionId" value={task.sectionId} />
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phaseId">Phase</Label>
                <Select
                  defaultValue={task.phaseId ?? ""}
                  disabled={currentRole !== Role.OWNER_ADMIN}
                  id="phaseId"
                  name="phaseId"
                >
                  <option value="">No phase</option>
                  {phases.map((phase) => (
                    <option key={phase.id} value={phase.id}>
                      {phase.title}
                    </option>
                  ))}
                </Select>
                {currentRole !== Role.OWNER_ADMIN ? (
                  <input type="hidden" name="phaseId" value={task.phaseId ?? ""} />
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue={task.status} id="status" name="status">
                  {Object.values(TaskStatus).map((status) => (
                    <option key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select defaultValue={task.priority} id="priority" name="priority">
                  {Object.values(Priority).map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="openingPriority">Opening priority</Label>
                <Select defaultValue={task.openingPriority} id="openingPriority" name="openingPriority">
                  {Object.values(OpeningPriority).map((priority) => (
                    <option key={priority} value={priority}>
                      {priority.replaceAll("_", " ")}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due date</Label>
                <Input
                  defaultValue={toDateValue(task.dueDate)}
                  id="dueDate"
                  name="dueDate"
                  type="date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedToId">Assigned owner</Label>
                <Select
                  defaultValue={task.assignedToId ?? ""}
                  disabled={currentRole !== Role.OWNER_ADMIN}
                  id="assignedToId"
                  name="assignedToId"
                >
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role === Role.OWNER_ADMIN ? "Owner" : "Collaborator"})
                    </option>
                  ))}
                </Select>
                {currentRole !== Role.OWNER_ADMIN ? (
                  <>
                    <input type="hidden" name="assignedToId" value={task.assignedToId ?? ""} />
                    <p className="text-xs text-muted-foreground">
                      Only owner admins can change ownership.
                    </p>
                  </>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="blockedReason">Blocked reason</Label>
                <Input id="blockedReason" name="blockedReason" defaultValue={task.blockedReason ?? ""} />
                <p className="text-xs text-muted-foreground">
                  Required when the task status is set to blocked. It clears automatically once the task is no longer blocked.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <SubmitButton idleLabel="Save task" pendingLabel="Saving..." />
              <FormMessage state={taskState} />
            </div>
          </form>

          {task.archivedAt ? (
            <div className="mt-4 rounded-xl border border-border bg-secondary/20 p-4 text-sm text-muted-foreground">
              This task is archived and hidden from normal active queues. Restore it to resume active work.
            </div>
          ) : null}

          {currentRole === Role.OWNER_ADMIN ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <form action={task.archivedAt ? restoreTaskAction : archiveTaskAction}>
                <input type="hidden" name="taskId" value={task.id} />
                <Button type="submit" variant={task.archivedAt ? "outline" : "danger"}>
                  {task.archivedAt ? "Restore task" : "Archive task"}
                </Button>
              </form>
              <form action={deleteTaskAction}>
                <input type="hidden" name="taskId" value={task.id} />
                <Button type="submit" variant="danger">
                  Delete task
                </Button>
              </form>
            </div>
          ) : null}
        </CollapsibleSection>

        <CollapsibleSection
          title="Dependencies"
          description="Track what this task depends on and what downstream work it blocks."
        >
          {!task.archivedAt ? (
            <form
              action={dependencyAction}
              className="grid gap-3 rounded-xl border border-border bg-white p-4"
            >
              <input type="hidden" name="taskId" value={task.id} />
              <div className="space-y-2">
                <Label htmlFor="dependsOnTaskId">This task depends on</Label>
                <Select id="dependsOnTaskId" name="dependsOnTaskId">
                  {availableDependencyCandidates.length === 0 ? (
                    <option value="">No available tasks</option>
                  ) : (
                    availableDependencyCandidates.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.title} | {candidate.status.replaceAll("_", " ")} | Due{" "}
                        {formatDate(candidate.dueDate)} | {candidate.assignedTo?.name ?? "Unassigned"}
                      </option>
                    ))
                  )}
                </Select>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <SubmitButton
                  idleLabel="Add dependency"
                  pendingLabel="Adding..."
                  variant="outline"
                />
                <FormMessage state={dependencyState} />
              </div>
            </form>
          ) : null}

          <div className="mt-4 space-y-2">
            {task.taskDependencies.length === 0 ? (
              <p className="text-sm text-muted-foreground">No direct dependencies.</p>
            ) : (
              task.taskDependencies.map((dependency) => (
                <DependencyCard
                  key={dependency.dependsOnTask.id}
                  assignee={dependency.dependsOnTask.assignedTo}
                  dependencyId={dependency.dependsOnTask.id}
                  dueDate={dependency.dependsOnTask.dueDate}
                  status={dependency.dependsOnTask.status}
                  taskId={task.id}
                  title={dependency.dependsOnTask.title}
                />
              ))
            )}
          </div>

          <div className="mt-4 space-y-2">
            <h4 className="font-medium">This task blocks</h4>
            {task.dependsOn.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No downstream tasks are blocked by this one.
              </p>
            ) : (
              task.dependsOn.map((dependency) => (
                <div key={dependency.task.id} className="rounded-lg border border-border p-3">
                  <p className="font-medium">{dependency.task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Status: {dependency.task.status.replaceAll("_", " ")} • Due{" "}
                    {formatDate(dependency.task.dueDate ?? null)} •{" "}
                    {dependency.task.assignedTo?.name ?? "Unassigned"}
                  </p>
                </div>
              ))
            )}
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Checklist Items"
          description="Create, update, reorder, archive, and restore the task’s operational checklist."
        >
          {!task.archivedAt ? (
            <form
              action={createSubtaskAction}
              className="grid gap-3 rounded-xl border border-border bg-white p-4"
            >
              <input type="hidden" name="taskId" value={task.id} />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="new-subtask-title">New checklist item</Label>
                  <Input id="new-subtask-title" name="title" required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="new-subtask-notes">Notes</Label>
                  <Textarea id="new-subtask-notes" name="notes" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-subtask-dueDate">Due date</Label>
                  <Input id="new-subtask-dueDate" name="dueDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-subtask-assignedToId">Assigned to</Label>
                  <Select
                    defaultValue=""
                    disabled={currentRole !== Role.OWNER_ADMIN}
                    id="new-subtask-assignedToId"
                    name="assignedToId"
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role === Role.OWNER_ADMIN ? "Owner" : "Collaborator"})
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <SubmitButton idleLabel="Add checklist item" pendingLabel="Adding..." />
                <FormMessage state={createSubtaskState} />
              </div>
            </form>
          ) : null}

          <div className="mt-4 space-y-3">
            {activeSubtasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active checklist items.</p>
            ) : (
              activeSubtasks.map((subtask) => (
                <SubtaskCard
                  key={subtask.id}
                  currentRole={currentRole}
                  subtask={subtask}
                  taskArchived={Boolean(task.archivedAt)}
                  users={users}
                />
              ))
            )}
          </div>

          {archivedSubtasks.length > 0 ? (
            <div className="mt-4 space-y-3 border-t border-border pt-4">
              <h4 className="font-medium">Archived checklist items</h4>
              {archivedSubtasks.map((subtask) => (
                <SubtaskCard
                  key={subtask.id}
                  currentRole={currentRole}
                  subtask={subtask}
                  taskArchived={Boolean(task.archivedAt)}
                  users={users}
                />
              ))}
            </div>
          ) : null}
        </CollapsibleSection>
      </CardContent>
    </Card>
  );
}
