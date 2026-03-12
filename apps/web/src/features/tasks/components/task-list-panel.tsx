import type { TaskListResponse } from "@salt/types";
import { Link } from "react-router-dom";

type TaskListPanelProps = {
  tasks: TaskListResponse["tasks"];
  activeTaskId?: string;
  search: string;
  selectedTaskIds: string[];
  allVisibleSelected: boolean;
  canSelectTasks: boolean;
  onPrefetchTask: (taskId: string) => void;
  onToggleTaskSelection: (taskId: string) => void;
  onToggleSelectAllVisible: () => void;
};

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function formatDate(value: string | null) {
  if (!value) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export function TaskListPanel({
  tasks,
  activeTaskId,
  search,
  selectedTaskIds,
  allVisibleSelected,
  canSelectTasks,
  onPrefetchTask,
  onToggleTaskSelection,
  onToggleSelectAllVisible
}: TaskListPanelProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-[1.25rem] border border-dashed border-border bg-muted/25 px-4 py-8 text-center text-sm text-muted-foreground">
        No tasks match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-white">
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
        <div className="text-sm text-muted-foreground">
          {tasks.length} visible task{tasks.length === 1 ? "" : "s"}
        </div>
        {canSelectTasks ? (
          <button
            className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
            onClick={onToggleSelectAllVisible}
            type="button"
          >
            {allVisibleSelected ? "Clear visible" : "Select visible"}
          </button>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <tr>
              {canSelectTasks ? (
                <th className="w-12 px-4 py-3">
                  <input
                    aria-label="Select all visible tasks"
                    checked={allVisibleSelected}
                    className="h-4 w-4 rounded border-border"
                    onChange={onToggleSelectAllVisible}
                    type="checkbox"
                  />
                </th>
              ) : null}
              <th className="min-w-[22rem] px-4 py-3">Task</th>
              <th className="hidden px-4 py-3 lg:table-cell">Section</th>
              <th className="hidden px-4 py-3 xl:table-cell">Assignee</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Status</th>
              <th className="hidden px-4 py-3 md:table-cell">Priority</th>
              <th className="hidden px-4 py-3 xl:table-cell">Ready</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const isActive = task.id === activeTaskId;
              const isSelected = selectedTaskIds.includes(task.id);
              const dependencyBlocked = task.dependencyStatuses.some(
                (status) => status !== "COMPLETE"
              );

              return (
                <tr
                  key={task.id}
                  className={joinClasses(
                    "border-t border-border/70 align-top transition",
                    isActive && "bg-primary/5",
                    !isActive && "hover:bg-muted/35"
                  )}
                >
                  {canSelectTasks ? (
                    <td className="px-4 py-4">
                      <input
                        checked={isSelected}
                        className="mt-1 h-4 w-4 rounded border-border"
                        onChange={() => onToggleTaskSelection(task.id)}
                        type="checkbox"
                      />
                    </td>
                  ) : null}
                  <td className="px-4 py-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            className="font-medium text-foreground hover:text-primary"
                            onMouseEnter={() => onPrefetchTask(task.id)}
                            to={{
                              pathname: `/tasks/${task.id}`,
                              search
                            }}
                          >
                            {task.title}
                          </Link>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {task.phase?.title ?? "No phase"} · {task.section.title}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {task.archivedAt ? (
                            <span className="rounded-full border border-border px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                              Archived
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-4 text-sm text-muted-foreground lg:table-cell">
                    {task.section.title}
                  </td>
                  <td className="hidden px-4 py-4 text-sm text-muted-foreground xl:table-cell">
                    {task.assignedTo?.name ?? "Unassigned"}
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {formatDate(task.dueDate)}
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      {task.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="hidden px-4 py-4 md:table-cell">
                    <span className="rounded-full border border-border px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      {task.priority}
                    </span>
                  </td>
                  <td className="hidden px-4 py-4 xl:table-cell">
                    <span
                      className={joinClasses(
                        "rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.14em]",
                        dependencyBlocked
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-700"
                      )}
                    >
                      {dependencyBlocked ? "Blocked" : "Ready"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
