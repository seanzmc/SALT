import type { UserRole } from "./auth.js";

export const DOCUMENT_CATEGORY_VALUES = [
  "PERMIT",
  "CONTRACT",
  "INSURANCE",
  "VENDOR_QUOTE",
  "EQUIPMENT_SPEC",
  "FLOOR_PLAN",
  "INSPECTION_RECORD",
  "POLICY_MANUAL",
  "COMPLIANCE_DOCUMENT",
  "INVOICE",
  "PHOTO",
  "OTHER"
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORY_VALUES)[number];

export type DocumentTaskReference = {
  id: string;
  title: string;
  archivedAt: string | null;
  assignedToId: string | null;
  assignedTo: {
    id: string;
    name: string;
    role?: UserRole;
  } | null;
};

export type DocumentBudgetReference = {
  id: string;
  lineItem: string;
};

export type DocumentRecord = {
  id: string;
  title: string;
  originalName: string;
  storagePath: string;
  mimeType: string;
  size: number;
  category: DocumentCategory;
  notes: string | null;
  createdAt: string;
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
  attachedTasks: Array<{
    id: string;
    title: string;
    archivedAt: string | null;
  }>;
};

export type DocumentListFilters = {
  q?: string;
  category?: DocumentCategory;
};

export type DocumentListResponse = {
  documents: DocumentRecord[];
  tasks: DocumentTaskReference[];
  budgetItems: DocumentBudgetReference[];
};

export type DocumentWorkspaceData = {
  document: DocumentRecord | null;
  tasks: DocumentTaskReference[];
  budgetItems: DocumentBudgetReference[];
};

export type DocumentUploadMetadataInput = {
  title: string;
  category: DocumentCategory;
  notes: string | null;
  linkedTaskId: string | null;
  linkedBudgetItemId: string | null;
};

export type DocumentTaskLinkInput = {
  documentId: string;
  taskId: string;
};

export type DocumentTaskUnlinkInput = {
  documentId: string;
  taskId: string;
};

export type DocumentDeleteInput = {
  documentId: string;
};
