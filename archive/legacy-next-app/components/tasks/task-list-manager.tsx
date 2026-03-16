"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Priority, Role, TaskStatus } from "@prisma/client";

import { bulkUpdateTasksAction } from "@/server/actions";
import { TaskTable, type TaskTableRow } from "@/components/tasks/task-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { type ChecklistBulkAction, type ChecklistCleanupMode } from "@/lib/checklist-workspace";

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
  archiveView,
  tasks,
  users,
  currentRole,
  groupBy,
  cleanupMode,
  preferredBulkAction,
  openTaskId,
  onOpenTask,
  onPrefetchTask
}: {
  archiveView: "active" | "archived" | "all";
  tasks: TaskTableRow[];
  users: Array<{ id: string; name: string; role: Role }>;
  currentRole: Role;
  groupBy: "none" | "section";
  cleanupMode?: ChecklistCleanupMode | null;
  preferredBulkAction?: ChecklistBulkAction;
  openTaskId?: string;
  onOpenTask?: (taskId: string) => void;
  onPrefetchTask?: (taskId: string) => void;
}) {
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [action, setAction] = useState<ChecklistBulkAction>(
    archiveView === "archived" ? "restore" : preferredBulkAction ?? "assign"
  );
  const [state, formAction] = useFormState(bulkUpdateTasksAction, initialState);

  useEffect(() => {
    setSelectedTaskIds((current) => current.filter((taskId) => tasks.some((task) => task.id === taskId)));
  }, [tasks, groupBy]);

  useEffect(() => {
    setAction(archiveView === "archived" ? "restore" : preferredBulkAction ?? "assign");
  }, [archiveView, preferredBulkAction]);

  useEffect(() => {
    if (state.status === "success") {
      setSelectedTaskIds([]);
    }
  }, [state.status]);

  const selectedTaskIdSet = useMemo(() => new Set(selectedTaskIds), [selectedTaskIds]);
  const selectedTasks = useMemo(
    () => tasks.filter((task) => selectedTaskIdSet.has(task.id)),
    [selectedTaskIdSet, tasks]
  );
  const selectedArchivedCount = selectedTasks.filter((task) => task.archivedAt).length;
  const selectedActiveCount = selectedTasks.length - selectedArchivedCount;

  const actionOptions =
    archiveView === "archived"
      ? [{ value: "restore", label: "Restore selected tasks" }]
      : archiveView === "all"
        ? [
            { value: "assign", label: "Assign / reassign owner" },
            { value: "clearAssignee", label: "Clear assignee" },
            { value: "status", label: "Change status" },
            { value: "priority", label: "Change priority" },
            { value: "setDueDate", label: "Set due date" },
            { value: "shiftDueDate", label: "Shift due date by days" },
            { value: "markComplete", label: "Mark complete" },
            { value: "archive", label: "Archive active tasks" },
            { value: "restore", label: "Restore archived tasks" }
          ]
        : [
            { value: "assign", label: "Assign / reassign owner" },
            { value: "clearAssignee", label: "Clear assignee" },
            { value: "status", label: "Change status" },
            { value: "priority", label: "Change priority" },
            { value: "setDueDate", label: "Set due date" },
            { value: "shiftDueDate", label: "Shift due date by days" },
            { value: "markComplete", label: "Mark complete" },
            { value: "archive", label: "Archive selected tasks" }
          ];

  function toggleTask(taskId: string) {
    setSelectedTaskIds((current) =>
      current.includes(taskId)
        ? current.filter((id) => id !== taskId)
        : [...current, taskId]
    );
  }

  function toggleAllVisible() {
    const visibleIds = tasks.map((task) => task.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedTaskIdSet.has(id));

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

  const cleanupHint =
    cleanupMode === "overdue"
      ? "Cleanup mode: review past-due work in list view, then use bulk due-date or status updates to reschedule and unblock the queue."
      : cleanupMode === "blocked"
        ? "Cleanup mode: select blocked work and use bulk status updates after clearing blockers or adding clearer blocked reasons."
        : cleanupMode === "unassigned"
          ? "Cleanup mode: select visible tasks and use bulk assign to put owners on the queue quickly."
          : cleanupMode === "stale"
            ? "Cleanup mode: select stale tasks and use bulk status or owner updates after reviewing what needs a fresh update."
            : cleanupMode === "upcoming"
              ? "Cleanup mode: review the next 7 days of work and use bulk due-date or owner updates to smooth the week."
              : null;

  return (
    <div className="space-y-4">
      {currentRole === Role.OWNER_ADMIN ? (
        <Card className="rounded-[1.5rem] border-border/80 bg-card/95 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.45)]">
          <CardHeader className="gap-3 border-b border-border/70">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-base">
                Bulk Actions {selectedTaskIds.length ? `(${selectedTaskIds.length} selected)` : ""}
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{tasks.length} visible</Badge>
                {selectedTaskIds.length ? (
                  <Badge variant="outline">{selectedTaskIds.length} selected</Badge>
                ) : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {cleanupHint ? (
              <p className="text-sm text-muted-foreground">{cleanupHint}</p>
            ) : null}
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
                    onChange={(event) => setAction(event.target.value as ChecklistBulkAction)}
                    value={action}
                  >
                    {actionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
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
                      <Input
                        id="bulk-blocked-reason"
                        name="blockedReason"
                        placeholder="Required if setting blocked"
                      />
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
                  <p
                    className={`text-sm ${state.status === "success" ? "text-emerald-700" : "text-danger"} lg:col-span-3`}
                  >
                    {state.message}
                  </p>
                ) : null}

                {archiveView === "all" && selectedTaskIds.length > 0 ? (
                  <p className="text-sm text-muted-foreground lg:col-span-3">
                    Selected mix: {selectedActiveCount} active, {selectedArchivedCount} archived.
                    Archive only affects active tasks. Restore only affects archived tasks.
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
            <Card
              key={group}
              className="overflow-hidden rounded-[1.5rem] border-border/80 bg-card/95 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.4)]"
            >
              <CardHeader className="border-b border-border/70">
                <CardTitle className="flex items-center justify-between gap-3 text-base">
                  <span>{group}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {groupTasks.length} tasks
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <TaskTable
                    activeTaskId={openTaskId}
                    onOpenTask={onOpenTask}
                    onPrefetchTask={onPrefetchTask}
                    onToggleTask={toggleTask}
                    selectedTaskIds={selectedTaskIdSet}
                    selectable={currentRole === Role.OWNER_ADMIN}
                    tasks={groupTasks}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden rounded-[1.5rem] border-border/80 bg-card/95 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.4)]">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <TaskTable
                activeTaskId={openTaskId}
                onOpenTask={onOpenTask}
                onPrefetchTask={onPrefetchTask}
                onToggleAllVisible={toggleAllVisible}
                onToggleTask={toggleTask}
                selectedTaskIds={selectedTaskIdSet}
                selectable={currentRole === Role.OWNER_ADMIN}
                tasks={tasks}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
