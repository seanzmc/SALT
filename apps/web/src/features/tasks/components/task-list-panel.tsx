import type { TaskListResponse } from "@salt/types";
import { Link } from "react-router-dom";

type TaskListPanelProps = {
  tasks: TaskListResponse["tasks"];
  activeTaskId?: string;
  search: string;
  onPrefetchTask: (taskId: string) => void;
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
  onPrefetchTask
}: TaskListPanelProps) {
  return (
    <section className="rounded-[1.75rem] border border-border bg-card/90 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Visible queue</p>
          <p className="text-sm text-muted-foreground">
            The result set stays steady while shelf work happens in context.
          </p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          {tasks.length} shown
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/35 p-6 text-sm text-muted-foreground">
            No tasks match the current filters.
          </div>
        ) : null}

        {tasks.map((task) => {
          const isActive = task.id === activeTaskId;
          const dependencyBlocked = task.dependencyStatuses.some(
            (status) => status !== "COMPLETE"
          );

          return (
            <Link
              key={task.id}
              className={[
                "block rounded-[1.4rem] border px-4 py-4 transition-colors",
                isActive
                  ? "border-primary bg-primary/5 shadow-[inset_3px_0_0_0_hsl(var(--primary))]"
                  : "border-border hover:bg-muted/70"
              ].join(" ")}
              onMouseEnter={() => onPrefetchTask(task.id)}
              to={{
                pathname: `/tasks/${task.id}`,
                search
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {task.section.title} • {task.assignedTo?.name ?? "Unassigned"}
                  </p>
                </div>
                <div className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  {task.status.replaceAll("_", " ")}
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
                    dependencyBlocked ? "border-amber-300 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  ].join(" ")}
                >
                  {dependencyBlocked ? "Dependency blocked" : "Ready"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
