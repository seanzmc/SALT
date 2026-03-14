import type { DashboardActivityItem } from "@salt/types";
import { Link } from "react-router-dom";

import {
  WorkspacePageHeader,
  WorkspaceSurface
} from "../../../app/components/workspace-page";
import { useDashboardActivityQuery } from "../hooks/use-dashboard-activity-query";
import { useDashboardSummaryQuery } from "../hooks/use-dashboard-summary-query";

type QueueKey = "overdue" | "blocked" | "unassigned" | "upcoming" | "stale";
type Tone = "default" | "warning" | "danger" | "success" | "quiet";

const panelActionClasses =
  "inline-flex min-h-10 items-center justify-center rounded-full border border-border px-3 py-2 text-center text-sm text-muted-foreground hover:bg-muted";

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

function formatDateRange(startDate: string | null, endDate: string | null) {
  if (!startDate && !endDate) {
    return "Dates not set";
  }

  if (startDate && endDate) {
    return `${formatDate(startDate)} to ${formatDate(endDate)}`;
  }

  return startDate ? `Starts ${formatDate(startDate)}` : `Ends ${formatDate(endDate)}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value));
}

function taskWorkspaceHref() {
  return "/tasks?archived=active&view=list";
}

function taskQueueHref(queue: QueueKey) {
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

function messageHref(message: {
  thread: {
    id: string;
  };
}) {
  return `/messages/${message.thread.id}`;
}

function activityHref(activity: Pick<DashboardActivityItem, "entityType" | "entityId" | "task">) {
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

function phaseStatusClasses(status: "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "COMPLETE") {
  switch (status) {
    case "COMPLETE":
      return "bg-emerald-100 text-emerald-700";
    case "BLOCKED":
      return "bg-rose-100 text-rose-700";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function toneClasses(tone: Exclude<Tone, "quiet">) {
  switch (tone) {
    case "danger":
      return "border-rose-200 bg-rose-50/88";
    case "warning":
      return "border-amber-200 bg-amber-50/88";
    case "success":
      return "border-emerald-200 bg-emerald-50/88";
    default:
      return "border-border/75 bg-white/88";
  }
}

function LoadingBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-[1.5rem] bg-muted/70 ${className ?? "h-40"}`} />;
}

function WorkspaceActionLink({ label, to }: { label: string; to: string }) {
  return (
    <Link className={panelActionClasses} to={to}>
      {label}
    </Link>
  );
}

function SummaryPill({
  label,
  value,
  tone = "default"
}: {
  label: string;
  value: string;
  tone?: Tone;
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
        tone === "quiet"
          ? "border-border/60 bg-white/65 text-muted-foreground"
          : tone === "danger"
            ? "border-rose-200 bg-rose-50 text-rose-700"
            : tone === "warning"
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-border/70 bg-white/80 text-muted-foreground"
      ].join(" ")}
    >
      <span className="font-medium">{label}</span>
      <span className="text-foreground">{value}</span>
    </span>
  );
}

