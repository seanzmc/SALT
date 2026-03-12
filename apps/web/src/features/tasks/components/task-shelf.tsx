import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type {
  SessionPayload,
  TaskArchiveInput,
  TaskCommentCreateInput,
  TaskDependencyCreateInput,
  TaskWorkspaceData,
  TaskWorkspaceSubtask,
  TaskSubtaskArchiveInput,
  TaskSubtaskCreateInput,
  TaskSubtaskDeleteInput,
  TaskSubtaskUpdateInput,
  TaskWorkspaceUpdateInput
} from "@salt/types";
import { taskCommentCreateSchema } from "@salt/validation";
import { z } from "zod";

type TaskShelfProps = {
  currentUser: SessionPayload["user"];
  data: TaskWorkspaceData;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onSubmitTaskUpdate: (payload: TaskWorkspaceUpdateInput) => Promise<void>;
  onSubmitComment: (payload: TaskCommentCreateInput) => Promise<void>;
  onCreateSubtask: (payload: TaskSubtaskCreateInput) => Promise<void>;
  onUpdateSubtask: (payload: TaskSubtaskUpdateInput) => Promise<void>;
  onDeleteSubtask: (payload: TaskSubtaskDeleteInput) => Promise<void>;
  onArchiveSubtask: (payload: TaskSubtaskArchiveInput) => Promise<void>;
  onRestoreSubtask: (payload: TaskSubtaskArchiveInput) => Promise<void>;
  onAddDependency: (payload: TaskDependencyCreateInput) => Promise<void>;
  onRemoveDependency: (payload: { taskId: string; dependsOnTaskId: string }) => Promise<void>;
  onArchiveTask: (payload: TaskArchiveInput) => Promise<void>;
  onRestoreTask: (payload: TaskArchiveInput) => Promise<void>;
  isSavingTask: boolean;
  isPostingComment: boolean;
  isSavingSubtask: boolean;
  isSavingDependency: boolean;
  isArchivingTask: boolean;
  taskError?: string;
  commentError?: string;
  subtaskError?: string;
  dependencyError?: string;
  archiveError?: string;
};

type TaskFormValues = {
  status: "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "COMPLETE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  assignedToId: string;
  blockedReason: string;
};

type SubtaskFormValues = {
  title: string;
  notes: string;
  dueDate: string;
  assignedToId: string;
  isComplete: boolean;
};

const taskWorkspaceFormSchema = z
  .object({
    status: z.enum(["NOT_STARTED", "IN_PROGRESS", "BLOCKED", "COMPLETE"]),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    assignedToId: z.string().optional().or(z.literal("")),
    blockedReason: z.string().max(300).optional().or(z.literal(""))
  })
  .superRefine((data, ctx) => {
    if (data.status === "BLOCKED" && !data.blockedReason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["blockedReason"],
        message: "Blocked reason is required when status is blocked."
      });
    }
  });

const taskCommentFormSchema = taskCommentCreateSchema.omit({ taskId: true });

const subtaskFormSchema = z.object({
  title: z.string().trim().min(2).max(180),
  notes: z.string().max(4000).optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  assignedToId: z.string().optional().or(z.literal("")),
  isComplete: z.boolean()
});

const createSubtaskFormSchema = subtaskFormSchema;

const dependencyFormSchema = z.object({
  dependsOnTaskId: z.string().cuid()
});

