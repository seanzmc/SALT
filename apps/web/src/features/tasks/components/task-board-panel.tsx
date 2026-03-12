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
    <div className="grid gap-4 xl:grid-cols-4">
      {columns.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.status);

        return (
          <section
            key={column.status}
            className="rounded-[1.25rem] border border-border/70 bg-muted/15"
          >
            <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
              <p className="font-medium text-foreground">{column.label}</p>
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {columnTasks.length}
              </span>
            </div>

            <div className="space-y-3 p-3">
              {columnTasks.length === 0 ? (
                <div className="rounded-[1rem] border border-dashed border-border bg-white/50 px-3 py-4 text-sm text-muted-foreground">
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
                    className={joinClasses(
                      "rounded-[1rem] border border-border/70 bg-white px-3 py-3 transition",
                      isActive && "border-primary/40 bg-primary/5",
                      !isActive && "hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-start gap-3">
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
                          {task.assignedTo?.name ?? "Unassigned"} · {formatDate(task.dueDate)}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full border border-border px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                            {task.priority}
                          </span>
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
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
