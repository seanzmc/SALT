import { useEffect, useMemo, useState } from "react";
import type { TaskBulkAction, TaskListResponse, TaskPriority, TaskStatus } from "@salt/types";

type BulkActionValues = {
  action: TaskBulkAction;
  assignedToId: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  blockedReason: string;
};

type BulkActionsPanelProps = {
  selectedCount: number;
  visibleCount: number;
  users: TaskListResponse["users"];
  archiveView: "active" | "archived" | "all";
  isPending: boolean;
  error?: string;
  onClearSelection: () => void;
  onSubmit: (payload: BulkActionValues) => Promise<void>;
};

function getDefaultAction(archiveView: BulkActionsPanelProps["archiveView"]): TaskBulkAction {
  return archiveView === "archived" ? "restore" : "assign";
}

export function BulkActionsPanel({
  selectedCount,
  visibleCount,
  users,
  archiveView,
  isPending,
  error,
  onClearSelection,
  onSubmit
}: BulkActionsPanelProps) {
  const [values, setValues] = useState<BulkActionValues>({
    action: getDefaultAction(archiveView),
    assignedToId: "",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    dueDate: "",
    blockedReason: ""
  });

  useEffect(() => {
    setValues((current) => ({
      ...current,
      action: getDefaultAction(archiveView)
    }));
  }, [archiveView]);

  const actionOptions = useMemo(() => {
    if (archiveView === "archived") {
      return [{ value: "restore" as const, label: "Restore selected tasks" }];
    }

    if (archiveView === "all") {
      return [
        { value: "assign" as const, label: "Assign owner" },
        { value: "clearAssignee" as const, label: "Clear owner" },
        { value: "status" as const, label: "Set status" },
        { value: "priority" as const, label: "Set priority" },
        { value: "setDueDate" as const, label: "Set due date" },
        { value: "archive" as const, label: "Archive active tasks" },
        { value: "restore" as const, label: "Restore archived tasks" }
      ];
    }

    return [
      { value: "assign" as const, label: "Assign owner" },
      { value: "clearAssignee" as const, label: "Clear owner" },
      { value: "status" as const, label: "Set status" },
      { value: "priority" as const, label: "Set priority" },
      { value: "setDueDate" as const, label: "Set due date" },
      { value: "archive" as const, label: "Archive selected tasks" }
    ];
  }, [archiveView]);

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="rounded-[1.25rem] border border-border/80 bg-muted/18 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">Bulk task actions</p>
          <p className="text-sm text-muted-foreground">
            Apply owner-only changes without leaving the queue.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {selectedCount} selected
          </span>
          <button
            className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
            onClick={onClearSelection}
            type="button"
          >
            Clear
          </button>
        </div>
      </div>

      <form
        className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5"
        onSubmit={async (event) => {
          event.preventDefault();
          await onSubmit(values);
        }}
      >
        <label className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Action
          </span>
          <select
            className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                action: event.target.value as TaskBulkAction
              }))
            }
            value={values.action}
          >
            {actionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {values.action === "assign" ? (
          <label className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Owner
            </span>
            <select
              className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  assignedToId: event.target.value
                }))
              }
              value={values.assignedToId}
            >
              <option value="">Select owner</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {values.action === "status" ? (
          <>
            <label className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Status
              </span>
              <select
                className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    status: event.target.value as TaskStatus
                  }))
                }
                value={values.status}
              >
                <option value="NOT_STARTED">Not started</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="BLOCKED">Blocked</option>
                <option value="COMPLETE">Complete</option>
              </select>
            </label>

            {values.status === "BLOCKED" ? (
              <label className="space-y-2 md:col-span-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Blocked reason
                </span>
                <input
                  className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      blockedReason: event.target.value
                    }))
                  }
                  value={values.blockedReason}
                />
              </label>
            ) : null}
          </>
        ) : null}

        {values.action === "priority" ? (
          <label className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Priority
            </span>
            <select
              className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  priority: event.target.value as TaskPriority
                }))
              }
              value={values.priority}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </label>
        ) : null}

        {values.action === "setDueDate" ? (
          <label className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Due date
            </span>
            <input
              className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  dueDate: event.target.value
                }))
              }
              type="date"
              value={values.dueDate}
            />
          </label>
        ) : null}

        <div className="flex items-end">
          <button
            className="w-full rounded-[1rem] bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
            disabled={isPending}
            type="submit"
          >
            {isPending ? "Applying..." : "Apply bulk action"}
          </button>
        </div>
      </form>

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
