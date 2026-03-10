import Link from "next/link";

import { SectionProgress } from "@/components/dashboard/section-progress";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData } from "@/server/dashboard";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Track SALT progress, budget health, upcoming deadlines, document activity, and launch readiness from one protected workspace."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Overall completion"
          value={formatPercent(data.overallCompletion)}
          detail={`${data.recentlyCompletedTasks.length} recently completed tasks`}
        />
        <SummaryCard
          title="Overdue tasks"
          value={String(data.overdueTasks.length)}
          detail={`${data.blockedTasks.length} blocked items need attention`}
        />
        <SummaryCard
          title="Estimated budget"
          value={formatCurrency(data.budgetSummary.estimatedTotal)}
          detail={`Actual spend ${formatCurrency(data.budgetSummary.actualTotal)}`}
        />
        <SummaryCard
          title="Must-have vs optional"
          value={formatCurrency(data.budgetSummary.mustHaveTotal)}
          detail={`Optional ${formatCurrency(data.budgetSummary.optionalTotal)}`}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <SectionProgress sections={data.sectionProgress} />
        <Card>
          <CardHeader>
            <CardTitle>Timeline Progress by Phase</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.phases.map((phase) => {
              const completeTasks = phase.tasks.filter((task) => task.status === "COMPLETE").length;
              const percent = phase.tasks.length ? (completeTasks / phase.tasks.length) * 100 : 0;

              return (
                <div key={phase.id} className="space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{phase.title}</p>
                    <Badge variant={phase.status === "BLOCKED" ? "danger" : phase.status === "COMPLETE" ? "success" : "secondary"}>
                      {phase.status.replaceAll("_", " ")}
                    </Badge>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(phase.startDate)} to {formatDate(phase.endDate)}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.upcomingTasks.map((task) => (
              <Link key={task.id} href={`/checklists/${task.id}`} className="block rounded-lg border border-border p-3 hover:bg-muted/60">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{task.title}</p>
                  <Badge variant="outline">{task.section.title}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Due {formatDate(task.dueDate)} • {task.assignedTo?.name ?? "Unassigned"}
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentDocuments.map((document) => (
              <div key={document.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{document.title}</p>
                  <Badge variant="secondary">{document.category.replaceAll("_", " ")}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Added by {document.uploadedBy.name} on {formatDate(document.createdAt)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Message Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentMessages.map((message) => (
              <div key={message.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{message.thread.title}</p>
                  <p className="text-xs text-muted-foreground">{message.author.name}</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{message.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Overdue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.overdueTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No overdue tasks.</p>
            ) : (
              data.overdueTasks.map((task) => (
                <div key={task.id} className="rounded-lg border border-danger/20 bg-danger/5 p-3">
                  <p className="font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground">Due {formatDate(task.dueDate)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Blocked</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.blockedTasks.map((task) => (
              <div key={task.id} className="rounded-lg border border-warning/30 bg-warning/10 p-3">
                <p className="font-medium">{task.title}</p>
                <p className="text-xs text-muted-foreground">{task.blockedReason || "Blocked"}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Audit Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.activities.map((activity) => (
              <div key={activity.id} className="rounded-lg border border-border p-3">
                <p className="font-medium">{activity.description}</p>
                <p className="text-xs text-muted-foreground">
                  {activity.actor?.name ?? "System"} • {formatDate(activity.createdAt)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
