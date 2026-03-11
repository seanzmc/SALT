import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { TaskCreateForm } from "@/components/tasks/task-create-form";
import { TaskBoard } from "@/components/tasks/task-board";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskListManager } from "@/components/tasks/task-list-manager";
import { TaskQueueShortcuts } from "@/components/tasks/task-queue-shortcuts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { getTaskList } from "@/server/tasks";
import { requireSession } from "@/server/authz";
import { cn } from "@/lib/utils";

export default async function ChecklistsPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await requireSession();
  const current = {
    q: typeof searchParams.q === "string" ? searchParams.q : "",
    status: typeof searchParams.status === "string" ? searchParams.status : "ALL",
    section: typeof searchParams.section === "string" ? searchParams.section : "",
    priority: typeof searchParams.priority === "string" ? searchParams.priority : "",
    assignee: typeof searchParams.assignee === "string" ? searchParams.assignee : "",
    queue: typeof searchParams.queue === "string" ? searchParams.queue : "all",
    archived: typeof searchParams.archived === "string" ? searchParams.archived : "active",
    group: typeof searchParams.group === "string" ? searchParams.group : "none",
    sort: typeof searchParams.sort === "string" ? searchParams.sort : "dueDate",
    view: typeof searchParams.view === "string" ? searchParams.view : "list",
    cleanup: typeof searchParams.cleanup === "string" ? searchParams.cleanup : "",
    bulk: typeof searchParams.bulk === "string" ? searchParams.bulk : ""
  };

  const cleanupMode =
    current.cleanup === "1" &&
    ["overdue", "blocked", "unassigned", "stale", "upcoming"].includes(current.queue)
      ? (current.queue as "overdue" | "blocked" | "unassigned" | "stale" | "upcoming")
      : null;

  const cleanupTitle =
    cleanupMode === "overdue"
      ? "Overdue cleanup"
      : cleanupMode === "blocked"
        ? "Blocked cleanup"
        : cleanupMode === "unassigned"
          ? "Assignment cleanup"
          : cleanupMode === "stale"
            ? "Needs update cleanup"
            : cleanupMode === "upcoming"
              ? "Upcoming work cleanup"
              : null;

  const cleanupDescription =
    cleanupMode === "overdue"
      ? "You came from the dashboard overdue card. This view is already in list mode so you can select visible work and use bulk due-date or status updates."
      : cleanupMode === "blocked"
        ? "You came from the blocked attention card. Review the visible tasks, then use bulk status updates once blockers are resolved."
        : cleanupMode === "unassigned"
          ? "You came from the unassigned attention card. Select visible tasks and use bulk assign to clear ownership gaps quickly."
          : cleanupMode === "stale"
            ? "You came from the needs update attention card. Review stale work, then bulk-update status or ownership as needed."
            : cleanupMode === "upcoming"
              ? "You came from the due-this-week attention card. Use this list view to rebalance ownership and dates before deadlines slip."
              : null;

  const { tasks, sections, users, phases, queueCounts } = await getTaskList({
    q: current.q,
    status: current.status as never,
    section: current.section,
    priority: current.priority,
    assignee: current.assignee,
    queue: current.queue as never,
    archived: current.archived as never,
    currentUserId: session.user.id,
    sort: current.sort as never
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Checklist & Task Management"
        description="List and board views use the planning guide sections as the operating backbone, including master opening items, risks, room procurement, and Florida/Lakeland verification reminders."
        actions={
          <div className="flex gap-2">
            <Link className={cn(buttonVariants({ variant: current.view === "list" ? "default" : "outline" }))} href={`/checklists?${new URLSearchParams({ ...current, view: "list" }).toString()}`}>
              List view
            </Link>
            <Link className={cn(buttonVariants({ variant: current.view === "board" ? "default" : "outline" }))} href={`/checklists?${new URLSearchParams({ ...current, view: "board" }).toString()}`}>
              Board view
            </Link>
            <Link className={cn(buttonVariants({ variant: "outline" }))} href="/api/export/tasks">
              Export CSV
            </Link>
          </div>
        }
      />

      <TaskCreateForm
        currentRole={session.user.role}
        phases={phases}
        sections={sections.map((section) => ({ id: section.id, title: section.title }))}
        users={users}
      />

      <TaskFilters sections={sections} users={users} current={current} />

      <TaskQueueShortcuts counts={queueCounts} current={current} />

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{tasks.length} tasks shown</Badge>
        <Badge variant="outline">
          Sections: {[...new Set(tasks.map((task) => task.section.title))].length}
        </Badge>
        <Badge variant="outline">Queue: {current.queue.replaceAll("-", " ")}</Badge>
        <Badge variant="outline">Archive: {current.archived}</Badge>
      </div>

      {cleanupMode && current.view === "list" ? (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium">{cleanupTitle}</p>
              <p className="text-sm text-muted-foreground">{cleanupDescription}</p>
            </div>
            <Link
              className={cn(buttonVariants({ variant: "outline" }))}
              href={`/checklists?${new URLSearchParams({
                ...current,
                cleanup: "0"
              }).toString()}`}
            >
              Exit cleanup mode
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks match the current filters"
          description="Reset the filters or search terms to reveal the seeded build-out checklist items."
        />
      ) : current.view === "board" && current.archived === "active" ? (
        <TaskBoard tasks={tasks as never} />
      ) : (
        <TaskListManager
          archiveView={current.archived as "active" | "archived" | "all"}
          cleanupMode={cleanupMode}
          currentRole={session.user.role}
          groupBy={current.group as "none" | "section"}
          preferredBulkAction={
            current.bulk === "assign" ||
            current.bulk === "status" ||
            current.bulk === "setDueDate" ||
            current.bulk === "shiftDueDate" ||
            current.bulk === "clearAssignee" ||
            current.bulk === "priority" ||
            current.bulk === "markComplete" ||
            current.bulk === "archive" ||
            current.bulk === "restore"
              ? current.bulk
              : undefined
          }
          tasks={tasks as never}
          users={users}
        />
      )}
    </div>
  );
}
