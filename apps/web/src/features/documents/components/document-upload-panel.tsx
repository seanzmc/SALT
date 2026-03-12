import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { DOCUMENT_CATEGORY_VALUES, type DocumentListResponse } from "@salt/types";

const uploadFormSchema = z.object({
  title: z.string().trim().min(3).max(180),
  category: z.enum(DOCUMENT_CATEGORY_VALUES),
  notes: z.string().max(2000).optional().or(z.literal("")),
  linkedTaskId: z.string().optional().or(z.literal("")),
  linkedBudgetItemId: z.string().optional().or(z.literal("")),
  file: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, "Select a file to upload.")
});

type UploadFormValues = z.infer<typeof uploadFormSchema>;

type DocumentUploadPanelProps = {
  tasks: DocumentListResponse["tasks"];
  budgetItems: DocumentListResponse["budgetItems"];
  isUploading: boolean;
  error?: string;
  onSubmit: (payload: {
    title: string;
    category: (typeof DOCUMENT_CATEGORY_VALUES)[number];
    notes: string | null;
    linkedTaskId: string | null;
    linkedBudgetItemId: string | null;
    file: File;
  }) => Promise<void>;
};

const categoryLabels: Record<(typeof DOCUMENT_CATEGORY_VALUES)[number], string> = {
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

export function DocumentUploadPanel({
  tasks,
  budgetItems,
  isUploading,
  error,
  onSubmit
}: DocumentUploadPanelProps) {
  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      title: "",
      category: "PERMIT",
      notes: "",
      linkedTaskId: "",
      linkedBudgetItemId: ""
    }
  });

  return (
    <section className="rounded-[1.75rem] border border-border bg-white/85 p-5 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">Upload protected document</p>
          <p className="text-sm text-muted-foreground">
            Add files to the private document vault and optionally link them into task flow.
          </p>
        </div>
      </div>

      <form
        className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-6"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit({
            title: values.title,
            category: values.category,
            notes: values.notes || null,
            linkedTaskId: values.linkedTaskId || null,
            linkedBudgetItemId: values.linkedBudgetItemId || null,
            file: values.file.item(0)!
          });
          form.reset({
            title: "",
            category: "PERMIT",
            notes: "",
            linkedTaskId: "",
            linkedBudgetItemId: ""
          });
        })}
      >
        <label className="space-y-2 xl:col-span-2">
          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Title</span>
          <input
            className="w-full rounded-2xl border border-border bg-card px-4 py-3"
            {...form.register("title")}
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Category
          </span>
          <select
            className="w-full rounded-2xl border border-border bg-card px-4 py-3"
            {...form.register("category")}
          >
            {DOCUMENT_CATEGORY_VALUES.map((category) => (
              <option key={category} value={category}>
                {categoryLabels[category]}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Linked task
          </span>
          <select
            className="w-full rounded-2xl border border-border bg-card px-4 py-3"
            {...form.register("linkedTaskId")}
          >
            <option value="">None</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
                {task.archivedAt ? " (Archived)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Budget item
          </span>
          <select
            className="w-full rounded-2xl border border-border bg-card px-4 py-3"
            {...form.register("linkedBudgetItemId")}
          >
            <option value="">None</option>
            {budgetItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.lineItem}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 xl:col-span-6">
          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Notes</span>
          <textarea
            className="min-h-24 w-full rounded-2xl border border-border bg-card px-4 py-3"
            {...form.register("notes")}
          />
        </label>

        <label className="space-y-2 xl:col-span-4">
          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">File</span>
          <input
            className="w-full rounded-2xl border border-border bg-card px-4 py-3"
            type="file"
            {...form.register("file")}
          />
        </label>

        <div className="flex items-end xl:col-span-2">
          <button
            className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
            disabled={isUploading}
            type="submit"
          >
            {isUploading ? "Uploading…" : "Upload document"}
          </button>
        </div>
      </form>

      {form.formState.errors.file?.message ? (
        <p className="mt-3 text-sm text-red-700">{form.formState.errors.file.message}</p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
    </section>
  );
}
