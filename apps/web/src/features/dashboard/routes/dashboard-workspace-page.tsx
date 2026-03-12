import { Link } from "react-router-dom";

import { useDashboardActivityQuery } from "../hooks/use-dashboard-activity-query";
import { useDashboardSummaryQuery } from "../hooks/use-dashboard-summary-query";
import { AttentionQueueCard } from "../components/attention-queue-card";
import { SummaryMetricCard } from "../components/summary-metric-card";

function formatDate(value: string | null) {
  if (!value) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function taskQueueHref(queue: "overdue" | "blocked" | "unassigned" | "stale" | "upcoming") {
  const searchParams = new URLSearchParams({
    queue,
    archived: "active",
    view: "list"
  });

  if (queue === "blocked") {
    searchParams.set("sort", "status");
  }

  return `/tasks?${searchParams.toString()}`;
}

function taskDetailHref(
  taskId: string,
  queue: "overdue" | "blocked" | "unassigned" | "stale" | "upcoming"
) {
  const searchParams = new URLSearchParams({
    queue,
    archived: "active",
    view: "list"
  });

  if (queue === "blocked") {
    searchParams.set("sort", "status");
  }

  return `/tasks/${taskId}?${searchParams.toString()}`;
}

function messageHref(message: {
  linkedTaskId: string | null;
  thread: {
    id: string;
    task: {
      id: string;
    } | null;
  };
}) {
  const taskId = message.linkedTaskId ?? message.thread.task?.id;

  if (taskId) {
    return `/tasks/${taskId}`;
  }

  return `/messages/${message.thread.id}`;
}

function activityHref(activity: {
  entityType: string;
  entityId: string;
  task: {
    id: string;
  } | null;
}) {
  if (activity.task?.id) {
    return `/tasks/${activity.task.id}`;
  }

  if (activity.entityType === "Document" || activity.entityType === "TaskAttachment") {
    return `/documents/${activity.entityId}`;
  }

  if (activity.entityType === "Message") {
    return "/messages";
  }

  return null;
}

function LoadingBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-[1.5rem] bg-muted/70 ${className ?? "h-40"}`} />;
}

export function DashboardWorkspacePage() {
  const summaryQuery = useDashboardSummaryQuery();
  const activityQuery = useDashboardActivityQuery();

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-border bg-white/85 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.4)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Dashboard v2
        </p>
        <h2 className="mt-2 text-3xl font-semibold">Launch control surface</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Active-work queues, recent operational movement, and direct deep links into the rebuilt
          tasks, documents, and messages workspaces.
        </p>
      </section>

      {summaryQuery.isLoading ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <LoadingBlock key={index} className="h-36" />
          ))}
        </section>
      ) : summaryQuery.data ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SummaryMetricCard
            detail={`${summaryQuery.data.recentlyCompletedCount} recently completed tasks`}
            title="Overall completion"
            value={formatPercent(summaryQuery.data.overallCompletion)}
          />
          <SummaryMetricCard
            detail={`${summaryQuery.data.queueCounts.blocked} blocked items need attention`}
            title="Overdue tasks"
            tone="warning"
            value={String(summaryQuery.data.queueCounts.overdue)}
          />
          <SummaryMetricCard
            detail={`${summaryQuery.data.queueCounts.stale} tasks need fresh updates`}
            title="Unassigned tasks"
            value={String(summaryQuery.data.queueCounts.unassigned)}
          />
          <SummaryMetricCard
            detail="Active tasks due in the next 7 days"
            title="Due this week"
            value={String(summaryQuery.data.queueCounts.upcoming)}
          />
          <SummaryMetricCard
            detail="Incomplete active tasks not touched in 7+ days"
            title="Needs update"
            value={String(summaryQuery.data.queueCounts.stale)}
          />
        </section>
      ) : null}

      {summaryQuery.error ? (
        <section className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Unable to load dashboard summary.
        </section>
      ) : null}

      {summaryQuery.isLoading ? (
        <section className="grid gap-6 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <LoadingBlock key={index} className="h-80" />
          ))}
        </section>
      ) : summaryQuery.data ? (
        <>
          <section className="grid gap-6 xl:grid-cols-3">
            <AttentionQueueCard
              breakdown={summaryQuery.data.attention.overdue.breakdown}
              detail="Past-due active work that should be triaged first."
              href={taskQueueHref("overdue")}
              itemHref={(taskId) => taskDetailHref(taskId, "overdue")}
              itemMeta={(task) =>
                `Due ${formatDate(task.dueDate)} • ${task.assignedTo?.name ?? "Unassigned"}`
              }
              items={summaryQuery.data.attention.overdue.items}
              linkLabel="Open overdue queue"
              title={`Overdue Tasks (${summaryQuery.data.attention.overdue.count})`}
              tone="danger"
            />

            <AttentionQueueCard
              detail="Tasks marked blocked and needing owner attention."
              href={taskQueueHref("blocked")}
              itemHref={(taskId) => taskDetailHref(taskId, "blocked")}
              itemMeta={(task) => `${task.section.title} • ${task.blockedReason || "Blocked"}`}
              items={summaryQuery.data.attention.blocked.items}
              linkLabel="Open blocked queue"
              title={`Blocked Tasks (${summaryQuery.data.attention.blocked.count})`}
              tone="warning"
            />

            <AttentionQueueCard
              detail="Open tasks with no owner currently assigned."
              href={taskQueueHref("unassigned")}
              itemHref={(taskId) => taskDetailHref(taskId, "unassigned")}
              itemMeta={(task) => `${task.section.title} • Due ${formatDate(task.dueDate)}`}
              items={summaryQuery.data.attention.unassigned.items}
              linkLabel="Open unassigned queue"
              title={`Unassigned Tasks (${summaryQuery.data.attention.unassigned.count})`}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <AttentionQueueCard
              detail="Active tasks due in the next 7 days."
              href={taskQueueHref("upcoming")}
              itemHref={(taskId) => taskDetailHref(taskId, "upcoming")}
              itemMeta={(task) =>
                `Due ${formatDate(task.dueDate)} • ${task.assignedTo?.name ?? "Unassigned"}`
              }
              items={summaryQuery.data.attention.upcoming.items}
              linkLabel="Open upcoming queue"
              title={`Due This Week (${summaryQuery.data.attention.upcoming.count})`}
            />

            <AttentionQueueCard
              detail="Incomplete active tasks not updated in the last 7 days."
              href={taskQueueHref("stale")}
              itemHref={(taskId) => taskDetailHref(taskId, "stale")}
              itemMeta={(task) =>
                `Last changed ${formatDate(task.updatedAt)} • ${task.assignedTo?.name ?? "Unassigned"}`
              }
              items={summaryQuery.data.attention.stale.items}
              linkLabel="Open stale queue"
              title={`Needs Update (${summaryQuery.data.attention.stale.count})`}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            <section className="rounded-[1.5rem] border border-border bg-white/85 p-5 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">Recent Documents</p>
                  <p className="text-sm text-muted-foreground">
                    Open the protected document shelf directly.
                  </p>
                </div>
                <Link
                  className="rounded-full border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                  to="/documents"
                >
                  Open vault
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {summaryQuery.data.recentDocuments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/35 p-4 text-sm text-muted-foreground">
                    No recent documents.
                  </div>
                ) : (
                  summaryQuery.data.recentDocuments.map((document) => (
                    <Link
                      key={document.id}
                      className="block rounded-2xl border border-border bg-white/80 p-4 hover:bg-muted/60"
                      to={`/documents/${document.id}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{document.title}</p>
                        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                          {document.category.replaceAll("_", " ")}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Added by {document.uploadedBy.name} on {formatDate(document.createdAt)}
                        {document.linkedTask ? ` • Linked to ${document.linkedTask.title}` : ""}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-border bg-white/85 p-5 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">Message Activity</p>
                  <p className="text-sm text-muted-foreground">
                    Jump into the related task or the focused message thread.
                  </p>
                </div>
                <Link
                  className="rounded-full border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                  to="/messages"
                >
                  Open board
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {summaryQuery.data.recentMessages.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/35 p-4 text-sm text-muted-foreground">
                    No recent message activity.
                  </div>
                ) : (
                  summaryQuery.data.recentMessages.map((message) => (
                    <Link
                      key={message.id}
                      className="block rounded-2xl border border-border bg-white/80 p-4 hover:bg-muted/60"
                      to={messageHref(message)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{message.thread.title}</p>
                        <span className="text-xs text-muted-foreground">{message.author.name}</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{message.content}</p>
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-border bg-white/85 p-5 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">Recent Audit Activity</p>
                  <p className="text-sm text-muted-foreground">
                    Latest operational changes across the active workspace.
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {activityQuery.isLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <LoadingBlock key={index} className="h-20" />
                  ))
                ) : activityQuery.data?.activities.length ? (
                  activityQuery.data.activities.map((activity) => {
                    const href = activityHref(activity);
                    const content = (
                      <div className="rounded-2xl border border-border bg-white/80 p-4">
                        <p className="font-medium">{activity.description}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {activity.actor?.name ?? "System"} • {formatDate(activity.createdAt)}
                        </p>
                      </div>
                    );

                    return href ? (
                      <Link key={activity.id} className="block hover:bg-muted/60" to={href}>
                        {content}
                      </Link>
                    ) : (
                      <div key={activity.id}>{content}</div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/35 p-4 text-sm text-muted-foreground">
                    No recent activity.
                  </div>
                )}
              </div>
            </section>
          </section>
        </>
      ) : null}
    </div>
  );
}
