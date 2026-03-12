import type { DocumentListResponse, DocumentRecord, DocumentWorkspaceData } from "@salt/types";

function toIsoString(value: Date | null) {
  return value ? value.toISOString() : null;
}

export function serializeDocumentRecord(document: {
  id: string;
  title: string;
  originalName: string;
  storagePath: string;
  mimeType: string;
  size: number;
  category: DocumentRecord["category"];
  notes: string | null;
  createdAt: Date;
  uploadedBy: {
    id: string;
    name: string;
  };
  linkedTask: {
    id: string;
    title: string;
  } | null;
  linkedBudgetItem: {
    id: string;
    lineItem: string;
  } | null;
  taskAttachments: Array<{
    task: {
      id: string;
      title: string;
      archivedAt: Date | null;
    };
  }>;
}): DocumentRecord {
  return {
    id: document.id,
    title: document.title,
    originalName: document.originalName,
    storagePath: document.storagePath,
    mimeType: document.mimeType,
    size: document.size,
    category: document.category,
    notes: document.notes,
    createdAt: document.createdAt.toISOString(),
    uploadedBy: document.uploadedBy,
    linkedTask: document.linkedTask,
    linkedBudgetItem: document.linkedBudgetItem,
    attachedTasks: document.taskAttachments.map((attachment) => ({
      id: attachment.task.id,
      title: attachment.task.title,
      archivedAt: toIsoString(attachment.task.archivedAt)
    }))
  };
}

export function serializeDocumentListResponse(input: {
  documents: Parameters<typeof serializeDocumentRecord>[0][];
  tasks: DocumentListResponse["tasks"];
  budgetItems: DocumentListResponse["budgetItems"];
}): DocumentListResponse {
  return {
    documents: input.documents.map(serializeDocumentRecord),
    tasks: input.tasks,
    budgetItems: input.budgetItems
  };
}

export function serializeDocumentWorkspace(input: {
  document: Parameters<typeof serializeDocumentRecord>[0] | null;
  tasks: DocumentWorkspaceData["tasks"];
  budgetItems: DocumentWorkspaceData["budgetItems"];
}): DocumentWorkspaceData {
  return {
    document: input.document ? serializeDocumentRecord(input.document) : null,
    tasks: input.tasks,
    budgetItems: input.budgetItems
  };
}