function formatDate(value: string | null) {
  if (!value) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function toDateInputValue(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function SubtaskCard({
  currentUser,
  taskAssignedToId,
  users,
  subtask,
  isPending,
  onSubmit,
  onDelete,
  onArchive,
  onRestore
}: {
  currentUser: SessionPayload["user"];
  taskAssignedToId: string | null;
  users: TaskWorkspaceData["users"];
  subtask: TaskWorkspaceSubtask;
  isPending: boolean;
  onSubmit: (payload: TaskSubtaskUpdateInput) => Promise<void>;
  onDelete: (payload: TaskSubtaskDeleteInput) => Promise<void>;
  onArchive: (payload: TaskSubtaskArchiveInput) => Promise<void>;
  onRestore: (payload: TaskSubtaskArchiveInput) => Promise<void>;
}) {
  const canEdit =
    currentUser.role === "OWNER_ADMIN" ||
    subtask.assignedToId === currentUser.id ||
    taskAssignedToId === currentUser.id;
  const canChangeAssignee = currentUser.role === "OWNER_ADMIN";
  const canArchive = currentUser.role === "OWNER_ADMIN";

  const form = useForm<SubtaskFormValues>({
    resolver: zodResolver(subtaskFormSchema),
    values: {
      title: subtask.title,
      notes: subtask.notes ?? "",
      dueDate: toDateInputValue(subtask.dueDate),
      assignedToId: subtask.assignedToId ?? "",
      isComplete: subtask.isComplete
    }
  });

  return (
    <form
      className={[
        "rounded-[1.25rem] border p-4",
        subtask.archivedAt ? "border-border bg-muted/35" : "border-border bg-card"
      ].join(" ")}
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit({
          subtaskId: subtask.id,
          title: values.title,
          notes: values.notes || null,
          dueDate: values.dueDate || null,
          assignedToId: canChangeAssignee ? values.assignedToId || null : subtask.assignedToId,
          isComplete: values.isComplete,
          sortOrder: subtask.sortOrder
        });
      })}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{subtask.title}</p>
          <p className="text-xs text-muted-foreground">
            Due {formatDate(subtask.dueDate)} • {subtask.assignedTo?.name ?? "Unassigned"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {subtask.archivedAt ? (
            <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
              Archived
            </span>
          ) : null}
          <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
            {subtask.isComplete ? "Complete" : "Pending"}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="space-y-2 md:col-span-2">
          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Title
          </span>
          <input
            className="w-full rounded-2xl border border-border bg-white px-4 py-3 disabled:bg-muted"
            disabled={!canEdit}
            {...form.register("title")}
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Status
          </span>
          <select
            className="w-full rounded-2xl border border-border bg-white px-4 py-3 disabled:bg-muted"
            disabled={!canEdit}
            onChange={(event) =>
              form.setValue("isComplete", event.target.value === "true", {
                shouldDirty: true
              })
            }
            value={form.watch("isComplete") ? "true" : "false"}
          >
            <option value="false">Pending</option>
            <option value="true">Complete</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Due date
          </span>
          <input
            className="w-full rounded-2xl border border-border bg-white px-4 py-3 disabled:bg-muted"
            disabled={!canEdit}
            type="date"
            {...form.register("dueDate")}
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Assignee
          </span>
          <select
            className="w-full rounded-2xl border border-border bg-white px-4 py-3 disabled:bg-muted"
            disabled={!canChangeAssignee}
            {...form.register("assignedToId")}
          >
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          disabled={!canEdit || isPending}
          type="submit"
        >
          {isPending ? "Saving…" : "Save item"}
        </button>
        <button
          className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground disabled:opacity-60"
          disabled={!canEdit || isPending}
          onClick={async () => {
            if (!window.confirm("Delete this checklist item?")) {
              return;
            }

            await onDelete({ subtaskId: subtask.id });
          }}
          type="button"
        >
          Delete
        </button>
        {canArchive ? (
          <button
            className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground disabled:opacity-60"
            disabled={isPending}
            onClick={async () => {
              if (subtask.archivedAt) {
                await onRestore({ subtaskId: subtask.id });
                return;
              }

              await onArchive({ subtaskId: subtask.id });
            }}
            type="button"
          >
            {subtask.archivedAt ? "Restore item" : "Archive item"}
          </button>
        ) : null}
      </div>
    </form>
  );
}

