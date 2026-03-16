import { zodResolver } from "@hookform/resolvers/zod";
import type { DocumentListResponse, TaskCreateInput, TaskListResponse } from "@salt/types";
import { taskCreateSchema } from "@salt/validation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ExistingDocumentPicker } from "./existing-document-picker";

type TaskCreatePanelProps = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  isPending: boolean;
  documents: DocumentListResponse["documents"];
  phases: TaskListResponse["phases"];
  sections: TaskListResponse["sections"];
  users: TaskListResponse["users"];
  onClose: () => void;
  onSubmit: (payload: TaskCreateInput) => Promise<void>;
};

type TaskCreateFormValues = z.input<typeof taskCreateSchema>;

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function getDefaultValues(
  sections: TaskListResponse["sections"]
): TaskCreateFormValues {
  return {
    sectionId: sections[0]?.id ?? "",
    phaseId: "",
    title: "",
    description: "",
    notes: "",
    priority: "MEDIUM",
    openingPriority: "MUST_HAVE_BEFORE_OPENING",
    dueDate: "",
    assignedToId: "",
    documentIds: []
  };
}

export function TaskCreatePanel({
  error,
  fieldErrors,
  isPending,
  documents,
  phases,
  sections,
  users,
  onClose,
  onSubmit
}: TaskCreatePanelProps) {
  const defaultValues = useMemo(() => getDefaultValues(sections), [sections]);
  const [showExistingDocuments, setShowExistingDocuments] = useState(false);
  const form = useForm<TaskCreateFormValues>({
    resolver: zodResolver(taskCreateSchema),
    defaultValues
  });

  useEffect(() => {
    if (!form.getValues("sectionId") && sections[0]) {
      form.setValue("sectionId", sections[0].id);
    }
  }, [form, sections]);

  useEffect(() => {
    form.clearErrors();

    if (!fieldErrors) {
      return;
    }

    Object.entries(fieldErrors).forEach(([fieldName, messages]) => {
      const message = messages?.[0];

      if (!message) {
        return;
      }

      form.setError(fieldName as keyof TaskCreateFormValues, {
        type: "server",
        message
      });
    });
  }, [fieldErrors, form]);

  async function submit(values: TaskCreateFormValues) {
    await onSubmit({
      sectionId: values.sectionId,
      phaseId: values.phaseId || null,
      title: values.title,
      description: values.description || null,
      notes: values.notes || null,
      priority: values.priority,
      openingPriority: values.openingPriority,
      dueDate: values.dueDate || null,
      assignedToId: values.assignedToId || null,
      documentIds: values.documentIds ?? []
    });
  }

  return (
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(251,247,239,0.94))]">
      <div className="border-b border-border/70 px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Tasks
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">Create task</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Add a task without leaving the queue. Your current filters and search stay in place after save.
            </p>
          </div>
          <button
            className="rounded-full border border-border bg-white px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
            onClick={() => {
              form.reset(getDefaultValues(sections));
              onClose();
            }}
            type="button"
          >
            Close
          </button>
        </div>
      </div>

      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={form.handleSubmit(submit)}
      >
        <div className="grid flex-1 gap-4 overflow-y-auto px-5 py-5 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-foreground">Title</span>
            <input
              className={joinClasses(
                "h-11 w-full rounded-2xl border bg-white px-4 text-sm text-foreground outline-none transition",
                form.formState.errors.title ? "border-rose-300" : "border-border/80 focus:border-primary/35"
              )}
              placeholder="Schedule fire suppression inspection"
              {...form.register("title")}
            />
            {form.formState.errors.title ? (
              <p className="text-sm text-rose-700">{form.formState.errors.title.message}</p>
            ) : null}
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-foreground">Description</span>
            <textarea
              className={joinClasses(
                "min-h-24 w-full rounded-[1.25rem] border bg-white px-4 py-3 text-sm text-foreground outline-none transition",
                form.formState.errors.description
                  ? "border-rose-300"
                  : "border-border/80 focus:border-primary/35"
              )}
              placeholder="Capture the deliverable, constraint, or handoff."
              {...form.register("description")}
            />
            {form.formState.errors.description ? (
              <p className="text-sm text-rose-700">{form.formState.errors.description.message}</p>
            ) : null}
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-foreground">Notes</span>
            <textarea
              className={joinClasses(
                "min-h-24 w-full rounded-[1.25rem] border bg-white px-4 py-3 text-sm text-foreground outline-none transition",
                form.formState.errors.notes
                  ? "border-rose-300"
                  : "border-border/80 focus:border-primary/35"
              )}
              placeholder="Internal context or follow-up details."
              {...form.register("notes")}
            />
            {form.formState.errors.notes ? (
              <p className="text-sm text-rose-700">{form.formState.errors.notes.message}</p>
            ) : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Section</span>
            <select
              className={joinClasses(
                "h-11 w-full rounded-2xl border bg-white px-4 text-sm text-foreground outline-none transition",
                form.formState.errors.sectionId ? "border-rose-300" : "border-border/80 focus:border-primary/35"
              )}
              {...form.register("sectionId")}
            >
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.title}
                </option>
              ))}
            </select>
            {form.formState.errors.sectionId ? (
              <p className="text-sm text-rose-700">{form.formState.errors.sectionId.message}</p>
            ) : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Phase</span>
            <select
              className="h-11 w-full rounded-2xl border border-border/80 bg-white px-4 text-sm text-foreground outline-none transition focus:border-primary/35"
              {...form.register("phaseId")}
            >
              <option value="">No phase</option>
              {phases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {phase.title}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Priority</span>
            <select
              className="h-11 w-full rounded-2xl border border-border/80 bg-white px-4 text-sm text-foreground outline-none transition focus:border-primary/35"
              {...form.register("priority")}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Opening priority</span>
            <select
              className="h-11 w-full rounded-2xl border border-border/80 bg-white px-4 text-sm text-foreground outline-none transition focus:border-primary/35"
              {...form.register("openingPriority")}
            >
              <option value="MUST_HAVE_BEFORE_OPENING">Must have before opening</option>
              <option value="CAN_PHASE_IN">Can phase in</option>
              <option value="OPTIONAL_UPGRADE">Optional upgrade</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Due date</span>
            <input
              className="h-11 w-full rounded-2xl border border-border/80 bg-white px-4 text-sm text-foreground outline-none transition focus:border-primary/35"
              type="date"
              {...form.register("dueDate")}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Assigned to</span>
            <select
              className="h-11 w-full rounded-2xl border border-border/80 bg-white px-4 text-sm text-foreground outline-none transition focus:border-primary/35"
              {...form.register("assignedToId")}
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} {user.role === "OWNER_ADMIN" ? "• Owner" : "• Collaborator"}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-2 md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-[1rem] border border-border bg-muted/18 px-4 py-3">
              <div>
                <p className="font-medium text-foreground">Existing documents</p>
                <p className="text-sm text-muted-foreground">
                  Optionally link documents that already exist in the vault.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {(form.watch("documentIds") ?? []).length} selected
                </span>
                <button
                  className="rounded-full border border-border bg-white px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                  onClick={() => setShowExistingDocuments((current) => !current)}
                  type="button"
                >
                  {showExistingDocuments ? "Hide documents" : "Link existing"}
                </button>
              </div>
            </div>

            {showExistingDocuments ? (
              <ExistingDocumentPicker
                documents={documents}
                emptyMessage="No existing documents match the current search."
                onToggleDocument={(documentId) => {
                  const currentDocumentIds = form.getValues("documentIds") ?? [];
                  const nextDocumentIds = currentDocumentIds.includes(documentId)
                    ? currentDocumentIds.filter((id) => id !== documentId)
                    : [...currentDocumentIds, documentId];

                  form.setValue("documentIds", nextDocumentIds, {
                    shouldDirty: true,
                    shouldTouch: true
                  });
                }}
                selectedDocumentIds={form.watch("documentIds") ?? []}
              />
            ) : null}
          </div>

          {error ? (
            <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 md:col-span-2">
              {error}
            </div>
          ) : null}
        </div>

        <div className="border-t border-border/70 px-5 py-4">
          <div className="flex justify-end gap-2">
            <button
              className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-white px-4 text-sm font-medium text-foreground transition hover:bg-muted"
              onClick={() => {
                form.reset(getDefaultValues(sections));
                onClose();
              }}
              type="button"
            >
              Cancel
            </button>
            <button
              className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending || sections.length === 0}
              type="submit"
            >
              {isPending ? "Creating…" : "Create task"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
