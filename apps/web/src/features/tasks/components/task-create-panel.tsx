import { zodResolver } from "@hookform/resolvers/zod";
import type { TaskCreateInput, TaskListResponse } from "@salt/types";
import { taskCreateSchema } from "@salt/validation";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type TaskCreatePanelProps = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  isPending: boolean;
  open: boolean;
  phases: TaskListResponse["phases"];
  sections: TaskListResponse["sections"];
  users: TaskListResponse["users"];
  onOpenChange: (open: boolean) => void;
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
    assignedToId: ""
  };
}

export function TaskCreatePanel({
  error,
  fieldErrors,
  isPending,
  open,
  phases,
  sections,
  users,
  onOpenChange,
  onSubmit
}: TaskCreatePanelProps) {
  const defaultValues = useMemo(() => getDefaultValues(sections), [sections]);
  const form = useForm<TaskCreateFormValues>({
    resolver: zodResolver(taskCreateSchema),
    defaultValues
  });

  useEffect(() => {
    if (!open) {
      form.reset(getDefaultValues(sections));
      return;
    }

    if (!form.getValues("sectionId") && sections[0]) {
      form.setValue("sectionId", sections[0].id);
    }
  }, [form, open, sections]);

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
      assignedToId: values.assignedToId || null
    });
  }

  if (!open) {
    return null;
  }

  return (
    <section className="rounded-[1.25rem] border border-border/80 bg-white px-4 py-4 shadow-[0_20px_50px_-42px_rgba(15,23,42,0.4)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            New task
          </p>
          <h3 className="mt-2 text-base font-semibold text-foreground">Create work without leaving the queue</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Use the existing task rules, then open the new task in the shelf.
          </p>
        </div>
        <button
          className="rounded-full border border-border bg-white px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
          onClick={() => {
            form.reset(getDefaultValues(sections));
            onOpenChange(false);
          }}
          type="button"
        >
          Cancel
        </button>
      </div>

      <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(submit)}>
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

        {error ? (
          <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 md:col-span-2">
            {error}
          </div>
        ) : null}

        <div className="flex justify-end md:col-span-2">
          <button
            className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending || sections.length === 0}
            type="submit"
          >
            {isPending ? "Creating…" : "Create task"}
          </button>
        </div>
      </form>
    </section>
  );
}
