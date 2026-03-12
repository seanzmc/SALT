import type { DragEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { DOCUMENT_CATEGORY_VALUES, type DocumentListResponse } from "@salt/types";

const uploadFormSchema = z.object({
  title: z.string().trim().min(3).max(180),
  category: z.enum(DOCUMENT_CATEGORY_VALUES),
  notes: z.string().max(2000).optional().or(z.literal("")),
  linkedTaskId: z.string().optional().or(z.literal("")),
  linkedBudgetItemId: z.string().optional().or(z.literal(""))
});

type UploadFormValues = z.infer<typeof uploadFormSchema>;

type DocumentUploadPanelProps = {
  tasks: DocumentListResponse["tasks"];
  budgetItems: DocumentListResponse["budgetItems"];
  isUploading: boolean;
  error?: string;
  onClose?: () => void;
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

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
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

export function DocumentUploadPanel({
  tasks,
  budgetItems,
  isUploading,
  error,
  onClose,
  onSubmit
}: DocumentUploadPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>();
  const [isDragging, setIsDragging] = useState(false);
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

  useEffect(() => {
    if (selectedFile && !form.getValues("title")) {
      form.setValue("title", toSuggestedTitle(selectedFile.name), {
        shouldDirty: true
      });
    }
  }, [form, selectedFile]);

  function handleFile(file: File | null) {
    setSelectedFile(file);
    setFileError(undefined);

    if (!fileInputRef.current) {
      return;
    }

    if (!file) {
      fileInputRef.current.value = "";
      return;
    }

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInputRef.current.files = dataTransfer.files;
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files.item(0));
  }

  return (
    <div className="rounded-[1.25rem] border border-border/80 bg-muted/18 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">Upload document</p>
          <p className="text-sm text-muted-foreground">
            Pick the file first, then confirm metadata and links before sending it into the
            protected vault.
          </p>
        </div>
        {onClose ? (
          <button
            className="rounded-full border border-border bg-white px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
            onClick={onClose}
            type="button"
          >
            Collapse
          </button>
        ) : null}
      </div>

      {!selectedFile ? (
        <label
          className={joinClasses(
            "mt-4 flex min-h-[13rem] cursor-pointer flex-col items-center justify-center rounded-[1.25rem] border border-dashed px-5 py-8 text-center transition",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border bg-white/70 hover:bg-white"
          )}
          onDragLeave={() => setIsDragging(false)}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDrop={handleDrop}
        >
          <input
            className="sr-only"
            onChange={(event) => handleFile(event.target.files?.item(0) ?? null)}
            ref={fileInputRef}
            type="file"
          />
          <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Step 1
          </span>
          <p className="mt-4 text-lg font-semibold text-foreground">Drag and drop a file</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Or click here to browse. After choosing the file, you will label it and link it to the
            right task or budget line.
          </p>
          <span className="mt-4 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground">
            Browse files
          </span>
        </label>
      ) : (
        <form
          className="mt-4 grid gap-4"
          onSubmit={form.handleSubmit(async (values) => {
            if (!selectedFile) {
              setFileError("Select a file to upload.");
              return;
            }

            await onSubmit({
              title: values.title,
              category: values.category,
              notes: values.notes || null,
              linkedTaskId: values.linkedTaskId || null,
              linkedBudgetItemId: values.linkedBudgetItemId || null,
              file: selectedFile
            });

            form.reset({
              title: "",
              category: "PERMIT",
              notes: "",
              linkedTaskId: "",
              linkedBudgetItemId: ""
            });
            handleFile(null);
            onClose?.();
          })}
        >
          <div className="rounded-[1.25rem] border border-border bg-white px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Step 2
                </p>
                <p className="mt-1 font-medium text-foreground">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(selectedFile.size)} • Review and link before upload
                </p>
              </div>
              <button
                className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
                onClick={() => handleFile(null)}
                type="button"
              >
                Change file
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <label className="space-y-2 xl:col-span-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Title
              </span>
              <input
                className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
                {...form.register("title")}
              />
            </label>

            <label className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Category
              </span>
              <select
                className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
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
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Linked task
              </span>
              <select
                className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
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
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Budget item
              </span>
              <select
                className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
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
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Notes
              </span>
              <textarea
                className="min-h-28 w-full rounded-[1rem] border border-border bg-white px-4 py-3"
                {...form.register("notes")}
              />
            </label>

            <div className="flex items-end justify-end xl:col-span-6">
              <button
                className="rounded-[1rem] bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
                disabled={isUploading}
                type="submit"
              >
                {isUploading ? "Uploading..." : "Upload document"}
              </button>
            </div>
          </div>
        </form>
      )}

      {fileError ? <p className="mt-3 text-sm text-red-700">{fileError}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
