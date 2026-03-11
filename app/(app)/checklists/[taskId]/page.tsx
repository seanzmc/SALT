import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { TaskCommentForm } from "@/components/tasks/task-comment-form";
import { TaskDetailForm } from "@/components/tasks/task-detail-form";
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
  const [task, users, sections, phases] = await Promise.all([
    getTaskDetail(params.taskId),
    prisma.user.findMany({
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
    })
  ]);

  if (!task) {
    notFound();
  }

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
          task={task as never}
          users={users}
        />
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TaskCommentForm taskId={task.id} />
              <div className="space-y-3">
                {task.comments.map((comment) => (
                  <div key={comment.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{comment.author.name}</p>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{comment.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {task.attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No linked attachments yet.</p>
              ) : (
                task.attachments.map((attachment) => (
                  <div key={attachment.id} className="rounded-lg border border-border p-3">
                    <p className="font-medium">{attachment.document.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {attachment.document.category.replaceAll("_", " ")}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
