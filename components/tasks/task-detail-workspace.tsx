import Link from "next/link";
import { Role } from "@prisma/client";
import { notFound } from "next/navigation";

import { TaskCommentForm } from "@/components/tasks/task-comment-form";
import { TaskDetailForm } from "@/components/tasks/task-detail-form";
import { TaskDocumentManager } from "@/components/tasks/task-document-manager";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";
import { getTaskWorkspaceData } from "@/server/tasks";

type TaskDetailNavigation = {
  closeHref?: string;
  closeLabel?: string;
  fullPageHref?: string;
  previousTaskHref?: string;
  nextTaskHref?: string;
  contextLabel?: string;
};

export async function TaskDetailWorkspace({
  taskId,
  currentRole,
  currentUserId,
  compact = false,
  navigation,
  notFoundBehavior = "page"
}: {
  taskId: string;
  currentRole: Role;
  currentUserId: string;
  compact?: boolean;
  navigation?: TaskDetailNavigation;
  notFoundBehavior?: "page" | "card";
}) {
  const { task, users, sections, phases, dependencyCandidates, availableDocuments } =
    await getTaskWorkspaceData(taskId);

  if (!task) {
    if (notFoundBehavior === "page") {
      notFound();
    }

    return (
      <Card>
        <CardContent className="p-6">
          <p className="font-medium">Task unavailable</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This task no longer matches the current workspace context or may have been removed.
          </p>
        </CardContent>
      </Card>
    );
  }

  const canManageTaskDocuments =
    currentRole === Role.OWNER_ADMIN || task.assignedToId === currentUserId;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {navigation?.contextLabel ?? "Task workspace"}
              </p>
              <CardTitle className={cn(compact ? "text-xl" : "text-2xl")}>{task.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {task.section.title} • Due {formatDate(task.dueDate)} •{" "}
                {task.assignedTo?.name ?? "Unassigned"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  task.status === "COMPLETE"
                    ? "success"
                    : task.status === "BLOCKED"
                      ? "warning"
                      : "secondary"
                }
              >
                {task.status.replaceAll("_", " ")}
              </Badge>
              <Badge variant="outline">{task.priority}</Badge>
              {task.archivedAt ? <Badge variant="outline">Archived</Badge> : null}
            </div>
          </div>

          {navigation ? (
            <div className="flex flex-wrap gap-2">
              {navigation.closeHref ? (
                <Link
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  href={navigation.closeHref}
                >
                  {navigation.closeLabel ?? "Back"}
                </Link>
              ) : null}
              {navigation.previousTaskHref ? (
                <Link
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                  href={navigation.previousTaskHref}
                  scroll={false}
                >
                  Previous
                </Link>
              ) : null}
              {navigation.nextTaskHref ? (
                <Link
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                  href={navigation.nextTaskHref}
                  scroll={false}
                >
                  Next
                </Link>
              ) : null}
              {navigation.fullPageHref ? (
                <Link
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                  href={navigation.fullPageHref}
                >
                  Open full page
                </Link>
              ) : null}
            </div>
          ) : null}
        </CardHeader>
      </Card>

      <div className={cn("grid gap-6", compact ? "grid-cols-1" : "xl:grid-cols-[1.2fr_0.8fr]")}>
        <TaskDetailForm
          currentRole={currentRole}
          phases={phases}
          sections={sections}
          dependencyCandidates={dependencyCandidates}
          task={task as never}
          users={users}
        />
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Task Workspace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <details className="rounded-xl border border-border bg-secondary/10" open>
                <summary className="cursor-pointer list-none px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">Documents</p>
                      <p className="text-sm text-muted-foreground">
                        Keep task-linked files close to the operational work.
                      </p>
                    </div>
                    <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Toggle
                    </span>
                  </div>
                </summary>
                <div className="border-t border-border px-4 py-4">
                  <TaskDocumentManager
                    attachments={task.attachments as never}
                    availableDocuments={availableDocuments}
                    canManageDocuments={canManageTaskDocuments}
                    isArchived={Boolean(task.archivedAt)}
                    taskId={task.id}
                  />
                </div>
              </details>

              <details className="rounded-xl border border-border bg-secondary/10" open>
                <summary className="cursor-pointer list-none px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">Comments</p>
                      <p className="text-sm text-muted-foreground">
                        Capture the latest update, handoff note, or blocker discussion.
                      </p>
                    </div>
                    <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Toggle
                    </span>
                  </div>
                </summary>
                <div className="space-y-4 border-t border-border px-4 py-4">
                  <TaskCommentForm taskId={task.id} />
                  <div className="space-y-3">
                    {task.comments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No comments yet. Add the latest operational note or decision here.
                      </p>
                    ) : (
                      task.comments.map((comment) => (
                        <div key={comment.id} className="rounded-lg border border-border p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium">{comment.author.name}</p>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {comment.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </details>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
