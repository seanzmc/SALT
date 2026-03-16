import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DocumentRecord, DocumentWorkspaceData } from "@salt/types";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { ApiClientError } from "../../../lib/api-client";
import { SlideOverPanel } from "../../../app/components/slide-over-panel";
import {
  WorkspacePageHeader,
  WorkspaceSurface
} from "../../../app/components/workspace-page";
import { useToast } from "../../../app/providers/toast-provider";
import { useAuthSessionQuery } from "../../auth/hooks/use-auth-session-query";
import {
  deleteDocument,
  getDocumentList,
  getDocumentWorkspace,
  linkDocumentToTask,
  unlinkDocumentFromTask,
  uploadDocument
} from "../api/documents-client";
import { DocumentListPanel } from "../components/document-list-panel";
import { DocumentShelf } from "../components/document-shelf";
import { DocumentUploadPanel } from "../components/document-upload-panel";
import { documentQueryKeys } from "../lib/query-keys";
import {
  buildDocumentSearchParams,
  getDocumentsSearchState,
  toDocumentListFilters,
  updateDocumentsSearchState
} from "../lib/url-state";

function updateDocumentInList(
  current: ReturnType<typeof getDocumentList> extends Promise<infer T> ? T : never,
  document: DocumentRecord
) {
  return {
    ...current,
    documents: current.documents.map((item) => (item.id === document.id ? document : item))
  };
}

function removeDocumentFromList(
  current: ReturnType<typeof getDocumentList> extends Promise<infer T> ? T : never,
  documentId: string
) {
  return {
    ...current,
    documents: current.documents.filter((item) => item.id !== documentId)
  };
}

