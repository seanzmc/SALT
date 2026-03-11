"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Priority, Role, TaskStatus } from "@prisma/client";

import { bulkUpdateTasksAction } from "@/server/actions";
import { TaskTable, type TaskTableRow } from "@/components/tasks/task-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const initialState: ActionState = { status: "idle" };

function BulkSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} type="submit">
      {pending ? "Applying..." : "Apply bulk action"}
    </Button>
  );
}

export function TaskListManager({
  tasks,
  users,
  currentRole,
  groupBy
}: {
  tasks: TaskTableRow[];
  users: Array<{ id: string; name: string; role: Role }>;
  currentRole: Role;
  groupBy: "none" | "section";
}) {
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [action, setAction] = useState("assign");
  const [state, formAction] = useFormState(bulkUpdateTasksAction, initialState);

  useEffect(() => {
    setSelectedTaskIds([]);
  }, [tasks, groupBy]);

  useEffect(() => {
    if (state.status === "success") {
      setSelectedTaskIds([]);
    }
  }, [state.status]);

  const selectedTaskIdSet = useMemo(() => new Set(selectedTaskIds), [selectedTaskIds]);

  function toggleTask(taskId: string) {
    setSelectedTaskIds((current) =>
      current.includes(taskId)
        ? current.filter((id) => id !== taskId)
        : [...current, taskId]
    );
  }

  function toggleAllVisible() {
    const visibleIds = tasks.map((task) => task.id);
    const allSelected = visibleIds.every((id) => selectedTaskIdSet.has(id));

    setSelectedTaskIds(allSelected ? [] : visibleIds);
  }

  const groupedTasks =
    groupBy === "section"
      ? tasks.reduce<Record<string, TaskTableRow[]>>((acc, task) => {
          const key = task.section.title;
          acc[key] ??= [];
          acc[key].push(task);
          return acc;
        }, {})
      : null;

  return (
    <div className="space-y-4">
      {currentRole === Role.OWNER_ADMIN ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Bulk Actions {selectedTaskIds.length ? `(${selectedTaskIds.length} selected)` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedTaskIds.length === 0 ? (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  Select one or more visible tasks from the list to update them together.
                </p>
                <Button onClick={toggleAllVisible} type="button" variant="outline">
                  Select all visible
                </Button>
              </div>
            ) : (
              <form action={formAction} className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
                {selectedTaskIds.map((taskId) => (
                  <input key={taskId} name="taskIds" type="hidden" value={taskId} />
                ))}
                <div className="space-y-2">
                  <Label htmlFor="bulk-action">Action</Label>
                  <Select
                    defaultValue={action}
                    id="bulk-action"
                    name="action"
                    onChange={(event) => setAction(event.target.value)}
                  >
                    <option value="assign">Assign / reassign owner</option>
                    <option value="clearAssignee">Clear assignee</option>
                    <option value="status">Change status</option>
                    <option value="priority">Change priority</option>
                    <option value="setDueDate">Set due date</option>
                    <option value="shiftDueDate">Shift due date by days</option>
                    <option value="markComplete">Mark complete</option>
                  </Select>
                </div>

                {action === "assign" ? (
                  <div className="space-y-2">
                    <Label htmlFor="bulk-assignee">Owner</Label>
                    <Select defaultValue="" id="bulk-assignee" name="assignedToId">
                      <option value="">Select owner</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.role === Role.OWNER_ADMIN ? "Owner" : "Collaborator"})
                        </option>
                      ))}
                    </Select>
                  </div>
                ) : null}

                {action === "status" ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="bulk-status">Status</Label>
                      <Select defaultValue={TaskStatus.IN_PROGRESS} id="bulk-status" name="status">
                        {Object.values(TaskStatus).map((status) => (
                          <option key={status} value={status}>
                            {status.replaceAll("_", " ")}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bulk-blocked-reason">Blocked reason</Label>
                      <Input id="bulk-blocked-reason" name="blockedReason" placeholder="Required if setting blocked" />
                    </div>
                  </div>
                ) : null}

                {action === "priority" ? (
                  <div className="space-y-2">
                    <Label htmlFor="bulk-priority">Priority</Label>
                    <Select defaultValue={Priority.MEDIUM} id="bulk-priority" name="priority">
                      {Object.values(Priority).map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </Select>
                  </div>
                ) : null}

                {action === "setDueDate" ? (
                  <div className="space-y-2">
                    <Label htmlFor="bulk-dueDate">Due date</Label>
                    <Input id="bulk-dueDate" name="dueDate" type="date" />
                  </div>
                ) : null}

                {action === "shiftDueDate" ? (
                  <div className="space-y-2">
                    <Label htmlFor="bulk-shiftDays">Shift by days</Label>
                    <Input defaultValue={1} id="bulk-shiftDays" name="shiftDays" type="number" />
                  </div>
                ) : null}

                <div className="flex items-end gap-3">
                  <BulkSubmitButton />
                  <Button onClick={toggleAllVisible} type="button" variant="outline">
                    Select all visible
                  </Button>
                  <Button onClick={() => setSelectedTaskIds([])} type="button" variant="outline">
                    Clear selection
                  </Button>
                </div>

                {state.message ? (
                  <p className={`text-sm ${state.status === "success" ? "text-emerald-700" : "text-danger"} lg:col-span-3`}>
                    {state.message}
                  </p>
                ) : null}
              </form>
            )}
          </CardContent>
        </Card>
      ) : null}

      {groupedTasks ? (
        <div className="space-y-4">
          {Object.entries(groupedTasks).map(([group, groupTasks]) => (
            <Card key={group}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-3 text-base">
                  <span>{group}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {groupTasks.length} tasks
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TaskTable
                  onToggleTask={toggleTask}
                  selectedTaskIds={selectedTaskIdSet}
                  selectable={currentRole === Role.OWNER_ADMIN}
                  tasks={groupTasks}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <TaskTable
          onToggleAllVisible={toggleAllVisible}
          onToggleTask={toggleTask}
          selectedTaskIds={selectedTaskIdSet}
          selectable={currentRole === Role.OWNER_ADMIN}
          tasks={tasks}
        />
      )}
    </div>
  );
}
