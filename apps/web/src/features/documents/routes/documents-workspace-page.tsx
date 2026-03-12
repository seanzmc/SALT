import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DocumentRecord, DocumentWorkspaceData } from "@salt/types";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { ApiClientError } from "../../../lib/api-client";
import { useAuthSessionQuery } from "../../auth/hooks/use-auth-session-query";
import {
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

export function DocumentsWorkspacePage() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [uploadError, setUploadError] = useState<string>();
  const [linkError, setLinkError] = useState<string>();
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
      setUploadError(
        error instanceof ApiClientError ? error.message : "Unable to upload document."
      );
    },
    onSuccess: async (data) => {
      setUploadError(undefined);
      if (!data.document) {
        return;
      }

      queryClient.setQueryData(documentQueryKeys.detail(data.document.id), data);
      await queryClient.invalidateQueries({ queryKey: documentQueryKeys.lists() });
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
      setLinkError(error instanceof ApiClientError ? error.message : "Unable to link document.");
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
      setLinkError(
        error instanceof ApiClientError ? error.message : "Unable to unlink document."
      );
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
    }
  });

  const currentUser = sessionQuery.data?.user;
  const search = buildDocumentSearchParams(searchState).toString();
  const documents = documentsQuery.data?.documents ?? [];

  function prefetchDocument(documentId: string) {
    void queryClient.prefetchQuery({
      queryKey: documentQueryKeys.detail(documentId),
      queryFn: () => getDocumentWorkspace(documentId)
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-border bg-white/85 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.4)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Documents v2</p>
        <h2 className="mt-2 text-3xl font-semibold">Protected document flow</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Query-driven document search, authenticated open/download, and task linking on the new
          SPA/API stack.
        </p>
      </section>

      <DocumentUploadPanel
        budgetItems={documentsQuery.data?.budgetItems ?? []}
        error={uploadError}
        isUploading={uploadMutation.isPending}
        onSubmit={async (payload) => {
          await uploadMutation.mutateAsync(payload);
        }}
        tasks={documentsQuery.data?.tasks ?? []}
      />

      <section className="rounded-[1.75rem] border border-border bg-white/85 p-5 shadow-sm backdrop-blur">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem]">
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Search
            </span>
            <input
              className="w-full rounded-2xl border border-border bg-card px-4 py-3"
              onChange={(event) =>
                setSearchParams(updateDocumentsSearchState(searchParams, { q: event.target.value }), {
                  replace: true
                })
              }
              placeholder="Search title, notes, or original file name"
              type="search"
              value={searchState.q}
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Category
            </span>
            <select
              className="w-full rounded-2xl border border-border bg-card px-4 py-3"
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
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] xl:items-start">
        <div className="space-y-4">
          {documentsQuery.error instanceof ApiClientError ? (
            <div className="rounded-[1.75rem] border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              {documentsQuery.error.message}
            </div>
          ) : null}

          <DocumentListPanel
            activeDocumentId={selectedDocumentId}
            documents={documents}
            onPrefetchDocument={prefetchDocument}
            search={search ? `?${search}` : ""}
          />
        </div>

        <div className="min-w-0">
          {selectedDocumentId ? (
            documentQuery.isLoading ? (
              <section className="rounded-[1.75rem] border border-border bg-card/90 p-5 text-sm text-muted-foreground shadow-sm xl:sticky xl:top-6">
                Loading document…
              </section>
            ) : documentQuery.data && currentUser ? (
              <DocumentShelf
                currentUser={currentUser}
                data={documentQuery.data}
                error={linkError}
                isSaving={linkMutation.isPending || unlinkMutation.isPending}
                onClose={() =>
                  navigate({
                    pathname: "/documents",
                    search
                  })
                }
                onLinkTask={async (payload) => {
                  await linkMutation.mutateAsync(payload);
                }}
                onUnlinkTask={async (payload) => {
                  await unlinkMutation.mutateAsync(payload);
                }}
              />
            ) : (
              <section className="rounded-[1.75rem] border border-border bg-card/90 p-5 text-sm text-muted-foreground shadow-sm">
                Document unavailable.
              </section>
            )
          ) : (
            <section className="flex min-h-[24rem] items-center justify-center rounded-[1.75rem] border border-dashed border-border bg-card/80 p-8 text-center shadow-sm xl:sticky xl:top-6">
              <div>
                <p className="font-medium">Select a document to review protected access and links.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  The left list stays stable while the right shelf handles downloads and task links.
                </p>
                {documents[0] ? (
                  <Link
                    className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                    to={{
                      pathname: `/documents/${documents[0].id}`,
                      search
                    }}
                  >
                    Open first visible document
                  </Link>
                ) : null}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
