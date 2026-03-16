import { PageHeader } from "@/components/layout/page-header";
import { TaskDetailWorkspace } from "@/components/tasks/task-detail-workspace";
import { requireSession } from "@/server/authz";

export default async function TaskDetailPage({
  params,
  searchParams
}: {
  params: { taskId: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await requireSession();
  const returnTo = typeof searchParams.returnTo === "string" ? searchParams.returnTo : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Task Detail"
        description="Edit task status, ownership, section/phase placement, due dates, notes, and subtasks while reviewing dependencies and comments with server-side validation."
      />
      <TaskDetailWorkspace
        currentRole={session.user.role}
        currentUserId={session.user.id}
        currentUserName={session.user.name ?? "User"}
        navigation={
          returnTo
            ? {
                closeHref: returnTo,
                closeLabel: "Back to checklist",
                contextLabel: "Checklist task detail"
              }
            : undefined
        }
        taskId={params.taskId}
      />
    </div>
  );
}
