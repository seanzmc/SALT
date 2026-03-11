import { OpeningPriority, Priority, Role, TaskStatus } from "@prisma/client";

import {
  createSubtaskAction,
  createTaskDependencyAction,
  deleteSubtaskAction,
  deleteTaskDependencyAction,
  deleteTaskAction,
  updateSubtaskAction,
  updateTaskAction
} from "@/server/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";

function toDateValue(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export function TaskDetailForm({
  task,
  users,
  currentRole,
  sections,
  phases,
  dependencyCandidates
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
    dueDate: Date | null;
    blockedReason: string | null;
    section: { title: string };
    phase: { title: string } | null;
    assignedToId?: string | null;
    assignedTo: { name: string } | null;
    subtasks: Array<{
      id: string;
      title: string;
      notes: string | null;
      dueDate: Date | null;
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
        dueDate?: Date | null;
        assignedTo?: { name: string } | null;
      };
    }>;
    dependsOn: Array<{
      task: {
        id: string;
        title: string;
        status: TaskStatus;
        dueDate?: Date | null;
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
    dueDate: Date | null;
    assignedTo: { name: string } | null;
  }>;
}) {
  const currentDependencyIds = new Set(
    task.taskDependencies.map((dependency) => dependency.dependsOnTask.id)
  );
  const availableDependencyCandidates = dependencyCandidates.filter(
    (candidate) => !currentDependencyIds.has(candidate.id)
  );

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
          <Badge variant={task.status === "COMPLETE" ? "success" : task.status === "BLOCKED" ? "warning" : "secondary"}>
            {task.status.replaceAll("_", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <form action={updateTaskAction} className="space-y-4">
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
                <input type="hidden" name="assignedToId" value={task.assignedToId ?? ""} />
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="blockedReason">Blocked reason</Label>
              <Input id="blockedReason" name="blockedReason" defaultValue={task.blockedReason ?? ""} />
              <p className="text-xs text-muted-foreground">
                Required when the task status is set to blocked. It is cleared automatically when the task is no longer blocked.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit">Save task</Button>
            {currentRole !== Role.OWNER_ADMIN ? (
              <p className="self-center text-xs text-muted-foreground">
                Collaborators can edit operational tasks, but budget administration remains owner-only.
              </p>
            ) : null}
          </div>
        </form>

        {currentRole === Role.OWNER_ADMIN ? (
          <form action={deleteTaskAction}>
            <input type="hidden" name="taskId" value={task.id} />
            <Button type="submit" variant="danger">
              Delete task
            </Button>
          </form>
        ) : null}

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Dependencies</h3>
            <form action={createTaskDependencyAction} className="mt-3 grid gap-3 rounded-xl border border-border bg-secondary/20 p-4">
              <input type="hidden" name="taskId" value={task.id} />
              <div className="space-y-2">
                <Label htmlFor="dependsOnTaskId">This task depends on</Label>
                <Select id="dependsOnTaskId" name="dependsOnTaskId">
                  {availableDependencyCandidates.length === 0 ? (
                    <option value="">No available tasks</option>
                  ) : (
                    availableDependencyCandidates.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.title} | {candidate.status.replaceAll("_", " ")} | Due {formatDate(candidate.dueDate)} | {candidate.assignedTo?.name ?? "Unassigned"}
                      </option>
                    ))
                  )}
                </Select>
              </div>
              <div className="flex gap-2">
                <Button disabled={availableDependencyCandidates.length === 0} type="submit" variant="outline">
                  Add dependency
                </Button>
              </div>
            </form>

            <div className="mt-3 space-y-2">
              {task.taskDependencies.length === 0 ? (
                <p className="text-sm text-muted-foreground">No direct dependencies.</p>
              ) : (
                task.taskDependencies.map((dependency) => (
                  <div key={dependency.dependsOnTask.id} className="rounded-lg border border-border p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{dependency.dependsOnTask.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Status: {dependency.dependsOnTask.status.replaceAll("_", " ")} • Due {formatDate(dependency.dependsOnTask.dueDate ?? null)} • {dependency.dependsOnTask.assignedTo?.name ?? "Unassigned"}
                        </p>
                      </div>
                      <form action={deleteTaskDependencyAction}>
                        <input type="hidden" name="taskId" value={task.id} />
                        <input type="hidden" name="dependsOnTaskId" value={dependency.dependsOnTask.id} />
                        <Button type="submit" variant="danger">
                          Remove
                        </Button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold">This Task Blocks</h3>
            <div className="mt-2 space-y-2">
              {task.dependsOn.length === 0 ? (
                <p className="text-sm text-muted-foreground">No downstream tasks are blocked by this one.</p>
              ) : (
                task.dependsOn.map((dependency) => (
                  <div key={dependency.task.id} className="rounded-lg border border-border p-3">
                    <p className="font-medium">{dependency.task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Status: {dependency.task.status.replaceAll("_", " ")} • Due {formatDate(dependency.task.dueDate ?? null)} • {dependency.task.assignedTo?.name ?? "Unassigned"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold">Subtasks</h3>
            <form action={createSubtaskAction} className="mt-3 grid gap-3 rounded-xl border border-border bg-secondary/20 p-4">
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
              <div className="flex gap-2">
                <Button type="submit">Add checklist item</Button>
              </div>
            </form>

            <div className="mt-3 space-y-3">
              {task.subtasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No subtasks.</p>
              ) : (
                task.subtasks.map((subtask) => (
                  <div key={subtask.id} className="rounded-lg border border-border p-3">
                    <form action={updateSubtaskAction} className="grid gap-3">
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
                          <Label htmlFor={`subtask-order-${subtask.id}`}>Display order</Label>
                          <Input
                            defaultValue={subtask.sortOrder}
                            id={`subtask-order-${subtask.id}`}
                            min={0}
                            name="sortOrder"
                            type="number"
                          />
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
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button type="submit" variant="outline">
                          Save checklist item
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          {subtask.assignedTo?.name ?? "Unassigned"} • {subtask.isComplete ? "Complete" : "Pending"}
                        </span>
                      </div>
                    </form>
                    <form action={deleteSubtaskAction} className="mt-3">
                      <input type="hidden" name="subtaskId" value={subtask.id} />
                      <Button type="submit" variant="danger">
                        Remove checklist item
                      </Button>
                    </form>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold">Tags</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {task.taskTags.map((taskTag) => (
                <Badge key={taskTag.tag.name} variant="outline">
                  {taskTag.tag.name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
            Current due date: {formatDate(task.dueDate)}. Track legal and regulatory items as reminders requiring local verification rather than legal conclusions.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
