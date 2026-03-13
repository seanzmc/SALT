import type { SessionPayload, TaskWorkspaceData, TaskWorkspaceSubtask } from "@salt/types";

type TaskChecklistPreviewPanelProps = {
  currentUser: SessionPayload["user"];
  data?: TaskWorkspaceData;
  isLoading: boolean;
  isSavingSubtask: boolean;
  error?: string;
  onClose: () => void;
  onOpenTask: (taskId: string) => void;
  onToggleSubtask: (subtask: TaskWorkspaceSubtask) => Promise<void>;
};

function formatDate(value: string | null) {
  if (!value) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export function TaskChecklistPreviewPanel({
  currentUser,
  data,
  isLoading,
  isSavingSubtask,
  error,
  onClose,
  onOpenTask,
  onToggleSubtask
}: TaskChecklistPreviewPanelProps) {
  if (isLoading) {
    return (
      <div className="rounded-[1.25rem] border border-border bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
        Loading checklist preview...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  const task = data?.task;

  if (!task) {
    return null;
  }

  const activeSubtasks = task.subtasks.filter((subtask) => !subtask.archivedAt);
  const completeCount = activeSubtasks.filter((subtask) => subtask.isComplete).length;

  return (
    <section className="rounded-[1.25rem] border border-border/70 bg-white px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">{task.title}</p>
            <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Checklist {completeCount}/{activeSubtasks.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Review checklist work without leaving the queue.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
            onClick={() => onOpenTask(task.id)}
            type="button"
          >
            Open details
          </button>
          <button
            className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
            onClick={onClose}
            type="button"
          >
            Hide
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {activeSubtasks.length === 0 ? (
          <div className="rounded-[1rem] border border-dashed border-border bg-muted/25 px-4 py-4 text-sm text-muted-foreground">
            No active checklist items on this task.
          </div>
        ) : (
          activeSubtasks.map((subtask) => {
            const canToggle =
              !task.archivedAt &&
              (currentUser.role === "OWNER_ADMIN" ||
                task.assignedToId === currentUser.id ||
                subtask.assignedToId === currentUser.id);

            return (
              <label
                key={subtask.id}
                className="flex items-start gap-3 rounded-[1rem] border border-border/70 px-3 py-3"
              >
                <input
                  checked={subtask.isComplete}
                  className="mt-1 h-4 w-4 rounded border-border"
                  disabled={!canToggle || isSavingSubtask}
                  onChange={async () => {
                    await onToggleSubtask(subtask);
                  }}
                  type="checkbox"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">{subtask.title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {subtask.assignedTo?.name ?? "Unassigned"} • {formatDate(subtask.dueDate)}
                  </span>
                </span>
              </label>
            );
          })
        )}
      </div>
    </section>
  );
}