export function DocumentsWorkspacePage() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [uploadError, setUploadError] = useState<string>();
  const [linkError, setLinkError] = useState<string>();
  const [deleteError, setDeleteError] = useState<string>();
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [documentShelfExpanded, setDocumentShelfExpanded] = useState(false);
  const toast = useToast();
  const sessionQuery = useAuthSessionQuery();

  const selectedDocumentId = params.documentId;
  const searchState = getDocumentsSearchState(searchParams);
  const deferredSearch = useDeferredValue(searchState.q);
  const filters = useMemo(
    () => toDocumentListFilters(searchState, { q: deferredSearch }),
    [deferredSearch, searchState]
  );
  const listKey = documentQueryKeys.list(filters);

  const documentsQuery = useQuery({
    queryKey: listKey,
    queryFn: () => getDocumentList(filters),
    placeholderData: (previous) => previous
  });

  const documentQuery = useQuery({
    queryKey: selectedDocumentId
      ? documentQueryKeys.detail(selectedDocumentId)
      : ["documents", "detail", "none"],
    queryFn: () => getDocumentWorkspace(selectedDocumentId!),
    enabled: Boolean(selectedDocumentId)
  });

  const uploadMutation = useMutation({
    mutationFn: uploadDocument,
    onError: (error) => {
      const message =
        error instanceof ApiClientError ? error.message : "Unable to upload document.";
      setUploadError(message);
      toast.error("Document upload failed", message);
    },
    onSuccess: async (data) => {
      setUploadError(undefined);
      if (!data.document) {
        return;
      }

      queryClient.setQueryData(documentQueryKeys.detail(data.document.id), data);
      await queryClient.invalidateQueries({ queryKey: documentQueryKeys.lists() });
      toast.success("Document uploaded", data.document.title);
      setShowUploadPanel(false);
      navigate({
        pathname: `/documents/${data.document.id}`,
        search: buildDocumentSearchParams(searchState).toString()
      });
    }
  });

  const linkMutation = useMutation({
    mutationFn: linkDocumentToTask,
    onMutate: async (payload) => {
      setLinkError(undefined);

      if (!selectedDocumentId) {
        return {};
      }

      await queryClient.cancelQueries({ queryKey: documentQueryKeys.detail(selectedDocumentId) });
      const previousDetail = queryClient.getQueryData<DocumentWorkspaceData>(
        documentQueryKeys.detail(selectedDocumentId)
      );
      const task = documentQuery.data?.tasks.find((item) => item.id === payload.taskId);

      if (task) {
        queryClient.setQueryData<DocumentWorkspaceData>(
          documentQueryKeys.detail(selectedDocumentId),
          (current) =>
            current?.document
              ? {
                  ...current,
                  document: {
                    ...current.document,
                    linkedTask: current.document.linkedTask ?? {
                      id: task.id,
                      title: task.title
                    },
                    attachedTasks: [
                      ...current.document.attachedTasks,
                      {
                        id: task.id,
                        title: task.title,
                        archivedAt: task.archivedAt
                      }
                    ]
                  }
                }
              : current
        );
      }

      return { previousDetail };
    },
    onError: (error, _payload, context) => {
      const message =
        error instanceof ApiClientError ? error.message : "Unable to link document.";
      setLinkError(message);
      toast.error("Document link failed", message);
      if (selectedDocumentId && context?.previousDetail) {
        queryClient.setQueryData(documentQueryKeys.detail(selectedDocumentId), context.previousDetail);
      }
    },
    onSuccess: async (data) => {
      setLinkError(undefined);
      if (!data.document) {
        return;
      }

      queryClient.setQueryData(documentQueryKeys.detail(data.document.id), data);
      queryClient.setQueryData(listKey, (current: any) =>
        current ? updateDocumentInList(current, data.document!) : current
      );
      await queryClient.invalidateQueries({ queryKey: documentQueryKeys.lists() });
      toast.success("Document linked to task");
    }
  });

  const unlinkMutation = useMutation({
    mutationFn: unlinkDocumentFromTask,
    onMutate: async (payload) => {
      setLinkError(undefined);

      if (!selectedDocumentId) {
        return {};
      }

      await queryClient.cancelQueries({ queryKey: documentQueryKeys.detail(selectedDocumentId) });
      const previousDetail = queryClient.getQueryData<DocumentWorkspaceData>(
        documentQueryKeys.detail(selectedDocumentId)
      );

      queryClient.setQueryData<DocumentWorkspaceData>(
        documentQueryKeys.detail(selectedDocumentId),
        (current) =>
          current?.document
            ? {
                ...current,
                document: {
                  ...current.document,
                  linkedTask:
                    current.document.linkedTask?.id === payload.taskId ? null : current.document.linkedTask,
                  attachedTasks: current.document.attachedTasks.filter((task) => task.id !== payload.taskId)
                }
              }
            : current
      );

      return { previousDetail };
    },
    onError: (error, _payload, context) => {
      const message =
        error instanceof ApiClientError ? error.message : "Unable to unlink document.";
      setLinkError(message);
      toast.error("Document unlink failed", message);
      if (selectedDocumentId && context?.previousDetail) {
        queryClient.setQueryData(documentQueryKeys.detail(selectedDocumentId), context.previousDetail);
      }
    },
    onSuccess: async (data) => {
      setLinkError(undefined);
      if (!data.document) {
        return;
      }

      queryClient.setQueryData(documentQueryKeys.detail(data.document.id), data);
      queryClient.setQueryData(listKey, (current: any) =>
        current ? updateDocumentInList(current, data.document!) : current
      );
      await queryClient.invalidateQueries({ queryKey: documentQueryKeys.lists() });
      toast.success("Document unlinked from task");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onMutate: async (payload) => {
      setDeleteError(undefined);
      await queryClient.cancelQueries({ queryKey: documentQueryKeys.lists() });
      const previousLists = queryClient.getQueriesData({ queryKey: documentQueryKeys.lists() });

      queryClient.setQueriesData({ queryKey: documentQueryKeys.lists() }, (current: any) =>
        current ? removeDocumentFromList(current, payload.documentId) : current
      );

      return { previousLists };
    },
    onError: (error, _payload, context) => {
      const message =
        error instanceof ApiClientError ? error.message : "Unable to delete document.";
      setDeleteError(message);
      toast.error("Document delete failed", message);

      context?.previousLists.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSuccess: async (result) => {
      setDeleteError(undefined);
      queryClient.removeQueries({ queryKey: documentQueryKeys.detail(result.documentId) });
      await queryClient.invalidateQueries({ queryKey: documentQueryKeys.lists() });
      toast.success("Document deleted", result.title);

      navigate({
        pathname: "/documents",
        search
      });
    }
  });

  const currentUser = sessionQuery.data?.user;
  const search = buildDocumentSearchParams(searchState).toString();
  const documents = documentsQuery.data?.documents ?? [];

  useEffect(() => {
    if (!selectedDocumentId) {
      setDocumentShelfExpanded(false);
    }
  }, [selectedDocumentId]);

  useEffect(() => {
    setDeleteError(undefined);
  }, [selectedDocumentId]);

  function prefetchDocument(documentId: string) {
    void queryClient.prefetchQuery({
      queryKey: documentQueryKeys.detail(documentId),
      queryFn: () => getDocumentWorkspace(documentId)
    });
  }

  return (
    <div className="space-y-6">
      <WorkspacePageHeader
        actions={
          <button
            className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            onClick={() => setShowUploadPanel((current) => !current)}
            type="button"
          >
            {showUploadPanel ? "Hide upload" : "Upload document"}
          </button>
        }
        description="Keep document discovery, upload, and task linking inside one vault surface. Opening a file slides the same document shelf over the workspace."
        eyebrow="Documents"
        title="Document workspace"
      />

      <WorkspaceSurface
        actions={
          <span className="rounded-full bg-muted px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {documents.length} visible
          </span>
        }
        bodyClassName="space-y-4"
        description="Choose a file first, then confirm metadata and links. Search and category filters stay attached to the vault list they control."
        title="Document vault"
        toolbar={
          <div className="space-y-4">
            {showUploadPanel ? (
              <DocumentUploadPanel
                budgetItems={documentsQuery.data?.budgetItems ?? []}
                error={uploadError}
                isUploading={uploadMutation.isPending}
                onClose={() => setShowUploadPanel(false)}
                onSubmit={async (payload) => {
                  await uploadMutation.mutateAsync(payload);
                }}
                tasks={documentsQuery.data?.tasks ?? []}
              />
            ) : null}

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem]">
              <label className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Search
                </span>
                <input
                  className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
                  onChange={(event) =>
                    setSearchParams(
                      updateDocumentsSearchState(searchParams, { q: event.target.value }),
                      {
                        replace: true
                      }
                    )
                  }
                  placeholder="Search title, notes, or original file name"
                  type="search"
                  value={searchState.q}
                />
              </label>

              <label className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Category
                </span>
                <select
                  className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
                  onChange={(event) =>
                    setSearchParams(
                      updateDocumentsSearchState(searchParams, {
                        category: event.target.value as any
                      })
                    )
                  }
                  value={searchState.category}
                >
                  <option value="">All categories</option>
                  {[
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
                  ].map((category) => (
                    <option key={category} value={category}>
                      {category.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        }
      >
        {documentsQuery.isLoading ? (
          <div className="rounded-[1.25rem] border border-border bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
            Loading document vault...
          </div>
        ) : documentsQuery.error instanceof ApiClientError ? (
          <div className="rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            {documentsQuery.error.message}
          </div>
        ) : (
          <DocumentListPanel
            activeDocumentId={selectedDocumentId}
            documents={documents}
            onPrefetchDocument={prefetchDocument}
            search={search ? `?${search}` : ""}
          />
        )}
      </WorkspaceSurface>

      <SlideOverPanel
        expanded={documentShelfExpanded}
        onClose={() =>
          navigate({
            pathname: "/documents",
            search
          })
        }
        open={Boolean(selectedDocumentId)}
      >
        {selectedDocumentId ? (
          documentQuery.isLoading ? (
            <div className="flex h-full items-center justify-center px-6 py-8 text-sm text-muted-foreground">
              Loading document...
            </div>
          ) : documentQuery.data && currentUser ? (
            <DocumentShelf
              currentUser={currentUser}
              data={documentQuery.data}
              error={linkError}
              deleteError={deleteError}
              isDeleting={deleteMutation.isPending}
              isExpanded={documentShelfExpanded}
              isSaving={linkMutation.isPending || unlinkMutation.isPending}
              onClose={() =>
                navigate({
                  pathname: "/documents",
                  search
                })
              }
              onDeleteDocument={async (payload) => {
                await deleteMutation.mutateAsync(payload);
              }}
              onLinkTask={async (payload) => {
                await linkMutation.mutateAsync(payload);
              }}
              onToggleExpanded={() => setDocumentShelfExpanded((current) => !current)}
              onUnlinkTask={async (payload) => {
                await unlinkMutation.mutateAsync(payload);
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 py-8 text-sm text-muted-foreground">
              Document unavailable.
            </div>
          )
        ) : null}
      </SlideOverPanel>
    </div>
  );
}
