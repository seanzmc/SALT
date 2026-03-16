import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";

import type { DocumentWorkspaceData, SessionPayload } from "@salt/types";

const taskLinkSchema = z.object({
  taskId: z.string().cuid()
});

type DocumentShelfProps = {
  currentUser: SessionPayload["user"];
  data: DocumentWorkspaceData;
  isExpanded: boolean;
  onClose: () => void;
  onToggleExpanded: () => void;
  onDeleteDocument: (payload: { documentId: string }) => Promise<void>;
  onLinkTask: (payload: { documentId: string; taskId: string }) => Promise<void>;
  onUnlinkTask: (payload: { documentId: string; taskId: string }) => Promise<void>;
  isSaving: boolean;
  isDeleting: boolean;
  error?: string;
  deleteError?: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export function DocumentShelf({
  currentUser,
  data,
  isExpanded,
  onClose,
  onToggleExpanded,
  onDeleteDocument,
  onLinkTask,
  onUnlinkTask,
  isSaving,
  isDeleting,
  error,
  deleteError
}: DocumentShelfProps) {
  const document = data.document;
  const canDeleteDocument =
    currentUser.role === "OWNER_ADMIN" || document?.uploadedBy.id === currentUser.id;
  const form = useForm<z.infer<typeof taskLinkSchema>>({
    resolver: zodResolver(taskLinkSchema),
    defaultValues: {
      taskId: ""
    }
  });

  useEffect(() => {
    form.reset({ taskId: "" });
  }, [document?.id, form]);

  if (!document) {
    return (
      <section className="rounded-[1.5rem] border border-border bg-white p-5 shadow-sm">
        <p className="font-medium">Document unavailable.</p>
      </section>
    );
  }

  const attachedTaskIds = new Set(document.attachedTasks.map((task) => task.id));
  const availableTasks = data.tasks.filter((task) => !attachedTaskIds.has(task.id));

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/80 px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Document shelf
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-foreground">{document.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {document.category.replaceAll("_", " ")} • Added {formatDate(document.createdAt)} by{" "}
              {document.uploadedBy.name}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canDeleteDocument || isDeleting || isSaving}
              onClick={async () => {
                if (
                  !window.confirm(
                    `Delete "${document.title}"? This permanently removes the document record and stored file.`
                  )
                ) {
                  return;
                }

                await onDeleteDocument({ documentId: document.id });
              }}
              type="button"
            >
              {isDeleting ? "Deleting..." : "Delete document"}
            </button>
            <button
              className="rounded-full border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
              onClick={onToggleExpanded}
              type="button"
            >
              {isExpanded ? "Standard width" : "Expand"}
            </button>
            <button
              className="rounded-full border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-5">
        <section className="rounded-[1.5rem] border border-border bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Protected file access</p>
              <p className="text-sm text-muted-foreground">
                Open or download through authenticated application routes.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
                href={`/api/documents/${document.id}/file`}
                rel="noreferrer"
                target="_blank"
              >
                Open
              </a>
              <a
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                href={`/api/documents/${document.id}/file?download=1`}
              >
                Download
              </a>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-muted/50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Original file
              </p>
              <p className="mt-2 font-medium text-foreground">{document.originalName}</p>
            </div>
            <div className="rounded-2xl bg-muted/50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Primary link
              </p>
              <p className="mt-2 font-medium text-foreground">
                {document.linkedTask?.title ?? document.linkedBudgetItem?.lineItem ?? "Unlinked"}
              </p>
            </div>
          </div>

          {document.notes ? (
            <p className="mt-4 text-sm leading-6 text-muted-foreground">{document.notes}</p>
          ) : null}

          {!canDeleteDocument ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Only the uploader or an owner admin can delete this document.
            </p>
          ) : null}
          {deleteError ? <p className="mt-4 text-sm text-red-700">{deleteError}</p> : null}
        </section>

        <section className="rounded-[1.5rem] border border-border bg-white p-4">
          <p className="font-semibold">Task links</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Link this document into task execution. Every task link opens the shared task shelf.
          </p>

          <form
            className="mt-4 flex flex-col gap-3 md:flex-row"
            onSubmit={form.handleSubmit(async (values) => {
              await onLinkTask({
                documentId: document.id,
                taskId: values.taskId
              });
            })}
          >
            <select
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 md:flex-1"
              {...form.register("taskId")}
            >
              <option value="">Select a task</option>
              {availableTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                  {task.archivedAt ? " (Archived)" : ""}
                  {task.assignedTo?.name ? ` • ${task.assignedTo.name}` : ""}
                </option>
              ))}
            </select>
            <button
              className="rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
              disabled={isSaving || availableTasks.length === 0}
              type="submit"
            >
              {isSaving ? "Saving..." : "Link to task"}
            </button>
          </form>

          <div className="mt-4 space-y-3">
            {document.attachedTasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/35 p-4 text-sm text-muted-foreground">
                No task links yet.
              </div>
            ) : (
              document.attachedTasks.map((task) => {
                const canManage =
                  currentUser.role === "OWNER_ADMIN" ||
                  data.tasks.find((item) => item.id === task.id)?.assignedToId === currentUser.id;

                return (
                  <div key={task.id} className="rounded-2xl border border-border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <Link
                          className="font-medium text-foreground hover:text-primary"
                          to={`/tasks/${task.id}`}
                        >
                          {task.title}
                        </Link>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {task.archivedAt ? "Archived task" : "Active task"}
                        </p>
                      </div>
                      <button
                        className="rounded-full border border-border px-3 py-2 text-sm text-muted-foreground disabled:opacity-60"
                        disabled={!canManage || isSaving}
                        onClick={async () => {
                          await onUnlinkTask({
                            documentId: document.id,
                            taskId: task.id
                          });
                        }}
                        type="button"
                      >
                        Unlink
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {form.formState.errors.taskId?.message ? (
            <p className="mt-3 text-sm text-red-700">{form.formState.errors.taskId.message}</p>
          ) : null}
          {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        </section>
      </div>
    </div>
  );
}
