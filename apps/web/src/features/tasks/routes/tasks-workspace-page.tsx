import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import { getTaskList, getTaskWorkspace } from "../api/tasks-client";

export function TasksWorkspacePage() {
  const params = useParams();
  const selectedTaskId = params.taskId;

  const taskListQuery = useQuery({
    queryKey: ["tasks", "list"],
    queryFn: getTaskList
  });

  const taskWorkspaceQuery = useQuery({
    queryKey: ["tasks", "detail", selectedTaskId],
    queryFn: () => getTaskWorkspace(selectedTaskId!),
    enabled: Boolean(selectedTaskId)
  });

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-border bg-white/85 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.4)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Milestone one
        </p>
        <h2 className="mt-2 text-3xl font-semibold">Tasks Workspace v2</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          This scaffold proves the new SPA architecture: protected shell, query-backed task data,
          and a dedicated workspace route that will evolve into the persistent list + shelf flow.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <section className="rounded-[1.75rem] border border-border bg-card/90 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Task queue</p>
              <p className="text-sm text-muted-foreground">
                Initial read surface from the new API.
              </p>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              {taskListQuery.data?.tasks.length ?? 0} tasks
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {taskListQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading tasks…</p>
            ) : null}

            {taskListQuery.data?.tasks.map((task) => (
              <Link
                key={task.id}
                className={[
                  "block rounded-2xl border px-4 py-3 transition-colors",
                  selectedTaskId === task.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/70"
                ].join(" ")}
                to={`/tasks/${task.id}`}
              >
                <p className="font-medium">{task.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {task.section.title} • {task.status.replaceAll("_", " ")}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-border bg-card/90 p-5 shadow-sm">
          {!selectedTaskId ? (
            <div className="flex h-full min-h-[18rem] items-center justify-center rounded-[1.25rem] border border-dashed border-border bg-muted/35 p-6 text-center">
              <div>
                <p className="font-medium">Select a task to open the workspace shelf.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  The next pass will replace this placeholder with the actual v2 detail workflow.
                </p>
              </div>
            </div>
          ) : taskWorkspaceQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading task workspace…</p>
          ) : taskWorkspaceQuery.data?.task ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Task workspace preview
                </p>
                <h3 className="mt-2 text-2xl font-semibold">
                  {taskWorkspaceQuery.data.task.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {taskWorkspaceQuery.data.task.section.title} •{" "}
                  {taskWorkspaceQuery.data.task.assignedTo?.name ?? "Unassigned"}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-muted/60 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Status</p>
                  <p className="mt-2 font-medium">
                    {taskWorkspaceQuery.data.task.status.replaceAll("_", " ")}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/60 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Comments</p>
                  <p className="mt-2 font-medium">
                    {taskWorkspaceQuery.data.task.comments.length}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/60 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Subtasks</p>
                  <p className="mt-2 font-medium">
                    {taskWorkspaceQuery.data.task.subtasks.length}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-white p-4">
                <p className="text-sm font-semibold">Ready for next pass</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Route-driven selection, authenticated task queries, and workspace data loading
                  are in place. The next implementation pass can focus on real list filters,
                  optimistic task updates, comments, and the persistent right-side shelf UX.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Task unavailable.</p>
          )}
        </section>
      </div>
    </div>
  );
}
