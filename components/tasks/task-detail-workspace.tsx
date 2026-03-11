import { Role } from "@prisma/client";
import { notFound } from "next/navigation";

import { TaskDetailContent } from "@/components/tasks/task-detail-content";
import { serializeTaskWorkspaceData } from "@/lib/checklist-workspace";
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
  currentUserName,
  compact = false,
  navigation,
  notFoundBehavior = "page"
}: {
  taskId: string;
  currentRole: Role;
  currentUserId: string;
  currentUserName?: string;
  compact?: boolean;
  navigation?: TaskDetailNavigation;
  notFoundBehavior?: "page" | "card";
}) {
  const data = await getTaskWorkspaceData(taskId);

  if (!data.task && notFoundBehavior === "page") {
    notFound();
  }

  return (
    <TaskDetailContent
      compact={compact}
      currentRole={currentRole}
      currentUserId={currentUserId}
      currentUserName={currentUserName}
      data={serializeTaskWorkspaceData(data)}
      navigation={navigation}
      notFoundBehavior={notFoundBehavior}
    />
  );
}
