"use client";

import Link from "next/link";
import { Priority, Role, TaskStatus } from "@prisma/client";

import { TaskCommentForm } from "@/components/tasks/task-comment-form";
import { TaskDetailForm } from "@/components/tasks/task-detail-form";
import { TaskDocumentManager } from "@/components/tasks/task-document-manager";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type SerializedTaskWorkspaceData } from "@/lib/checklist-workspace";
import { cn, formatDate } from "@/lib/utils";

type TaskDetailNavigation = {
  closeHref?: string;
  closeLabel?: string;
  fullPageHref?: string;
  previousTaskHref?: string;
  nextTaskHref?: string;
  contextLabel?: string;
  onClose?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
};

type TaskSummaryPatch = {
  title?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string | null;
};

function NavigationAction({
  label,
  href,
  onClick,
  variant = "ghost"
}: {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "ghost" | "outline";
}) {
  if (onClick) {
    return (
      <Button onClick={onClick} type="button" variant={variant} size="sm">
        {label}
      </Button>
    );
  }

  if (href) {
    return (
      <Link className={cn(buttonVariants({ variant, size: "sm" }))} href={href} scroll={false}>
        {label}
      </Link>
    );
  }

  return null;
}

export function TaskDetailContent({
  data,
  currentRole,
  currentUserId,
  currentUserName,
  compact = false,
  navigation,
  notFoundBehavior = "page",
  onTaskSummaryChange,
  onCommentAdd
}: {
  data: SerializedTaskWorkspaceData;
  currentRole: Role;
  currentUserId: string;
  currentUserName?: string;
  compact?: boolean;
  navigation?: TaskDetailNavigation;
  notFoundBehavior?: "page" | "card";
  onTaskSummaryChange?: (patch: TaskSummaryPatch) => void;
  onCommentAdd?: (content: string, authorName?: string) => void;
}) {
  const task = data.task;

  if (!task) {
    const containerClassName =
      notFoundBehavior === "card"
        ? "rounded-[1.5rem] border border-border/80 bg-card/95 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.5)]"
        : "";

    return (
      <Card className={containerClassName}>
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
      <Card className={compact ? "rounded-[1.5rem] border-border/80 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.5)]" : ""}>
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
              <NavigationAction
                href={navigation.closeHref}
                label={navigation.closeLabel ?? "Back"}
                onClick={navigation.onClose}
                variant="outline"
              />
              <NavigationAction
                href={navigation.previousTaskHref}
                label="Previous"
                onClick={navigation.onPrevious}
              />
              <NavigationAction
                href={navigation.nextTaskHref}
                label="Next"
                onClick={navigation.onNext}
              />
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
          dependencyCandidates={data.dependencyCandidates as never}
          onTaskSummaryChange={onTaskSummaryChange}
          phases={data.phases as never}
          sections={data.sections as never}
          task={task as never}
          users={data.users as never}
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
                    availableDocuments={data.availableDocuments as never}
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
                  <TaskCommentForm
                    currentUserName={currentUserName}
                    onCommentAdd={onCommentAdd}
                    taskId={task.id}
                  />
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
