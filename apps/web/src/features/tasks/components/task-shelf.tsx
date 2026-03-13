import { zodResolver } from "@hookform/resolvers/zod";
import { DOCUMENT_CATEGORY_VALUES, type DocumentCategory } from "@salt/types";
import { useEffect, useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
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
  isExpanded: boolean;
  onClose: () => void;
  onToggleExpanded: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onSubmitTaskUpdate: (payload: TaskWorkspaceUpdateInput) => Promise<void>;
  onSubmitComment: (payload: TaskCommentCreateInput) => Promise<void>;
  onSubmitDocumentUpload: (payload: {
    title: string;
    category: DocumentCategory;
    notes: string | null;
    linkedTaskId: string | null;
    linkedBudgetItemId: string | null;
    file: File;
  }) => Promise<void>;
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
  isUploadingDocument: boolean;
  isSavingSubtask: boolean;
  isSavingDependency: boolean;
  isArchivingTask: boolean;
  taskError?: string;
  commentError?: string;
  documentError?: string;
  subtaskError?: string;
  dependencyError?: string;
  archiveError?: string;
};

type TaskFormValues = {
  title: string;
  description: string;
  notes: string;
  dueDate: string;
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

type DocumentUploadFormValues = {
  title: string;
  category: DocumentCategory;
  notes: string;
};

const taskWorkspaceFormSchema = z
  .object({
    title: z.string().trim().min(2).max(180),
    description: z.string().max(4000).optional().or(z.literal("")),
    notes: z.string().max(4000).optional().or(z.literal("")),
    dueDate: z.string().optional().or(z.literal("")),
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

const createSubtaskFormSchema = subtaskFormSchema.omit({ isComplete: true });

const dependencyFormSchema = z.object({
  dependsOnTaskId: z.string().cuid()
});

const documentUploadFormSchema = z.object({
  title: z.string().trim().min(3).max(180),
  category: z.enum(DOCUMENT_CATEGORY_VALUES),
  notes: z.string().max(2000).optional().or(z.literal(""))
});

const statusOptions = [
  { value: "NOT_STARTED", label: "Not started" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "COMPLETE", label: "Complete" }
] as const;

const priorityOptions = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" }
] as const;

const documentCategoryLabels: Record<DocumentCategory, string> = {
  PERMIT: "Permit",
  CONTRACT: "Contract",
  INSURANCE: "Insurance",
  VENDOR_QUOTE: "Vendor quote",
  EQUIPMENT_SPEC: "Equipment spec",
  FLOOR_PLAN: "Floor plan",
  INSPECTION_RECORD: "Inspection record",
  POLICY_MANUAL: "Policy/manual",
  COMPLIANCE_DOCUMENT: "Compliance document",
  INVOICE: "Invoice",
  PHOTO: "Photo",
  OTHER: "Other"
};

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

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

function toSuggestedTitle(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function ReviewMetric({
  label,
  value,
  tone = "default"
}: {
  label: string;
  value: string;
  tone?: "default" | "positive" | "warning";
}) {
  return (
    <div className="rounded-[1rem] border border-border/75 bg-white px-4 py-4 shadow-[0_18px_50px_-44px_rgba(15,23,42,0.18)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p
        className={joinClasses(
          "mt-2 break-words text-base font-semibold",
          tone === "positive"
            ? "text-emerald-700"
            : tone === "warning"
              ? "text-amber-800"
              : "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function OverviewField({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1rem] border border-border/70 bg-muted/18 px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 break-words text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
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
  const [isExpanded, setIsExpanded] = useState(false);
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

  const isComplete = form.watch("isComplete");

  async function submitCurrentValues(values: SubtaskFormValues) {
    await onSubmit({
      subtaskId: subtask.id,
      title: values.title,
      notes: values.notes || null,
      dueDate: values.dueDate || null,
      assignedToId: canChangeAssignee ? values.assignedToId || null : subtask.assignedToId,
      isComplete: values.isComplete,
      sortOrder: subtask.sortOrder
    });
  }

  return (
    <form
      className={joinClasses(
        "rounded-[1.15rem] border px-4 py-3 transition",
        subtask.archivedAt ? "border-border bg-muted/35" : "border-border/80 bg-white"
      )}
      onSubmit={form.handleSubmit(submitCurrentValues)}
    >
      <div className="flex items-start gap-3">
        <input
          checked={isComplete}
          className="mt-1 h-4 w-4 rounded border-border"
          disabled={!canEdit || Boolean(subtask.archivedAt) || isPending}
          onChange={async (event) => {
            const nextValues = {
              ...form.getValues(),
              isComplete: event.target.checked
            };

            form.setValue("isComplete", event.target.checked, {
              shouldDirty: true
            });
            await submitCurrentValues(nextValues);
          }}
          type="checkbox"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <button
                className="text-left"
                onClick={() => setIsExpanded((current) => !current)}
                type="button"
              >
                <p
                  className={joinClasses(
                    "font-medium text-foreground",
                    isComplete && "text-muted-foreground line-through"
                  )}
                >
                  {subtask.title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {subtask.assignedTo?.name ?? "Unassigned"} • {formatDate(subtask.dueDate)}
                  {subtask.archivedAt ? " • Archived" : ""}
                </p>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={joinClasses(
                  "rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.14em]",
                  isComplete
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isComplete ? "Complete" : "Pending"}
              </span>
              <button
                className="min-w-[5.5rem] rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                onClick={() => setIsExpanded((current) => !current)}
                type="button"
              >
                {isExpanded ? "Hide" : "Details"}
              </button>
            </div>
          </div>

          {isExpanded ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Title
                </span>
                <input
                  className="w-full rounded-[1rem] border border-border bg-white px-4 py-3 disabled:bg-muted"
                  disabled={!canEdit}
                  {...form.register("title")}
                />
              </label>

              <label className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Due date
                </span>
                <input
                  className="w-full rounded-[1rem] border border-border bg-white px-4 py-3 disabled:bg-muted"
                  disabled={!canEdit}
                  type="date"
                  {...form.register("dueDate")}
                />
              </label>

              <label className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Assignee
                </span>
                <select
                  className="w-full rounded-[1rem] border border-border bg-white px-4 py-3 disabled:bg-muted"
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

              <label className="space-y-2 md:col-span-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Notes
                </span>
                <textarea
                  className="min-h-24 w-full rounded-[1rem] border border-border bg-white px-4 py-3 disabled:bg-muted"
                  disabled={!canEdit}
                  {...form.register("notes")}
                />
              </label>

              <div className="md:col-span-2 flex flex-wrap justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    className="min-w-[6.5rem] rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                    disabled={!canEdit || isPending}
                    type="submit"
                  >
                    {isPending ? "Saving..." : "Save"}
                  </button>
                  <button
                    className="min-w-[6.5rem] rounded-full border border-border px-4 py-2 text-sm text-muted-foreground disabled:opacity-60"
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
                </div>

                {canArchive ? (
                  <button
                    className="min-w-[7.5rem] rounded-full border border-border px-4 py-2 text-sm text-muted-foreground disabled:opacity-60"
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
                    {subtask.archivedAt ? "Restore" : "Archive"}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </form>
  );
}

export function TaskShelf({
  currentUser,
  data,
  isExpanded,
  onClose,
  onToggleExpanded,
  onNext,
  onPrevious,
  onSubmitTaskUpdate,
  onSubmitComment,
  onSubmitDocumentUpload,
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
  isUploadingDocument,
  isSavingSubtask,
  isSavingDependency,
  isArchivingTask,
  taskError,
  commentError,
  documentError,
  subtaskError,
  dependencyError,
  archiveError
}: TaskShelfProps) {
  const task = data.task;
  const documentInputId = useId();
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentFileError, setDocumentFileError] = useState<string>();
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showArchivedSubtasks, setShowArchivedSubtasks] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const editSectionRef = useRef<HTMLElement | null>(null);

  const taskForm = useForm<TaskFormValues>({
    resolver: zodResolver(taskWorkspaceFormSchema),
    values: task
      ? {
          title: task.title,
          description: task.description ?? "",
          notes: task.notes ?? "",
          dueDate: toDateInputValue(task.dueDate),
          status: task.status,
          priority: task.priority,
          assignedToId: task.assignedToId ?? "",
          blockedReason: task.blockedReason ?? ""
        }
      : {
          title: "",
          description: "",
          notes: "",
          dueDate: "",
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
      assignedToId: ""
    }
  });

  const dependencyForm = useForm<z.infer<typeof dependencyFormSchema>>({
    resolver: zodResolver(dependencyFormSchema),
    defaultValues: {
      dependsOnTaskId: ""
    }
  });

  const documentForm = useForm<DocumentUploadFormValues>({
    resolver: zodResolver(documentUploadFormSchema),
    defaultValues: {
      title: "",
      category: "OTHER",
      notes: ""
    }
  });

  useEffect(() => {
    commentForm.reset({ content: "" });
    createSubtaskForm.reset({
      title: "",
      notes: "",
      dueDate: "",
      assignedToId: ""
    });
    dependencyForm.reset({ dependsOnTaskId: "" });
    documentForm.reset({
      title: "",
      category: "OTHER",
      notes: ""
    });
    setDocumentFile(null);
    setDocumentFileError(undefined);
    setShowUploadForm(false);
    setShowArchivedSubtasks(false);
    setIsEditingTask(false);
  }, [commentForm, createSubtaskForm, dependencyForm, documentForm, task?.id]);

  useEffect(() => {
    if (!isEditingTask) {
      return;
    }

    editSectionRef.current?.scrollIntoView({
      block: "start"
    });
  }, [isEditingTask]);

  useEffect(() => {
    if (documentFile && !documentForm.getValues("title")) {
      documentForm.setValue("title", toSuggestedTitle(documentFile.name), {
        shouldDirty: true
      });
    }
  }, [documentFile, documentForm]);

  const taskStatus = taskForm.watch("status");

  if (!task) {
    return (
      <section className="rounded-[1.5rem] border border-border bg-white p-5 shadow-sm">
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
  const taskId = task.id;
  const taskAssignedToId = task.assignedToId;
  const canManageChecklist = canEditTask && !task.archivedAt;
  const canUploadDocuments = canEditTask && !task.archivedAt;
  const activeSubtasks = task.subtasks.filter((subtask) => !subtask.archivedAt);
  const archivedSubtasks = task.subtasks.filter((subtask) => subtask.archivedAt);
  const completeActiveSubtasks = activeSubtasks.filter((subtask) => subtask.isComplete).length;
  const incompleteSubtasks = activeSubtasks.length - completeActiveSubtasks;
  const existingDependencyIds = new Set(task.dependencies.map((dependency) => dependency.id));
  const availableDependencyCandidates = task.dependencyCandidates.filter(
    (candidate) => !existingDependencyIds.has(candidate.id)
  );
  const shelfMeta = `${task.section.title} • Due ${formatDate(task.dueDate)} • ${task.assignedTo?.name ?? "Unassigned"}`;
  const dependencySummary =
    task.dependencies.length === 0 && task.dependents.length === 0
      ? "No linked dependency work"
      : `${task.dependencies.length} upstream • ${task.dependents.length} downstream`;

  async function submitTaskValues(values: TaskFormValues) {
    await onSubmitTaskUpdate({
      taskId,
      title: values.title,
      description: values.description || null,
      notes: values.notes || null,
      dueDate: values.dueDate || null,
      status: values.status,
      priority: values.priority,
      assignedToId: canChangeAssignee ? values.assignedToId || null : taskAssignedToId,
      blockedReason: values.status === "BLOCKED" ? values.blockedReason || null : null
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/80 px-5 py-5">
        <div className="space-y-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Task shelf
              </p>
              <span className="rounded-full bg-muted px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {task.status.replaceAll("_", " ")}
              </span>
              {task.archivedAt ? (
                <span className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  Archived
                </span>
              ) : null}
            </div>
            <h3 className="mt-2 break-words text-2xl font-semibold">{task.title}</h3>
            <p className="mt-2 break-words text-sm text-muted-foreground">{shelfMeta}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canEditTask ? (
              <button
                aria-expanded={isEditingTask}
                className={joinClasses(
                  "min-h-[2.75rem] min-w-[7.5rem] rounded-full border px-3 py-2 text-sm transition",
                  isEditingTask
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
                onClick={() => setIsEditingTask((current) => !current)}
                type="button"
              >
                {isEditingTask ? "Hide editor" : "Edit task"}
              </button>
            ) : null}
            <button
              className="min-h-[2.75rem] min-w-[7.5rem] rounded-full border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
              onClick={onToggleExpanded}
              type="button"
            >
              {isExpanded ? "Standard view" : "Expanded view"}
            </button>
            <button
              className="min-h-[2.75rem] min-w-[7.5rem] rounded-full border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted disabled:opacity-50"
              disabled={!onPrevious}
              onClick={onPrevious}
              type="button"
            >
              Previous
            </button>
            <button
              className="min-h-[2.75rem] min-w-[7.5rem] rounded-full border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted disabled:opacity-50"
              disabled={!onNext}
              onClick={onNext}
              type="button"
            >
              Next
            </button>
            <button
              className="min-h-[2.75rem] min-w-[7.5rem] rounded-full border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-5">
        <section className="space-y-5 rounded-[1.5rem] border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(247,243,235,0.86))] p-4 shadow-[0_22px_50px_-44px_rgba(15,23,42,0.3)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold">Operational review</p>
              <p className="text-sm text-muted-foreground">
                Default shelf view prioritizes status, dependencies, checklist work, documents, and
                comments before edit-heavy fields.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <ReviewMetric
              label="Status"
              tone={task.status === "BLOCKED" ? "warning" : task.status === "COMPLETE" ? "positive" : "default"}
              value={task.status.replaceAll("_", " ")}
            />
            <ReviewMetric label="Documents" value={`${task.attachments.length} linked`} />
            <ReviewMetric label="Comments" value={`${task.comments.length} captured`} />
            <ReviewMetric label="Dependencies" value={dependencySummary} />
            <ReviewMetric
              label="Checklist"
              tone={incompleteSubtasks === 0 && activeSubtasks.length > 0 ? "positive" : "default"}
              value={`${completeActiveSubtasks}/${activeSubtasks.length} complete`}
            />
          </div>

          <div className="grid gap-3 xl:grid-cols-4">
            <OverviewField label="Phase / section" value={`${task.phase?.title ?? "No phase"} / ${task.section.title}`} />
            <OverviewField label="Assignee" value={task.assignedTo?.name ?? "Unassigned"} />
            <OverviewField label="Due date" value={formatDate(task.dueDate)} />
            <OverviewField label="Priority" value={task.priority} />
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            <OverviewField
              label="Description"
              value={task.description?.trim() || "No task description yet."}
            />
            <OverviewField
              label="Working notes"
              value={task.notes?.trim() || "No working notes captured yet."}
            />
          </div>

          {task.blockedReason ? (
            <div className="rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                Blocked reason
              </p>
              <p className="mt-2 break-words">{task.blockedReason}</p>
            </div>
          ) : null}
          {task.archivedAt ? (
            <p className="text-sm text-muted-foreground">
              This task is archived and hidden from normal active queues. Restore it to resume
              active work.
            </p>
          ) : null}
        </section>

        <section className="rounded-[1.5rem] border border-border bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Dependencies</p>
              <p className="text-sm text-muted-foreground">
                Review blockers and downstream work in the same task context.
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
                dependencyForm.reset({ dependsOnTaskId: "" });
              })}
            >
              <select
                className="w-full rounded-[1rem] border border-border bg-white px-4 py-3 md:flex-1"
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
                className="min-w-[8rem] rounded-[1rem] bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
                disabled={
                  !canEditTask ||
                  isSavingDependency ||
                  availableDependencyCandidates.length === 0
                }
                type="submit"
              >
                {isSavingDependency ? "Adding..." : "Add"}
              </button>
            </form>
          ) : null}

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                This task depends on
              </p>
              {task.dependencies.length === 0 ? (
                <div className="rounded-[1rem] border border-dashed border-border bg-muted/35 p-4 text-sm text-muted-foreground">
                  No dependencies yet.
                </div>
              ) : (
                task.dependencies.map((dependency) => (
                  <div key={dependency.id} className="rounded-[1rem] border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{dependency.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {dependency.assignedTo?.name ?? "Unassigned"} • {formatDate(dependency.dueDate)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-muted px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Tasks waiting on this one
              </p>
              {task.dependents.length === 0 ? (
                <div className="rounded-[1rem] border border-dashed border-border bg-muted/35 p-4 text-sm text-muted-foreground">
                  No dependent tasks yet.
                </div>
              ) : (
                task.dependents.map((dependency) => (
                  <div key={dependency.id} className="rounded-[1rem] border border-border p-4">
                    <p className="font-medium">{dependency.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {dependency.assignedTo?.name ?? "Unassigned"} • {formatDate(dependency.dueDate)} •{" "}
                      {dependency.status.replaceAll("_", " ")}
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
                Keep checklist work compact, scannable, and editable in place.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                {completeActiveSubtasks}/{activeSubtasks.length} complete
              </span>
              {archivedSubtasks.length > 0 ? (
                <button
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
                  onClick={() => setShowArchivedSubtasks((current) => !current)}
                  type="button"
                >
                  {showArchivedSubtasks ? "Hide archived" : `Show archived (${archivedSubtasks.length})`}
                </button>
              ) : null}
            </div>
          </div>

          {!task.archivedAt ? (
            <form
              className="mt-4 grid gap-3 rounded-[1.15rem] border border-border bg-muted/18 p-4 md:grid-cols-[minmax(0,1fr)_10rem]"
              onSubmit={createSubtaskForm.handleSubmit(async (values) => {
                await onCreateSubtask({
                  taskId: task.id,
                  title: values.title,
                  notes: values.notes || null,
                  dueDate: values.dueDate || null,
                  assignedToId:
                    currentUser.role === "OWNER_ADMIN" ? values.assignedToId || null : null
                });
                createSubtaskForm.reset({
                  title: "",
                  notes: "",
                  dueDate: "",
                  assignedToId: ""
                });
              })}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-2 md:col-span-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    New checklist item
                  </span>
                  <input
                    className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
                    placeholder="Add a checklist item"
                    {...createSubtaskForm.register("title")}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Due date
                  </span>
                  <input
                    className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
                    type="date"
                    {...createSubtaskForm.register("dueDate")}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Assignee
                  </span>
                  <select
                    className="w-full rounded-[1rem] border border-border bg-white px-4 py-3 disabled:bg-muted"
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

                <label className="space-y-2 md:col-span-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Notes
                  </span>
                  <textarea
                    className="min-h-20 w-full rounded-[1rem] border border-border bg-white px-4 py-3"
                    placeholder="Optional completion details"
                    {...createSubtaskForm.register("notes")}
                  />
                </label>
              </div>

              <div className="flex items-end justify-end">
                <button
                  className="min-w-[8rem] rounded-[1rem] bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
                  disabled={
                    isSavingSubtask ||
                    !canManageChecklist ||
                    (currentUser.role !== "OWNER_ADMIN" && task.assignedToId !== currentUser.id)
                  }
                  type="submit"
                >
                  {isSavingSubtask ? "Adding..." : "Add item"}
                </button>
              </div>
            </form>
          ) : null}

          <div className="mt-4 space-y-3">
            {activeSubtasks.length === 0 ? (
              <div className="rounded-[1rem] border border-dashed border-border bg-muted/35 p-4 text-sm text-muted-foreground">
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

          {showArchivedSubtasks && archivedSubtasks.length > 0 ? (
            <div className="mt-5 space-y-3">
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Documents</p>
              <p className="text-sm text-muted-foreground">
                Upload or open task files without leaving the shelf.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                {task.attachments.length} linked
              </span>
              {canUploadDocuments ? (
                <button
                  className="min-w-[8rem] rounded-full border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                  onClick={() => setShowUploadForm((current) => !current)}
                  type="button"
                >
                  {showUploadForm ? "Hide upload" : "Upload file"}
                </button>
              ) : null}
            </div>
          </div>

          {showUploadForm ? (
            <form
              className="mt-4 grid gap-4 rounded-[1.15rem] border border-border bg-muted/18 p-4"
              onSubmit={documentForm.handleSubmit(async (values) => {
                if (!documentFile) {
                  setDocumentFileError("Choose a file before uploading.");
                  return;
                }

                await onSubmitDocumentUpload({
                  title: values.title,
                  category: values.category,
                  notes: values.notes || null,
                  linkedTaskId: task.id,
                  linkedBudgetItemId: null,
                  file: documentFile
                });

                documentForm.reset({
                  title: "",
                  category: "OTHER",
                  notes: ""
                });
                setDocumentFile(null);
                setDocumentFileError(undefined);
                setShowUploadForm(false);
              })}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    File
                  </span>
                  <label
                    className="flex min-h-[5.5rem] cursor-pointer items-center justify-center rounded-[1rem] border border-dashed border-border bg-white px-4 py-3 text-center text-sm text-muted-foreground hover:bg-muted/30"
                    htmlFor={documentInputId}
                  >
                    {documentFile
                      ? `${documentFile.name} • ${formatFileSize(documentFile.size)}`
                      : "Choose a file to attach to this task"}
                  </label>
                  <input
                    className="sr-only"
                    id={documentInputId}
                    onChange={(event) => {
                      setDocumentFile(event.target.files?.item(0) ?? null);
                      setDocumentFileError(undefined);
                    }}
                    type="file"
                  />
                </div>

                <label className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Title
                  </span>
                  <input
                    className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
                    {...documentForm.register("title")}
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-[14rem_minmax(0,1fr)]">
                <label className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Category
                  </span>
                  <select
                    className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
                    {...documentForm.register("category")}
                  >
                    {DOCUMENT_CATEGORY_VALUES.map((category) => (
                      <option key={category} value={category}>
                        {documentCategoryLabels[category]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Notes
                  </span>
                  <textarea
                    className="min-h-24 w-full rounded-[1rem] border border-border bg-white px-4 py-3"
                    placeholder="Optional document context"
                    {...documentForm.register("notes")}
                  />
                </label>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  className="min-w-[7.5rem] rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
                  onClick={() => {
                    setShowUploadForm(false);
                    setDocumentFile(null);
                    setDocumentFileError(undefined);
                  }}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="min-w-[7.5rem] rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                  disabled={isUploadingDocument}
                  type="submit"
                >
                  {isUploadingDocument ? "Uploading..." : "Upload"}
                </button>
              </div>
            </form>
          ) : null}

          {documentFileError ? <p className="mt-3 text-sm text-red-700">{documentFileError}</p> : null}
          {documentForm.formState.errors.title?.message ? (
            <p className="mt-3 text-sm text-red-700">{documentForm.formState.errors.title.message}</p>
          ) : null}
          {documentError ? <p className="mt-3 text-sm text-red-700">{documentError}</p> : null}

          <div className="mt-4 space-y-3">
            {task.attachments.length === 0 ? (
              <div className="rounded-[1rem] border border-dashed border-border bg-muted/35 p-4 text-sm text-muted-foreground">
                No documents linked to this task yet.
              </div>
            ) : (
              task.attachments.map((document) => (
                <Link
                  key={document.id}
                  className="block rounded-[1rem] border border-border p-4 transition hover:bg-muted/40"
                  to={`/documents/${document.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{document.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {document.category.replaceAll("_", " ")} • {document.originalName}
                      </p>
                    </div>
                    <span className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      Open
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
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
              commentForm.reset({ content: "" });
            })}
          >
            <textarea
              className="min-h-28 w-full rounded-[1rem] border border-border bg-white px-4 py-3"
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
                className="min-w-[7.5rem] rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                disabled={isPostingComment}
                type="submit"
              >
                {isPostingComment ? "Posting..." : "Post comment"}
              </button>
            </div>
            {commentError ? <p className="text-sm text-red-700">{commentError}</p> : null}
          </form>

          <div className="mt-4 space-y-3">
            {task.comments.length === 0 ? (
              <div className="rounded-[1rem] border border-dashed border-border bg-muted/35 p-4 text-sm text-muted-foreground">
                No comments yet.
              </div>
            ) : (
              task.comments.map((comment) => (
                <article key={comment.id} className="rounded-[1rem] border border-border p-4">
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

        <section
          ref={editSectionRef}
          className="rounded-[1.5rem] border border-border bg-white p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold">Task editor</p>
              <p className="text-sm text-muted-foreground">
                Open only when you need to change task fields. Review surfaces stay visible above.
              </p>
            </div>

            {canEditTask ? (
              <button
                aria-expanded={isEditingTask}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground hover:bg-muted"
                onClick={() => setIsEditingTask((current) => !current)}
                type="button"
              >
                {isEditingTask ? "Collapse" : "Open editor"}
              </button>
            ) : null}
          </div>

          {isEditingTask ? (
            <form
              className="mt-5 space-y-5 border-t border-border/70 pt-5"
              onSubmit={taskForm.handleSubmit(submitTaskValues)}
            >
              <div className="flex flex-wrap gap-2">
                {currentUser.role === "OWNER_ADMIN" ? (
                  <button
                    className="min-w-[7.5rem] rounded-full border border-border px-4 py-2 text-sm text-muted-foreground disabled:opacity-60"
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
                        ? "Restoring..."
                        : "Archiving..."
                      : task.archivedAt
                        ? "Restore"
                        : "Archive"}
                  </button>
                ) : null}
                <button
                  className="min-w-[7.5rem] rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                  disabled={isSavingTask || !taskForm.formState.isDirty}
                  type="submit"
                >
                  {isSavingTask ? "Saving..." : "Save changes"}
                </button>
              </div>

              <label className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Task name
                </span>
                <input
                  className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
                  {...taskForm.register("title")}
                />
              </label>

              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Status
                </span>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {statusOptions.map((option) => {
                    const isActive = taskStatus === option.value;

                    return (
                      <button
                        key={option.value}
                        className={joinClasses(
                          "rounded-full border px-4 py-2.5 text-sm transition",
                          isActive
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-white text-muted-foreground hover:bg-muted"
                        )}
                        onClick={() => {
                          taskForm.setValue("status", option.value, {
                            shouldDirty: true,
                            shouldValidate: true
                          });
                        }}
                        type="button"
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Due date
                  </span>
                  <input
                    className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
                    type="date"
                    {...taskForm.register("dueDate")}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Priority
                  </span>
                  <select
                    className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
                    {...taskForm.register("priority")}
                  >
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 md:col-span-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Assignee
                  </span>
                  <select
                    className="w-full rounded-[1rem] border border-border bg-white px-4 py-3 disabled:bg-muted"
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
              </div>

              {taskStatus === "BLOCKED" ? (
                <label className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Blocked reason
                  </span>
                  <textarea
                    className="min-h-24 w-full rounded-[1rem] border border-border bg-white px-4 py-3"
                    placeholder="What is stopping this task?"
                    {...taskForm.register("blockedReason")}
                  />
                </label>
              ) : null}

              <div className="grid gap-4 xl:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Description
                  </span>
                  <textarea
                    className="min-h-28 w-full rounded-[1rem] border border-border bg-white px-4 py-3"
                    placeholder="What needs to happen?"
                    {...taskForm.register("description")}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Working notes
                  </span>
                  <textarea
                    className="min-h-28 w-full rounded-[1rem] border border-border bg-white px-4 py-3"
                    placeholder="Capture handoff context, install notes, or follow-up details"
                    {...taskForm.register("notes")}
                  />
                </label>
              </div>

              {taskForm.formState.errors.title?.message ? (
                <p className="text-sm text-red-700">{taskForm.formState.errors.title.message}</p>
              ) : null}
              {taskForm.formState.errors.blockedReason?.message ? (
                <p className="text-sm text-red-700">
                  {taskForm.formState.errors.blockedReason.message}
                </p>
              ) : null}
              {taskError ? <p className="text-sm text-red-700">{taskError}</p> : null}
              {archiveError ? <p className="text-sm text-red-700">{archiveError}</p> : null}
            </form>
          ) : (
            <div className="mt-4 rounded-[1rem] border border-dashed border-border bg-muted/18 px-4 py-4 text-sm text-muted-foreground">
              Task fields stay out of the default shelf view. Use Edit task when you need to change
              title, status, dates, notes, assignment, or archive state.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
