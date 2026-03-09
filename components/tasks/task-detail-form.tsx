import { OpeningPriority, Priority, Role, TaskStatus } from "@prisma/client";

import { updateTaskAction } from "@/server/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";

export function TaskDetailForm({
  task,
  users,
  currentRole
}: {
  task: {
    id: string;
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
    subtasks: Array<{ id: string; title: string; isComplete: boolean }>;
    taskTags: Array<{ tag: { name: string } }>;
    dependsOn: Array<{ dependsOnTask: { id: string; title: string; status: TaskStatus } }>;
  };
  users: Array<{ id: string; name: string; role: Role }>;
  currentRole: Role;
}) {
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
                defaultValue={task.dueDate ? task.dueDate.toISOString().slice(0, 10) : ""}
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="blockedReason">Blocked reason</Label>
              <Input id="blockedReason" name="blockedReason" defaultValue={task.blockedReason ?? ""} />
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

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Dependencies</h3>
            <div className="mt-2 space-y-2">
              {task.dependsOn.length === 0 ? (
                <p className="text-sm text-muted-foreground">No explicit dependencies.</p>
              ) : (
                task.dependsOn.map((dependency) => (
                  <div key={dependency.dependsOnTask.id} className="rounded-lg border border-border p-3">
                    <p className="font-medium">{dependency.dependsOnTask.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Status: {dependency.dependsOnTask.status.replaceAll("_", " ")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold">Subtasks</h3>
            <div className="mt-2 space-y-2">
              {task.subtasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No subtasks.</p>
              ) : (
                task.subtasks.map((subtask) => (
                  <div key={subtask.id} className="rounded-lg border border-border p-3">
                    <p className="font-medium">{subtask.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {subtask.isComplete ? "Complete" : "Pending"}
                    </p>
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
