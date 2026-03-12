import type { DocumentListFilters } from "@salt/types";

export const documentQueryKeys = {
  all: ["documents"] as const,
  lists: () => ["documents", "list"] as const,
  list: (filters: DocumentListFilters & { q?: string }) =>
    ["documents", "list", filters] as const,
  detail: (documentId: string) => ["documents", "detail", documentId] as const
};
