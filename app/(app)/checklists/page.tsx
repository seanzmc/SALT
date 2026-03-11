import { PageHeader } from "@/components/layout/page-header";
import { ChecklistWorkspace } from "@/components/tasks/checklist-workspace";
import { TaskCreateForm } from "@/components/tasks/task-create-form";
import {
  getInitialChecklistState,
  serializeTaskWorkspaceData
} from "@/lib/checklist-workspace";
import { requireSession } from "@/server/authz";
import { getTaskList, getTaskWorkspaceData } from "@/server/tasks";

export default async function ChecklistsPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await requireSession();
  const current = getInitialChecklistState(searchParams);
  const selectedTaskId =
    current.view === "list" && typeof searchParams.taskId === "string" ? searchParams.taskId : "";

  const { tasks, sections, users, phases } = await getTaskList({
    archived: "all",
    currentUserId: session.user.id
  });

  const initialSelectedTaskData = selectedTaskId
    ? serializeTaskWorkspaceData(await getTaskWorkspaceData(selectedTaskId))
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Checklist & Task Management"
        description="List and board views use the planning guide sections as the operating backbone, including master opening items, risks, room procurement, and Florida/Lakeland verification reminders."
      />

      <TaskCreateForm
        currentRole={session.user.role}
        phases={phases}
        sections={sections.map((section) => ({ id: section.id, title: section.title }))}
        users={users}
      />

      <div className="-mx-4 md:-mx-6">
        <ChecklistWorkspace
          currentRole={session.user.role}
          currentUserId={session.user.id}
          initialSelectedTaskData={initialSelectedTaskData}
          initialSelectedTaskId={selectedTaskId || undefined}
          initialState={current}
          sections={sections.map((section) => ({ slug: section.slug, title: section.title }))}
          tasks={tasks as never}
          users={users}
        />
      </div>
    </div>
  );
}
