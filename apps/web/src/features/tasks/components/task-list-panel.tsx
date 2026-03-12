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
  return (
    <section className="rounded-[1.75rem] border border-border bg-card/90 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Visible queue</p>
          <p className="text-sm text-muted-foreground">
            The result set stays steady while shelf work happens in context.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canSelectTasks ? (
            <button
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
              onClick={onToggleSelectAllVisible}
              type="button"
            >
              {allVisibleSelected ? "Clear visible" : "Select visible"}
            </button>
          ) : null}
          <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
            {tasks.length} shown
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/35 p-6 text-sm text-muted-foreground">
            No tasks match the current filters.
          </div>
        ) : null}

        {tasks.map((task) => {
          const isActive = task.id === activeTaskId;
          const isSelected = selectedTaskIds.includes(task.id);
          const dependencyBlocked = task.dependencyStatuses.some(
            (status) => status !== "COMPLETE"
          );

          return (
            <article
              key={task.id}
              className={[
                "rounded-[1.4rem] border px-4 py-4 transition-colors",
                isActive
                  ? "border-primary bg-primary/5 shadow-[inset_3px_0_0_0_hsl(var(--primary))]"
                  : "border-border hover:bg-muted/70"
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  {canSelectTasks ? (
                    <input
                      checked={isSelected}
                      className="mt-1 h-4 w-4 rounded border-border"
                      onChange={() => onToggleTaskSelection(task.id)}
                      type="checkbox"
                    />
                  ) : null}

                  <div className="min-w-0">
                    <Link
                      className="font-medium hover:text-primary"
                      onMouseEnter={() => onPrefetchTask(task.id)}
                      to={{
                        pathname: `/tasks/${task.id}`,
                        search
                      }}
                    >
                      {task.title}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {task.section.title} • {task.assignedTo?.name ?? "Unassigned"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {task.archivedAt ? (
                    <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                      Archived
                    </span>
                  ) : null}
                  <div className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    {task.status.replaceAll("_", " ")}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border border-border px-2 py-1">
                  {task.priority}
                </span>
                <span className="rounded-full border border-border px-2 py-1">
                  Due {formatDate(task.dueDate)}
                </span>
                <span
                  className={[
                    "rounded-full border px-2 py-1",
                    dependencyBlocked
                      ? "border-amber-300 bg-amber-50 text-amber-800"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  ].join(" ")}
                >
                  {dependencyBlocked ? "Dependency blocked" : "Ready"}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
