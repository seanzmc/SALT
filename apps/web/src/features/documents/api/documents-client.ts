import type {
  DocumentListFilters,
  DocumentListResponse,
  DocumentTaskLinkInput,
  DocumentTaskUnlinkInput,
  DocumentUploadMetadataInput,
  DocumentWorkspaceData
} from "@salt/types";

import { ApiClientError, apiClient } from "../../../lib/api-client";

function buildDocumentQuery(filters: DocumentListFilters) {
  const searchParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `/api/documents?${query}` : "/api/documents";
}

export function getDocumentList(filters: DocumentListFilters) {
  return apiClient<DocumentListResponse>(buildDocumentQuery(filters), {
    method: "GET"
  });
}

export function getDocumentWorkspace(documentId: string) {
  return apiClient<DocumentWorkspaceData>(`/api/documents/${documentId}`, {
    method: "GET"
  });
}

export async function uploadDocument(input: DocumentUploadMetadataInput & { file: File }) {
  const formData = new FormData();
  formData.set("title", input.title);
  formData.set("category", input.category);
  formData.set("notes", input.notes ?? "");
  formData.set("linkedTaskId", input.linkedTaskId ?? "");
  formData.set("linkedBudgetItemId", input.linkedBudgetItemId ?? "");
  formData.set("file", input.file);

  const response = await fetch("/api/documents/upload", {
    method: "POST",
    body: formData,
    credentials: "include"
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new ApiClientError(
      payload.error?.message ?? payload.error ?? "Upload failed.",
      response.status,
      payload
    );
  }

  return payload as DocumentWorkspaceData;
}

export function linkDocumentToTask(payload: DocumentTaskLinkInput) {
  return apiClient<DocumentWorkspaceData>(`/api/documents/${payload.documentId}/tasks`, {
    method: "POST",
    body: JSON.stringify({ taskId: payload.taskId })
  });
}

export function unlinkDocumentFromTask(payload: DocumentTaskUnlinkInput) {
  return apiClient<DocumentWorkspaceData>(
    `/api/documents/${payload.documentId}/tasks/${payload.taskId}`,
    {
      method: "DELETE"
    }
  );
}
