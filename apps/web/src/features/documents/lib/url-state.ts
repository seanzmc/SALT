import type { DocumentCategory, DocumentListFilters } from "@salt/types";

export type DocumentsSearchState = {
  q: string;
  category: DocumentCategory | "";
};

const DEFAULT_STATE: DocumentsSearchState = {
  q: "",
  category: ""
};

export function getDocumentsSearchState(searchParams: URLSearchParams): DocumentsSearchState {
  return {
    q: searchParams.get("q") ?? DEFAULT_STATE.q,
    category: (searchParams.get("category") as DocumentCategory | null) ?? DEFAULT_STATE.category
  };
}

export function toDocumentListFilters(
  state: DocumentsSearchState,
  overrides: Partial<DocumentsSearchState> = {}
): DocumentListFilters {
  const next = { ...state, ...overrides };

  return {
    q: next.q || undefined,
    category: next.category || undefined
  };
}

export function buildDocumentSearchParams(state: DocumentsSearchState) {
  const searchParams = new URLSearchParams();

  if (state.q) {
    searchParams.set("q", state.q);
  }

  if (state.category) {
    searchParams.set("category", state.category);
  }

  return searchParams;
}

export function updateDocumentsSearchState(
  current: URLSearchParams,
  patch: Partial<DocumentsSearchState>
) {
  const currentState = getDocumentsSearchState(current);
  return buildDocumentSearchParams({
    ...currentState,
    ...patch
  });
}
