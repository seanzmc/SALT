import { Link } from "react-router-dom";

import { WorkspacePageHeader } from "../../../app/components/workspace-page";
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
  thread: {
    id: string;
  };
}) {
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
  const desktopActiveMetrics = summaryQuery.data
    ? [
        {
          key: "overallCompletion",
          detail: `${summaryQuery.data.recentlyCompletedCount} completed recently`,
          title: "Overall completion",
          value: formatPercent(summaryQuery.data.overallCompletion)
        },
        ...(summaryQuery.data.queueCounts.overdue > 0
          ? [
              {
                key: "overdue",
                detail: `${summaryQuery.data.queueCounts.overdue} overdue items`,
                title: "Overdue tasks",
                tone: "warning" as const,
                value: String(summaryQuery.data.queueCounts.overdue)
              }
            ]
          : []),
        ...(summaryQuery.data.queueCounts.unassigned > 0
          ? [
              {
                key: "unassigned",
                detail: `${summaryQuery.data.queueCounts.unassigned} tasks need owners`,
                title: "Unassigned tasks",
                value: String(summaryQuery.data.queueCounts.unassigned)
              }
            ]
          : []),
        ...(summaryQuery.data.queueCounts.upcoming > 0
          ? [
              {
                key: "upcoming",
                detail: "Due in the next 7 days",
                title: "Due this week",
                value: String(summaryQuery.data.queueCounts.upcoming)
              }
            ]
          : []),
        ...(summaryQuery.data.queueCounts.stale > 0
          ? [
              {
                key: "stale",
                detail: "No updates in 7+ days",
                title: "Needs update",
                value: String(summaryQuery.data.queueCounts.stale)
              }
            ]
          : [])
      ]
    : [];
  const desktopQuietMetrics = summaryQuery.data
    ? [
        ...(summaryQuery.data.queueCounts.overdue === 0
          ? [{ key: "overdue", label: "Overdue", value: "0" }]
          : []),
        ...(summaryQuery.data.queueCounts.unassigned === 0
          ? [{ key: "unassigned", label: "Unassigned", value: "0" }]
          : []),
        ...(summaryQuery.data.queueCounts.upcoming === 0
          ? [{ key: "upcoming", label: "Due this week", value: "0" }]
          : []),
        ...(summaryQuery.data.queueCounts.stale === 0
          ? [{ key: "stale", label: "Needs update", value: "0" }]
          : [])
      ]
    : [];
  const primaryAttentionCards = summaryQuery.data
    ? [
        {
          key: "overdue",
          count: summaryQuery.data.attention.overdue.count,
          card: (
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
          )
        },
        {
          key: "blocked",
          count: summaryQuery.data.attention.blocked.count,
          card: (
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
          )
        },
        {
          key: "unassigned",
          count: summaryQuery.data.attention.unassigned.count,
          card: (
            <AttentionQueueCard
              detail="Open tasks with no owner currently assigned."
              href={taskQueueHref("unassigned")}
              itemHref={(taskId) => taskDetailHref(taskId, "unassigned")}
              itemMeta={(task) => `${task.section.title} • Due ${formatDate(task.dueDate)}`}
              items={summaryQuery.data.attention.unassigned.items}
              linkLabel="Open unassigned queue"
              title={`Unassigned Tasks (${summaryQuery.data.attention.unassigned.count})`}
            />
          )
        }
      ].filter((item) => item.count > 0)
    : [];
  const secondaryAttentionCards = summaryQuery.data
    ? [
        {
          key: "upcoming",
          count: summaryQuery.data.attention.upcoming.count,
          card: (
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
          )
        },
        {
          key: "stale",
          count: summaryQuery.data.attention.stale.count,
          card: (
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
          )
        }
      ].filter((item) => item.count > 0)
    : [];

  return (
    <div className="space-y-4 xl:space-y-5">
      <WorkspacePageHeader
        compact
        description="Triage active work and jump directly into task, document, message, budget, and timeline queues."
        eyebrow="Dashboard"
        title="Launch control surface"
      />

      {summaryQuery.isLoading ? (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <LoadingBlock key={index} className="h-28" />
          ))}
        </section>
      ) : summaryQuery.data ? (
        <>
          <section className="grid gap-3 md:grid-cols-2 xl:hidden">
            <SummaryMetricCard
              detail={`${summaryQuery.data.recentlyCompletedCount} completed recently`}
              title="Overall completion"
              value={formatPercent(summaryQuery.data.overallCompletion)}
            />
            <SummaryMetricCard
              detail={`${summaryQuery.data.queueCounts.overdue} overdue items`}
              title="Overdue tasks"
              tone="warning"
              value={String(summaryQuery.data.queueCounts.overdue)}
            />
            <SummaryMetricCard
              detail={`${summaryQuery.data.queueCounts.unassigned} tasks need owners`}
              title="Unassigned tasks"
              value={String(summaryQuery.data.queueCounts.unassigned)}
            />
            <SummaryMetricCard
              detail="Due in the next 7 days"
              title="Due this week"
              value={String(summaryQuery.data.queueCounts.upcoming)}
            />
            <SummaryMetricCard
              detail="No updates in 7+ days"
              title="Needs update"
              value={String(summaryQuery.data.queueCounts.stale)}
            />
          </section>

          <section className="hidden xl:block space-y-3">
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: `repeat(${Math.min(
                  Math.max(desktopActiveMetrics.length, 1),
                  5
                )}, minmax(0, 1fr))`
              }}
            >
              {desktopActiveMetrics.map((metric) => (
                <SummaryMetricCard
                  key={metric.key}
                  detail={metric.detail}
                  title={metric.title}
                  tone={metric.tone}
                  value={metric.value}
                />
              ))}
            </div>

            {desktopQuietMetrics.length > 0 ? (
              <div className="flex items-center gap-3 rounded-[1.1rem] border border-border/80 bg-white/70 px-4 py-2.5 text-sm text-muted-foreground backdrop-blur">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Quiet queues
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {desktopQuietMetrics.map((metric) => (
                    <span
                      key={metric.key}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/85 px-3 py-1 text-[13px]"
                    >
                      <span className="font-medium text-foreground">{metric.label}</span>
                      <span>{metric.value}</span>
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </>
      ) : null}

      {summaryQuery.error ? (
        <section className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Unable to load dashboard summary.
        </section>
      ) : null}

      {summaryQuery.isLoading ? (
        <section className="grid gap-4 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <LoadingBlock key={index} className="h-72" />
          ))}
        </section>
      ) : summaryQuery.data ? (
        <>
          {primaryAttentionCards.length > 0 ? (
            <section className="grid gap-4 xl:grid-cols-3">
              {primaryAttentionCards.map((item) => (
                <div key={item.key}>{item.card}</div>
              ))}
            </section>
          ) : (
            <section className="rounded-[1.25rem] border border-dashed border-border bg-muted/18 px-4 py-4 text-sm text-muted-foreground">
              No overdue, blocked, or unassigned work needs attention right now.
            </section>
          )}

          {secondaryAttentionCards.length > 0 ? (
            <section className="grid gap-4 xl:grid-cols-2">
              {secondaryAttentionCards.map((item) => (
                <div key={item.key}>{item.card}</div>
              ))}
            </section>
          ) : null}

          <section className="grid gap-5 xl:grid-cols-3">
            <section className="rounded-[1.5rem] border border-border bg-white/85 p-5 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">Recent Documents</p>
                  <p className="text-sm text-muted-foreground">
                    Open the protected document shelf directly.
                  </p>
                </div>
                <Link
                  className="inline-flex min-h-10 items-center justify-center rounded-full border border-border px-3 py-2 text-center text-sm text-muted-foreground hover:bg-muted"
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
                  className="inline-flex min-h-10 items-center justify-center rounded-full border border-border px-3 py-2 text-center text-sm text-muted-foreground hover:bg-muted"
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
