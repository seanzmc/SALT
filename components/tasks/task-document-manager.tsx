"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { DocumentCategory } from "@prisma/client";

import {
  linkTaskDocumentFeedbackAction,
  unlinkTaskDocumentFeedbackAction
} from "@/server/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";

const documentCategories = [
  { value: DocumentCategory.PERMIT, label: "Permit" },
  { value: DocumentCategory.CONTRACT, label: "Contract" },
  { value: DocumentCategory.INSURANCE, label: "Insurance" },
  { value: DocumentCategory.VENDOR_QUOTE, label: "Vendor quote" },
  { value: DocumentCategory.EQUIPMENT_SPEC, label: "Equipment spec" },
  { value: DocumentCategory.FLOOR_PLAN, label: "Floor plan" },
  { value: DocumentCategory.INSPECTION_RECORD, label: "Inspection record" },
  { value: DocumentCategory.POLICY_MANUAL, label: "Policy/manual" },
  { value: DocumentCategory.COMPLIANCE_DOCUMENT, label: "Compliance document" },
  { value: DocumentCategory.INVOICE, label: "Invoice" },
  { value: DocumentCategory.PHOTO, label: "Photo" },
  { value: DocumentCategory.OTHER, label: "Other" }
] as const;

type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const initialState: ActionState = { status: "idle" };

function SubmitButton({
  idleLabel,
  pendingLabel,
  variant = "default"
}: {
  idleLabel: string;
  pendingLabel: string;
  variant?: "default" | "outline" | "danger";
}) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} type="submit" variant={variant}>
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}

function FormMessage({ state }: { state: ActionState }) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  return (
    <p className={`text-sm ${state.status === "success" ? "text-emerald-700" : "text-danger"}`}>
      {state.message}
    </p>
  );
}

export function TaskDocumentManager({
  taskId,
  isArchived,
  canManageDocuments,
  attachments,
  availableDocuments
}: {
  taskId: string;
  isArchived: boolean;
  canManageDocuments: boolean;
  attachments: Array<{
    id: string;
    document: {
      id: string;
      title: string;
      category: DocumentCategory;
      notes: string | null;
      originalName: string;
      storagePath: string;
      uploadedBy: { name: string };
      createdAt: Date;
    };
  }>;
  availableDocuments: Array<{
    id: string;
    title: string;
    category: DocumentCategory;
    createdAt: Date;
    linkedTask: { title: string } | null;
  }>;
}) {
  const router = useRouter();
  const [uploadMessage, setUploadMessage] = useState("");
  const [isUploading, startUploadTransition] = useTransition();
  const [linkState, linkAction] = useFormState(linkTaskDocumentFeedbackAction, initialState);

  async function onUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploadMessage("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData
    });
    const payload = await response.json();

    if (!response.ok) {
      setUploadMessage(payload.error ?? "Upload failed.");
      return;
    }

    event.currentTarget.reset();
    setUploadMessage("Document uploaded and linked to this task.");
    startUploadTransition(() => {
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {attachments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            No documents are linked to this task yet. Attach permits, quotes, SOPs, photos, or inspection records here so the task carries its working files.
          </div>
        ) : (
          <div className="space-y-3">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{attachment.document.title}</p>
                      <Badge variant="secondary">
                        {attachment.document.category.replaceAll("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Added by {attachment.document.uploadedBy.name} on {formatDate(attachment.document.createdAt)}
                    </p>
                    {attachment.document.notes ? (
                      <p className="text-sm text-muted-foreground">{attachment.document.notes}</p>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        className="text-sm text-primary hover:underline"
                        href={`/api/documents/${attachment.document.id}`}
                        target="_blank"
                      >
                        Open {attachment.document.originalName}
                      </Link>
                      <Link
                        className="text-sm text-primary hover:underline"
                        href={`/api/documents/${attachment.document.id}?download=1`}
                      >
                        Download
                      </Link>
                    </div>
                  </div>
                  {canManageDocuments && !isArchived ? (
                    <UnlinkDocumentForm documentId={attachment.document.id} taskId={taskId} />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        {isArchived ? (
          <p className="text-sm text-muted-foreground">
            Restore this task before linking or uploading additional documents.
          </p>
        ) : canManageDocuments ? (
          <>
            <form action={linkAction} className="space-y-3 rounded-xl border border-border bg-secondary/20 p-4">
              <input type="hidden" name="taskId" value={taskId} />
              <div className="space-y-2">
                <Label htmlFor="documentId">Link existing document</Label>
                <Select defaultValue="" id="documentId" name="documentId">
                  <option value="">Select a document</option>
                  {availableDocuments.map((document) => (
                    <option key={document.id} value={document.id}>
                      {document.title} | {document.category.replaceAll("_", " ")} | {formatDate(document.createdAt)}
                      {document.linkedTask ? ` | Primary: ${document.linkedTask.title}` : ""}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <SubmitButton
                  idleLabel="Link document"
                  pendingLabel="Linking..."
                  variant="outline"
                />
                <FormMessage state={linkState} />
              </div>
              {availableDocuments.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  All available documents are already linked to this task.
                </p>
              ) : null}
            </form>

            <form onSubmit={onUpload} className="space-y-4 rounded-xl border border-border bg-secondary/20 p-4">
              <input name="linkedTaskId" type="hidden" value={taskId} />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="task-document-title">Document title</Label>
                  <Input id="task-document-title" name="title" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-document-category">Category</Label>
                  <Select id="task-document-category" name="category" required>
                    {documentCategories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="task-document-notes">Notes</Label>
                  <Textarea id="task-document-notes" name="notes" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="task-document-file">File</Label>
                  <Input id="task-document-file" name="file" required type="file" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button disabled={isUploading} type="submit">
                  {isUploading ? "Uploading..." : "Upload and attach"}
                </Button>
                {uploadMessage ? <p className="text-sm text-muted-foreground">{uploadMessage}</p> : null}
              </div>
            </form>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            You can review linked documents here. Only task owners or the assigned collaborator can manage attachments.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function UnlinkDocumentForm({
  taskId,
  documentId
}: {
  taskId: string;
  documentId: string;
}) {
  const [state, action] = useFormState(unlinkTaskDocumentFeedbackAction, initialState);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="documentId" value={documentId} />
      <SubmitButton idleLabel="Unlink" pendingLabel="Unlinking..." variant="outline" />
      <FormMessage state={state} />
    </form>
  );
}