export function TaskShelf({
  currentUser,
  data,
  onClose,
  onNext,
  onPrevious,
  onSubmitTaskUpdate,
  onSubmitComment,
  onCreateSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  onArchiveSubtask,
  onRestoreSubtask,
  onAddDependency,
  onRemoveDependency,
  onArchiveTask,
  onRestoreTask,
  isSavingTask,
  isPostingComment,
  isSavingSubtask,
  isSavingDependency,
  isArchivingTask,
  taskError,
  commentError,
  subtaskError,
  dependencyError,
  archiveError
}: TaskShelfProps) {
  const task = data.task;

  const taskForm = useForm<TaskFormValues>({
    resolver: zodResolver(taskWorkspaceFormSchema),
    values: task
      ? {
          status: task.status,
          priority: task.priority,
          assignedToId: task.assignedToId ?? "",
          blockedReason: task.blockedReason ?? ""
        }
      : {
          status: "NOT_STARTED",
          priority: "MEDIUM",
          assignedToId: "",
          blockedReason: ""
        }
  });

  const commentForm = useForm<z.infer<typeof taskCommentFormSchema>>({
    resolver: zodResolver(taskCommentFormSchema),
    defaultValues: {
      content: ""
    }
  });

  const createSubtaskForm = useForm<z.infer<typeof createSubtaskFormSchema>>({
    resolver: zodResolver(createSubtaskFormSchema),
    defaultValues: {
      title: "",
      notes: "",
      dueDate: "",
      assignedToId: "",
      isComplete: false
    }
  });

  const dependencyForm = useForm<z.infer<typeof dependencyFormSchema>>({
    resolver: zodResolver(dependencyFormSchema),
    defaultValues: {
      dependsOnTaskId: ""
    }
  });

  useEffect(() => {
    commentForm.reset({ content: "" });
    createSubtaskForm.reset({
      title: "",
      notes: "",
      dueDate: "",
      assignedToId: "",
      isComplete: false
    });
    dependencyForm.reset({ dependsOnTaskId: "" });
  }, [commentForm, createSubtaskForm, dependencyForm, task?.id]);

  if (!task) {
    return (
      <section className="rounded-[1.75rem] border border-border bg-card/90 p-5 shadow-sm">
        <p className="font-medium">Task unavailable.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          This task may have been removed or is outside the current workspace context.
        </p>
      </section>
    );
  }

  const canChangeAssignee = currentUser.role === "OWNER_ADMIN";
  const canEditTask =
    currentUser.role === "OWNER_ADMIN" || task.assignedToId === currentUser.id;
  const activeSubtasks = task.subtasks.filter((subtask) => !subtask.archivedAt);
  const archivedSubtasks = task.subtasks.filter((subtask) => subtask.archivedAt);
  const existingDependencyIds = new Set(task.dependencies.map((dependency) => dependency.id));
  const availableDependencyCandidates = task.dependencyCandidates.filter(
    (candidate) => !existingDependencyIds.has(candidate.id)
  );

  return (
    <section className="rounded-[1.75rem] border border-border bg-card/95 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.45)] xl:sticky xl:top-6">
      <div className="border-b border-border px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Task shelf
            </p>
            <h3 className="mt-2 text-2xl font-semibold">{task.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {task.section.title} • Due {formatDate(task.dueDate)} •{" "}
              {task.assignedTo?.name ?? "Unassigned"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {task.archivedAt ? (
              <span className="rounded-full border border-border px-3 py-2 text-sm text-muted-foreground">
                Archived
              </span>
            ) : null}
            <button
              className="rounded-full border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
            <button
              className="rounded-full border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted disabled:opacity-50"
              disabled={!onPrevious}
              onClick={onPrevious}
              type="button"
            >
              Previous
            </button>
            <button
              className="rounded-full border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted disabled:opacity-50"
              disabled={!onNext}
              onClick={onNext}
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-5">
        <form
          className="space-y-4 rounded-[1.5rem] border border-border bg-white p-4"
          onSubmit={taskForm.handleSubmit(async (values) => {
            await onSubmitTaskUpdate({
              taskId: task.id,
              status: values.status,
              priority: values.priority,
              assignedToId: canChangeAssignee ? values.assignedToId || null : task.assignedToId,
              blockedReason: values.blockedReason || null
            });
          })}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Task state</p>
              <p className="text-sm text-muted-foreground">
                Update the operational state without leaving the queue.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentUser.role === "OWNER_ADMIN" ? (
                <button
                  className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground disabled:opacity-60"
                  disabled={isArchivingTask}
                  onClick={async () => {
                    if (task.archivedAt) {
                      await onRestoreTask({ taskId: task.id });
                      return;
                    }

                    await onArchiveTask({ taskId: task.id });
                  }}
                  type="button"
                >
                  {isArchivingTask
                    ? task.archivedAt
                      ? "Restoring…"
                      : "Archiving…"
                    : task.archivedAt
                      ? "Restore task"
                      : "Archive task"}
                </button>
              ) : null}
              <button
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                disabled={isSavingTask}
                type="submit"
              >
                {isSavingTask ? "Saving…" : "Save"}
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Status
              </span>
              <select
                className="w-full rounded-2xl border border-border bg-card px-4 py-3"
                {...taskForm.register("status")}
              >
                <option value="NOT_STARTED">Not started</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="BLOCKED">Blocked</option>
                <option value="COMPLETE">Complete</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Priority
              </span>
              <select
                className="w-full rounded-2xl border border-border bg-card px-4 py-3"
                {...taskForm.register("priority")}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Assignee
              </span>
              <select
                className="w-full rounded-2xl border border-border bg-card px-4 py-3 disabled:bg-muted"
                disabled={!canChangeAssignee}
                {...taskForm.register("assignedToId")}
              >
                <option value="">Unassigned</option>
                {data.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role === "OWNER_ADMIN" ? "Owner" : "Collaborator"})
                  </option>
                ))}
              </select>
              {!canChangeAssignee ? (
                <p className="text-sm text-muted-foreground">
                  Only owner admins can change assignment.
                </p>
              ) : null}
            </label>

            {taskForm.watch("status") === "BLOCKED" ? (
              <label className="space-y-2 md:col-span-2">
                <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Blocked reason
                </span>
                <textarea
                  className="min-h-28 w-full rounded-2xl border border-border bg-card px-4 py-3"
                  {...taskForm.register("blockedReason")}
                />
              </label>
            ) : null}
          </div>

          {taskForm.formState.errors.blockedReason?.message ? (
            <p className="text-sm text-red-700">
              {taskForm.formState.errors.blockedReason.message}
            </p>
          ) : null}

          {task.archivedAt ? (
            <p className="text-sm text-muted-foreground">
              This task is archived and hidden from normal active queues. Restore it to resume
              active work.
            </p>
          ) : null}

          {taskError ? <p className="text-sm text-red-700">{taskError}</p> : null}
          {archiveError ? <p className="text-sm text-red-700">{archiveError}</p> : null}
        </form>

        <section className="rounded-[1.5rem] border border-border bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Dependencies</p>
              <p className="text-sm text-muted-foreground">
                Add blockers and review downstream work without leaving the shelf.
              </p>
            </div>
          </div>

          {!task.archivedAt ? (
            <form
              className="mt-4 flex flex-col gap-3 md:flex-row"
              onSubmit={dependencyForm.handleSubmit(async (values) => {
                await onAddDependency({
                  taskId: task.id,
                  dependsOnTaskId: values.dependsOnTaskId
                });
              })}
            >
              <select
                className="w-full rounded-2xl border border-border bg-card px-4 py-3 md:flex-1"
                disabled={!canEditTask || availableDependencyCandidates.length === 0}
                {...dependencyForm.register("dependsOnTaskId")}
              >
                <option value="">Select a dependency</option>
                {availableDependencyCandidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.title}
                  </option>
                ))}
              </select>
              <button
                className="rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
                disabled={!canEditTask || isSavingDependency || availableDependencyCandidates.length === 0}
                type="submit"
              >
                {isSavingDependency ? "Adding…" : "Add dependency"}
              </button>
            </form>
          ) : null}

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                This task depends on
              </p>
              {task.dependencies.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/35 p-4 text-sm text-muted-foreground">
                  No dependencies yet.
                </div>
              ) : (
                task.dependencies.map((dependency) => (
                  <div key={dependency.id} className="rounded-2xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{dependency.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {dependency.assignedTo?.name ?? "Unassigned"} • Due{" "}
                          {formatDate(dependency.dueDate)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                          {dependency.status.replaceAll("_", " ")}
                        </span>
                        <button
                          className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground disabled:opacity-60"
                          disabled={!canEditTask || isSavingDependency}
                          onClick={async () => {
                            await onRemoveDependency({
                              taskId: task.id,
                              dependsOnTaskId: dependency.id
                            });
                          }}
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Tasks waiting on this one
              </p>
              {task.dependents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/35 p-4 text-sm text-muted-foreground">
                  No dependent tasks yet.
                </div>
              ) : (
                task.dependents.map((dependency) => (
                  <div key={dependency.id} className="rounded-2xl border border-border p-4">
                    <p className="font-medium">{dependency.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {dependency.assignedTo?.name ?? "Unassigned"} • Due{" "}
                      {formatDate(dependency.dueDate)} • {dependency.status.replaceAll("_", " ")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {dependencyForm.formState.errors.dependsOnTaskId?.message ? (
            <p className="mt-3 text-sm text-red-700">
              {dependencyForm.formState.errors.dependsOnTaskId.message}
            </p>
          ) : null}

          {dependencyError ? <p className="mt-3 text-sm text-red-700">{dependencyError}</p> : null}
        </section>

        <section className="rounded-[1.5rem] border border-border bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Checklist</p>
              <p className="text-sm text-muted-foreground">
                Create, update, archive, and restore checklist items inside the same workspace.
              </p>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              {activeSubtasks.length} active • {archivedSubtasks.length} archived
            </span>
          </div>

          {!task.archivedAt ? (
            <form
              className="mt-4 grid gap-3 rounded-[1.25rem] border border-border bg-card p-4 md:grid-cols-2"
              onSubmit={createSubtaskForm.handleSubmit(async (values) => {
                await onCreateSubtask({
                  taskId: task.id,
                  title: values.title,
                  notes: values.notes || null,
                  dueDate: values.dueDate || null,
                  assignedToId:
                    currentUser.role === "OWNER_ADMIN" ? values.assignedToId || null : null
                });
              })}
            >
              <label className="space-y-2 md:col-span-2">
                <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  New checklist item
                </span>
                <input
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3"
                  placeholder="Add a checklist item"
                  {...createSubtaskForm.register("title")}
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Due date
                </span>
                <input
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3"
                  type="date"
                  {...createSubtaskForm.register("dueDate")}
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Assignee
                </span>
                <select
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 disabled:bg-muted"
                  disabled={currentUser.role !== "OWNER_ADMIN"}
                  {...createSubtaskForm.register("assignedToId")}
                >
                  <option value="">
                    {currentUser.role === "OWNER_ADMIN" ? "Unassigned" : currentUser.name}
                  </option>
                  {data.users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="md:col-span-2 flex justify-end">
                <button
                  className="rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
                  disabled={
                    isSavingSubtask ||
                    (currentUser.role !== "OWNER_ADMIN" && task.assignedToId !== currentUser.id)
                  }
                  type="submit"
                >
                  {isSavingSubtask ? "Adding…" : "Add checklist item"}
                </button>
              </div>
            </form>
          ) : null}

          <div className="mt-4 space-y-4">
            {activeSubtasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/35 p-4 text-sm text-muted-foreground">
                No active checklist items yet.
              </div>
            ) : (
              activeSubtasks.map((subtask) => (
                <SubtaskCard
                  key={subtask.id}
                  currentUser={currentUser}
                  isPending={isSavingSubtask}
                  onArchive={onArchiveSubtask}
                  onDelete={onDeleteSubtask}
                  onRestore={onRestoreSubtask}
                  onSubmit={onUpdateSubtask}
                  subtask={subtask}
                  taskAssignedToId={task.assignedToId}
                  users={data.users}
                />
              ))
            )}
          </div>

          {archivedSubtasks.length > 0 ? (
            <div className="mt-6 space-y-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Archived items
              </p>
              {archivedSubtasks.map((subtask) => (
                <SubtaskCard
                  key={subtask.id}
                  currentUser={currentUser}
                  isPending={isSavingSubtask}
                  onArchive={onArchiveSubtask}
                  onDelete={onDeleteSubtask}
                  onRestore={onRestoreSubtask}
                  onSubmit={onUpdateSubtask}
                  subtask={subtask}
                  taskAssignedToId={task.assignedToId}
                  users={data.users}
                />
              ))}
            </div>
          ) : null}

          {subtaskError ? <p className="mt-3 text-sm text-red-700">{subtaskError}</p> : null}
        </section>

        <section className="rounded-[1.5rem] border border-border bg-white p-4">
          <p className="font-semibold">Comments</p>
          <form
            className="mt-4 space-y-3"
            onSubmit={commentForm.handleSubmit(async (values) => {
              await onSubmitComment({
                taskId: task.id,
                content: values.content
              });
            })}
          >
            <textarea
              className="min-h-28 w-full rounded-2xl border border-border bg-card px-4 py-3"
              placeholder="Capture context, decisions, or blocker notes"
              {...commentForm.register("content")}
            />
            <div className="flex items-center justify-between gap-3">
              {commentForm.formState.errors.content?.message ? (
                <p className="text-sm text-red-700">{commentForm.formState.errors.content.message}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Comments stay in the shelf so queue navigation remains uninterrupted.
                </p>
              )}
              <button
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                disabled={isPostingComment}
                type="submit"
              >
                {isPostingComment ? "Posting…" : "Post comment"}
              </button>
            </div>
            {commentError ? <p className="text-sm text-red-700">{commentError}</p> : null}
          </form>

          <div className="mt-4 space-y-3">
            {task.comments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/35 p-4 text-sm text-muted-foreground">
                No comments yet.
              </div>
            ) : (
              task.comments.map((comment) => (
                <article key={comment.id} className="rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{comment.author.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</p>
                  </div>
                  <p className="mt-2 text-sm text-foreground">{comment.content}</p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
