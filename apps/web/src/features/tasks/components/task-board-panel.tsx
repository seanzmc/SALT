import type { TaskListResponse, TaskStatus } from "@salt/types";
import { Link } from "react-router-dom";

type TaskBoardPanelProps = {
  tasks: TaskListResponse["tasks"];
  activeTaskId?: string;
  search: string;
  selectedTaskIds: string[];
  canSelectTasks: boolean;
  onPrefetchTask: (taskId: string) => void;
  onToggleTaskSelection: (taskId: string) => void;
};

const columns: Array<{ status: TaskStatus; label: string }> = [
  { status: "NOT_STARTED", label: "Not started" },
  { status: "IN_PROGRESS", label: "In progress" },
  { status: "BLOCKED", label: "Blocked" },
  { status: "COMPLETE", label: "Complete" }
];

function formatDate(value: string | null) {
  if (!value) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export function TaskBoardPanel({
  tasks,
  activeTaskId,
  search,
  selectedTaskIds,
  canSelectTasks,
  onPrefetchTask,
  onToggleTaskSelection
}: TaskBoardPanelProps) {
  return (
    <section className="rounded-[1.75rem] border border-border bg-card/90 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Board view</p>
          <p className="text-sm text-muted-foreground">
            Open the same right-side shelf from status columns.
          </p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          {tasks.length} shown
        </span>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-4">
        {columns.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.status);

          return (
            <div
              key={column.status}
              className="rounded-[1.5rem] border border-border bg-white/80 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{column.label}</p>
                <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                  {columnTasks.length}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {columnTasks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/35 p-4 text-sm text-muted-foreground">
                    No tasks in this column.
                  </div>
                ) : null}

                {columnTasks.map((task) => {
                  const isActive = task.id === activeTaskId;
                  const isSelected = selectedTaskIds.includes(task.id);
                  const dependencyBlocked = task.dependencyStatuses.some(
                    (status) => status !== "COMPLETE"
                  );

                  return (
                    <article
                      key={task.id}
                      className={[
                        "rounded-[1.25rem] border bg-card px-3 py-3 transition-colors",
                        isActive
                          ? "border-primary bg-primary/5 shadow-[inset_3px_0_0_0_hsl(var(--primary))]"
                          : "border-border hover:bg-muted/60"
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-2">
                        {canSelectTasks ? (
                          <input
                            checked={isSelected}
                            className="mt-1 h-4 w-4 rounded border-border"
                            onChange={() => onToggleTaskSelection(task.id)}
                            type="checkbox"
                          />
                        ) : null}

                        <div className="min-w-0 flex-1">
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
                            {task.assignedTo?.name ?? "Unassigned"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
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
            </div>
          );
        })}
      </div>
    </section>
  );
}