function SupportingMetric({
  label,
  value,
  detail,
  tone = "default"
}: {
  label: string;
  value: string;
  detail: string;
  tone?: Exclude<Tone, "quiet">;
}) {
  return (
    <div className={["rounded-[1.1rem] border px-4 py-4 shadow-sm", toneClasses(tone)].join(" ")}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-[1.7rem] font-semibold leading-none text-foreground">{value}</p>
      <p className="mt-2 text-sm leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}

function StatusTile({
  label,
  count,
  detail,
  to,
  tone = "default"
}: {
  label: string;
  count: number;
  detail: string;
  to: string;
  tone?: Exclude<Tone, "success">;
}) {
  const quiet = count === 0;

  return (
    <Link
      className={[
        "group rounded-[1.2rem] border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-42px_rgba(15,23,42,0.32)]",
        quiet
          ? "border-dashed border-border/70 bg-white/62"
          : tone === "danger"
            ? "border-rose-200 bg-rose-50/85"
            : tone === "warning"
              ? "border-amber-200 bg-amber-50/85"
              : "border-border/75 bg-white/88"
      ].join(" ")}
      to={to}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </p>
          <p
            className={[
              "mt-3 text-[2rem] font-semibold leading-none",
              quiet ? "text-muted-foreground" : "text-foreground"
            ].join(" ")}
          >
            {count}
          </p>
        </div>
        <span
          className={[
            "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
            quiet
              ? "bg-white/85 text-muted-foreground"
              : tone === "danger"
                ? "bg-white/80 text-rose-700"
                : tone === "warning"
                  ? "bg-white/80 text-amber-800"
                  : "bg-muted text-muted-foreground"
          ].join(" ")}
        >
          {quiet ? "Clear" : "Open queue"}
        </span>
      </div>
      <p className="mt-3 text-sm leading-5 text-muted-foreground">{detail}</p>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Open task workspace
      </p>
    </Link>
  );
}

function EmptyListState({ message }: { message: string }) {
  return (
    <div className="rounded-[1.2rem] border border-dashed border-border bg-muted/28 p-4 text-sm text-muted-foreground">
      {message}
    </div>
  );
}

export function DashboardWorkspacePage() {
  const summaryQuery = useDashboardSummaryQuery();
  const activityQuery = useDashboardActivityQuery();
  const summary = summaryQuery.data;
  const budgetSpendPercent =
    summary && summary.budget.estimatedTotal > 0
      ? clampPercent((summary.budget.actualTotal / summary.budget.estimatedTotal) * 100)
      : 0;
  const timelineCompletionPercent =
    summary && summary.timeline.totalPhases > 0
      ? clampPercent((summary.timeline.completePhases / summary.timeline.totalPhases) * 100)
      : 0;
  const queueTiles = summary
    ? [
        {
          key: "overdue",
          count: summary.queueCounts.overdue,
          detail: "Past-due active work that needs a due-date or ownership reset.",
          label: "Overdue",
          tone: "danger" as const,
          to: taskQueueHref("overdue")
        },
        {
          key: "blocked",
          count: summary.queueCounts.blocked,
          detail: "Tasks marked blocked and waiting on blocker cleanup.",
          label: "Blocked",
          tone: "warning" as const,
          to: taskQueueHref("blocked")
        },
        {
          key: "unassigned",
          count: summary.queueCounts.unassigned,
          detail: "Open work with no clear owner assigned yet.",
          label: "Unassigned",
          tone: "default" as const,
          to: taskQueueHref("unassigned")
        },
        {
          key: "upcoming",
          count: summary.queueCounts.upcoming,
          detail: "Active tasks due in the next 7 days.",
          label: "Due this week",
          tone: "default" as const,
          to: taskQueueHref("upcoming")
        },
        {
          key: "stale",
          count: summary.queueCounts.stale,
          detail: "Incomplete work with no updates in the last 7 days.",
          label: "Needs update",
          tone: "default" as const,
          to: taskQueueHref("stale")
        }
      ]
    : [];

  return (
    <div className="space-y-5 xl:space-y-6">
      <WorkspacePageHeader
        compact
        description="Start with overall progress, then jump straight into the task queues and workspaces that need attention."
        eyebrow="Dashboard"
        title="Launch control surface"
      />

      {summaryQuery.error ? (
        <section className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Unable to load dashboard summary.
        </section>
      ) : null}

      {summaryQuery.isLoading ? (
        <>
          <LoadingBlock className="h-[18rem]" />
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <LoadingBlock key={index} className="h-36" />
            ))}
          </section>
          <section className="grid gap-5 xl:grid-cols-12">
            <LoadingBlock className="h-80 xl:col-span-7" />
            <LoadingBlock className="h-80 xl:col-span-5" />
          </section>
          <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-12">
            <LoadingBlock className="h-80 xl:col-span-5" />
            <LoadingBlock className="h-80 xl:col-span-4" />
            <LoadingBlock className="h-80 lg:col-span-2 xl:col-span-3" />
          </section>
        </>
      ) : summary ? (
        <>
          <WorkspaceSurface
            actions={<WorkspaceActionLink label="Open tasks" to={taskWorkspaceHref()} />}
            bodyClassName="space-y-5"
            description="Use this as the stable top snapshot for task completion, active load, and the task states most likely to slow the launch down."
            title="Workspace progress"
          >
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.95fr)] xl:items-start">
              <div className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Overall completion
                    </p>
                    {summary.progress.totalTasks > 0 ? (
                      <>
                        <div className="mt-2 flex flex-wrap items-end gap-3">
                          <p className="text-[2.8rem] font-semibold leading-none text-foreground">
                            {formatPercent(summary.overallCompletion)}
                          </p>
                          <p className="pb-1 text-sm text-muted-foreground">
                            {summary.progress.completedTasks} of {summary.progress.totalTasks} tasks
                            complete
                          </p>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {summary.progress.activeTasks} tasks still need work. Use the status tiles
                          below to jump directly into the active queues.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="mt-2 text-2xl font-semibold text-foreground">
                          No active tasks yet
                        </p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          Create the first launch task to turn this dashboard into a live workspace
                          snapshot.
                        </p>
                      </>
                    )}
                  </div>

                  <SummaryPill
                    label="Active work"
                    tone={summary.progress.activeTasks > 0 ? "default" : "quiet"}
                    value={String(summary.progress.activeTasks)}
                  />
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-[rgba(15,23,42,0.08)]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,rgba(33,95,84,1),rgba(74,168,141,0.92))]"
                    style={{ width: `${clampPercent(summary.overallCompletion)}%` }}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <SummaryPill
                    label="In progress"
                    value={String(summary.progress.inProgressTasks)}
                  />
                  <SummaryPill
                    label="Not started"
                    tone={summary.progress.notStartedTasks > 0 ? "default" : "quiet"}
                    value={String(summary.progress.notStartedTasks)}
                  />
                  <SummaryPill
                    label="Overdue"
                    tone={summary.queueCounts.overdue > 0 ? "danger" : "quiet"}
                    value={String(summary.queueCounts.overdue)}
                  />
                  <SummaryPill
                    label="Blocked"
                    tone={summary.queueCounts.blocked > 0 ? "warning" : "quiet"}
                    value={String(summary.queueCounts.blocked)}
                  />
                  <SummaryPill
                    label="Due this week"
                    tone={summary.queueCounts.upcoming > 0 ? "default" : "quiet"}
                    value={String(summary.queueCounts.upcoming)}
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
                <SupportingMetric
                  detail={
                    summary.progress.activeTasks > 0
                      ? "Still open across the active workspace."
                      : "No active tasks are left open."
                  }
                  label="Active work"
                  value={String(summary.progress.activeTasks)}
                />
                <SupportingMetric
                  detail={
                    summary.progress.inProgressTasks > 0
                      ? "Already underway right now."
                      : "Nothing is currently marked in progress."
                  }
                  label="In progress"
                  value={String(summary.progress.inProgressTasks)}
                />
                <SupportingMetric
                  detail={
                    summary.queueCounts.unassigned > 0
                      ? "Tasks still need owners."
                      : "Current active work is assigned."
                  }
                  label="Owner gaps"
                  tone={summary.queueCounts.unassigned > 0 ? "warning" : "default"}
                  value={String(summary.queueCounts.unassigned)}
                />
              </div>
            </div>
          </WorkspaceSurface>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {queueTiles.map((tile) => (
              <StatusTile
                count={tile.count}
                detail={tile.detail}
                key={tile.key}
                label={tile.label}
                to={tile.to}
                tone={tile.tone}
              />
            ))}
          </section>

          <section className="grid gap-5 xl:grid-cols-12">
            <WorkspaceSurface
              actions={<WorkspaceActionLink label="View budget" to="/budget" />}
              bodyClassName="space-y-4"
              className="xl:col-span-7"
              description="Budget stays visible here as a workspace entry point, not a leftover KPI row."
              title="Budget summary"
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <SupportingMetric
                  detail={`${summary.budget.itemCount} budget lines tracked`}
                  label="Estimated"
                  value={formatCurrency(summary.budget.estimatedTotal)}
                />
                <SupportingMetric
                  detail="Captured actual spend so far"
                  label="Actual"
                  value={formatCurrency(summary.budget.actualTotal)}
                />
                <SupportingMetric
                  detail={
                    summary.budget.variance > 0
                      ? "Currently above estimate."
                      : summary.budget.variance < 0
                        ? "Currently under estimate."
                        : "Tracking on estimate."
                  }
                  label="Variance"
                  tone={
                    summary.budget.variance > 0
                      ? "danger"
                      : summary.budget.variance < 0
                        ? "success"
                        : "default"
                  }
                  value={formatCurrency(summary.budget.variance)}
                />
              </div>

              <div className="rounded-[1.2rem] border border-border/75 bg-[linear-gradient(180deg,rgba(255,251,244,0.88),rgba(232,244,241,0.62))] p-4 shadow-[0_18px_50px_-44px_rgba(15,23,42,0.25)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Spend progress
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {summary.budget.estimatedTotal > 0
                        ? `${formatCurrency(summary.budget.actualTotal)} spent against ${formatCurrency(summary.budget.estimatedTotal)} estimated`
                        : "No budget estimate is available yet."}
                    </p>
                  </div>
                  <span className="rounded-full border border-border/70 bg-white/80 px-3 py-1 text-sm font-medium text-foreground">
                    {formatPercent(budgetSpendPercent)}
                  </span>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[rgba(15,23,42,0.08)]">
                  <div
                    className={[
                      "h-full rounded-full",
                      summary.budget.variance > 0 ? "bg-rose-500" : "bg-[rgba(33,95,84,0.95)]"
                    ].join(" ")}
                    style={{ width: `${budgetSpendPercent}%` }}
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <SummaryPill
                    label="Must-have"
                    value={formatCurrency(summary.budget.mustHaveTotal)}
                  />
                  <SummaryPill
                    label="Optional"
                    tone="quiet"
                    value={formatCurrency(summary.budget.optionalTotal)}
                  />
                </div>
              </div>
            </WorkspaceSurface>

            <WorkspaceSurface
              actions={<WorkspaceActionLink label="View timeline" to="/timeline" />}
              bodyClassName="space-y-4"
              className="xl:col-span-5"
              description="Timeline gets its own summary module so the next opening phase is easy to spot."
              title="Timeline phase summary"
            >
              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                <SupportingMetric
                  detail={
                    summary.timeline.totalPhases > 0
                      ? `${formatPercent(timelineCompletionPercent)} of phases closed out`
                      : "No phases have been created yet."
                  }
                  label="Complete"
                  value={`${summary.timeline.completePhases}/${summary.timeline.totalPhases}`}
                />
                <SupportingMetric
                  detail={
                    summary.timeline.inProgressPhases > 0
                      ? "Phases currently moving forward."
                      : "No phases are marked in progress."
                  }
                  label="In progress"
                  value={String(summary.timeline.inProgressPhases)}
                />
                <SupportingMetric
                  detail={
                    summary.timeline.blockedPhases > 0
                      ? "Phases currently blocked."
                      : "No phases are blocked."
                  }
                  label="Blocked"
                  tone={summary.timeline.blockedPhases > 0 ? "warning" : "default"}
                  value={String(summary.timeline.blockedPhases)}
                />
              </div>

              <div className="rounded-[1.2rem] border border-border/75 bg-[linear-gradient(180deg,rgba(230,244,239,0.9),rgba(255,255,255,0.84))] p-4 shadow-[0_18px_50px_-44px_rgba(15,23,42,0.25)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Phase progress
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {summary.timeline.totalPhases > 0
                        ? `${summary.timeline.completePhases} of ${summary.timeline.totalPhases} phases complete`
                        : "No timeline phases are available yet."}
                    </p>
                  </div>
                  <span className="rounded-full border border-border/70 bg-white/80 px-3 py-1 text-sm font-medium text-foreground">
                    {formatPercent(timelineCompletionPercent)}
                  </span>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[rgba(15,23,42,0.08)]">
                  <div
                    className="h-full rounded-full bg-[rgba(33,95,84,0.95)]"
                    style={{ width: `${timelineCompletionPercent}%` }}
                  />
                </div>

                {summary.timeline.currentPhase ? (
                  <div className="mt-4 rounded-[1rem] border border-border/70 bg-white/82 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">Current phase</p>
                      <span
                        className={[
                          "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                          phaseStatusClasses(summary.timeline.currentPhase.status)
                        ].join(" ")}
                      >
                        {summary.timeline.currentPhase.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {summary.timeline.currentPhase.title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDateRange(
                        summary.timeline.currentPhase.startDate,
                        summary.timeline.currentPhase.endDate
                      )}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <SummaryPill
                        label="Tasks"
                        value={String(summary.timeline.currentPhase.taskCount)}
                      />
                      <SummaryPill
                        label="Milestones"
                        tone="quiet"
                        value={String(summary.timeline.currentPhase.milestoneCount)}
                      />
                    </div>
                  </div>
                ) : summary.timeline.totalPhases > 0 ? (
                  <EmptyListState message="All timeline phases are currently marked complete." />
                ) : (
                  <EmptyListState message="Create timeline phases to turn this into a live opening sequence." />
                )}
              </div>
            </WorkspaceSurface>
          </section>

          <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-12">
            <WorkspaceSurface
              actions={<WorkspaceActionLink label="View documents" to="/documents" />}
              bodyClassName="space-y-3"
              className="xl:col-span-5"
              description="Recent documents stay visible as another direct workspace entry point."
              title="Recent documents"
            >
              {summary.recentDocuments.length === 0 ? (
                <EmptyListState message="No recent documents." />
              ) : (
                summary.recentDocuments.slice(0, 4).map((document) => (
                  <Link
                    className="block rounded-[1.15rem] border border-border bg-white/80 p-4 hover:bg-muted/60"
                    key={document.id}
                    to={`/documents/${document.id}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{document.title}</p>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                        {document.category.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Added by {document.uploadedBy.name} on {formatDate(document.createdAt)}
                      {document.linkedTask ? ` • Linked to ${document.linkedTask.title}` : ""}
                    </p>
                  </Link>
                ))
              )}
            </WorkspaceSurface>

            <WorkspaceSurface
              actions={<WorkspaceActionLink label="View messages" to="/messages" />}
              bodyClassName="space-y-3"
              className="xl:col-span-4"
              description="Conversation stays close to the dashboard without dominating the top of it."
              title="Message activity"
            >
              {summary.recentMessages.length === 0 ? (
                <EmptyListState message="No recent message activity." />
              ) : (
                summary.recentMessages.slice(0, 4).map((message) => (
                  <Link
                    className="block rounded-[1.15rem] border border-border bg-white/80 p-4 hover:bg-muted/60"
                    key={message.id}
                    to={messageHref(message)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{message.thread.title}</p>
                      <span className="text-xs text-muted-foreground">{message.author.name}</span>
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {message.content}
                    </p>
                  </Link>
                ))
              )}
            </WorkspaceSurface>

            <WorkspaceSurface
              bodyClassName="space-y-3"
              className="lg:col-span-2 xl:col-span-3"
              description="Latest operational changes across the active workspace."
              title="Recent audit activity"
            >
              {activityQuery.isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <LoadingBlock key={index} className="h-24" />
                ))
              ) : activityQuery.error ? (
                <EmptyListState message="Unable to load recent activity." />
              ) : activityQuery.data?.activities.length ? (
                activityQuery.data.activities.slice(0, 4).map((activity) => {
                  const href = activityHref(activity);
                  const content = (
                    <div className="rounded-[1.15rem] border border-border bg-white/80 p-4">
                      <p className="font-medium">{activity.description}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {activity.actor?.name ?? "System"} • {formatDate(activity.createdAt)}
                      </p>
                    </div>
                  );

                  return href ? (
                    <Link className="block hover:bg-muted/60" key={activity.id} to={href}>
                      {content}
                    </Link>
                  ) : (
                    <div key={activity.id}>{content}</div>
                  );
                })
              ) : (
                <EmptyListState message="No recent activity." />
              )}
            </WorkspaceSurface>
          </section>
        </>
      ) : null}
    </div>
  );
}
