import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { SessionPayload, TaskCommentCreateInput, TaskWorkspaceData, TaskWorkspaceUpdateInput } from "@salt/types";
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
  isSavingTask: boolean;
  isPostingComment: boolean;
  taskError?: string;
  commentError?: string;
};

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

export function TaskShelf({
  currentUser,
  data,
  onClose,
  onNext,
  onPrevious,
  onSubmitTaskUpdate,
  onSubmitComment,
  isSavingTask,
  isPostingComment,
  taskError,
  commentError
}: TaskShelfProps) {
  const task = data.task;

  const taskForm = useForm({
    resolver: zodResolver(taskWorkspaceFormSchema),
    values: task
      ? {
          status: task.status,
          priority: task.priority,
          assignedToId: task.assignedToId ?? "",
          blockedReason: task.blockedReason ?? ""
        }
      : {
          status: "NOT_STARTED" as const,
          priority: "MEDIUM" as const,
          assignedToId: "",
          blockedReason: ""
        }
  });

  const commentForm = useForm({
    resolver: zodResolver(taskCommentFormSchema),
    defaultValues: {
      content: ""
    }
  });

  useEffect(() => {
    commentForm.reset({ content: "" });
  }, [commentForm, task?.id]);

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
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Task state</p>
              <p className="text-sm text-muted-foreground">
                Update the operational state without leaving the queue.
              </p>
            </div>
            <button
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
              disabled={isSavingTask}
              type="submit"
            >
              {isSavingTask ? "Saving…" : "Save"}
            </button>
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

          {taskError ? <p className="text-sm text-red-700">{taskError}</p> : null}
        </form>

        <section className="rounded-[1.5rem] border border-border bg-white p-4">
          <p className="font-semibold">Task context</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-muted/60 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Comments
              </p>
              <p className="mt-2 text-lg font-semibold">{task.comments.length}</p>
            </div>
            <div className="rounded-2xl bg-muted/60 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Subtasks
              </p>
              <p className="mt-2 text-lg font-semibold">{task.subtasks.length}</p>
            </div>
            <div className="rounded-2xl bg-muted/60 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Dependencies
              </p>
              <p className="mt-2 text-lg font-semibold">{task.dependencies.length}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-border bg-white p-4">
          <p className="font-semibold">Comments</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Post updates directly in the workspace without dropping back to a page form flow.
          </p>

          <form
            className="mt-4 space-y-3"
            onSubmit={commentForm.handleSubmit(async (values) => {
              await onSubmitComment({
                taskId: task.id,
                content: values.content
              });
              commentForm.reset({ content: "" });
            })}
          >
            <textarea
              className="min-h-28 w-full rounded-2xl border border-border bg-card px-4 py-3"
              placeholder="Post the latest update, handoff, or blocker."
              {...commentForm.register("content")}
            />
            {commentForm.formState.errors.content?.message ? (
              <p className="text-sm text-red-700">
                {commentForm.formState.errors.content.message}
              </p>
            ) : null}
            {commentError ? <p className="text-sm text-red-700">{commentError}</p> : null}
            <button
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
              disabled={isPostingComment}
              type="submit"
            >
              {isPostingComment ? "Posting…" : "Post comment"}
            </button>
          </form>

          <div className="mt-5 space-y-3">
            {task.comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No comments yet.
              </p>
            ) : (
              task.comments.map((comment) => (
                <div key={comment.id} className="rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
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
        </section>
      </div>
    </section>
  );
}
