import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { TaskCreateForm } from "@/components/tasks/task-create-form";
import { TaskBoard } from "@/components/tasks/task-board";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskListManager } from "@/components/tasks/task-list-manager";
import { TaskQueueShortcuts } from "@/components/tasks/task-queue-shortcuts";
import { Badge } from "@/components/ui/badge";
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
    view: typeof searchParams.view === "string" ? searchParams.view : "list"
  };

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

      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks match the current filters"
          description="Reset the filters or search terms to reveal the seeded build-out checklist items."
        />
      ) : current.view === "board" && current.archived === "active" ? (
        <TaskBoard tasks={tasks as never} />
      ) : (
        <TaskListManager
          currentRole={session.user.role}
          groupBy={current.group as "none" | "section"}
          tasks={tasks as never}
          users={users}
        />
      )}
    </div>
  );
}
