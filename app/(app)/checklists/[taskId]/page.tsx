import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { TaskCommentForm } from "@/components/tasks/task-comment-form";
import { TaskDetailForm } from "@/components/tasks/task-detail-form";
import { TaskDocumentManager } from "@/components/tasks/task-document-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/server/authz";
import { getTaskDetail } from "@/server/tasks";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function TaskDetailPage({
  params
}: {
  params: { taskId: string };
}) {
  const session = await requireSession();
  const [task, users, sections, phases, dependencyCandidates, availableDocuments] = await Promise.all([
    getTaskDetail(params.taskId),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" }
    }),
    prisma.section.findMany({
      select: { id: true, title: true },
      orderBy: { sortOrder: "asc" }
    }),
    prisma.timelinePhase.findMany({
      select: { id: true, title: true },
      orderBy: { sortOrder: "asc" }
    }),
    prisma.task.findMany({
      where: {
        id: { not: params.taskId },
        archivedAt: null
      },
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
        assignedTo: {
          select: {
            name: true
          }
        }
      },
      orderBy: [{ title: "asc" }]
    }),
    prisma.document.findMany({
      where: {
        taskAttachments: {
          none: {
            taskId: params.taskId
          }
        }
      },
      select: {
        id: true,
        title: true,
        category: true,
        createdAt: true,
        linkedTask: {
          select: {
            title: true
          }
        }
      },
      orderBy: [{ createdAt: "desc" }],
      take: 100
    })
  ]);

  if (!task) {
    notFound();
  }

  const canManageTaskDocuments =
    session.user.role === "OWNER_ADMIN" || task.assignedToId === session.user.id;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Task Detail"
        description="Edit task status, ownership, section/phase placement, due dates, notes, and subtasks while reviewing dependencies and comments with server-side validation."
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <TaskDetailForm
          currentRole={session.user.role}
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
                <div className="border-t border-border px-4 py-4 space-y-4">
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
                          <p className="mt-2 text-sm text-muted-foreground">{comment.content}</p>
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
