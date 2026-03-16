import { useMemo, useState } from "react";
import type { DocumentListResponse } from "@salt/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

type ExistingDocumentPickerProps = {
  documents: DocumentListResponse["documents"];
  emptyMessage: string;
  excludedDocumentIds?: string[];
  selectedDocumentIds: string[];
  onToggleDocument: (documentId: string) => void;
};

export function ExistingDocumentPicker({
  documents,
  emptyMessage,
  excludedDocumentIds = [],
  selectedDocumentIds,
  onToggleDocument
}: ExistingDocumentPickerProps) {
  const [search, setSearch] = useState("");
  const excludedIds = useMemo(() => new Set(excludedDocumentIds), [excludedDocumentIds]);
  const selectedIds = useMemo(() => new Set(selectedDocumentIds), [selectedDocumentIds]);

  const visibleDocuments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return documents.filter((document) => {
      if (excludedIds.has(document.id) && !selectedIds.has(document.id)) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        document.title,
        document.originalName,
        document.linkedTask?.title,
        document.linkedBudgetItem?.lineItem,
        document.notes
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [documents, excludedIds, search, selectedIds]);

  return (
    <div className="space-y-3 rounded-[1rem] border border-border bg-muted/18 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium text-foreground">Link existing documents</p>
          <p className="text-sm text-muted-foreground">
            Select documents that already exist in the vault. This does not upload a new file.
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {selectedDocumentIds.length} selected
        </span>
      </div>

      <label className="space-y-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Find a document
        </span>
        <input
          className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search title, file name, notes, or linked work"
          type="search"
          value={search}
        />
      </label>

      <div className="max-h-64 space-y-2 overflow-y-auto">
        {visibleDocuments.length === 0 ? (
          <div className="rounded-[1rem] border border-dashed border-border bg-white px-4 py-4 text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          visibleDocuments.map((document) => {
            const isSelected = selectedIds.has(document.id);

            return (
              <label
                key={document.id}
                className="flex cursor-pointer items-start gap-3 rounded-[1rem] border border-border bg-white px-4 py-3 hover:bg-muted/35"
              >
                <input
                  checked={isSelected}
                  className="mt-1 h-4 w-4 rounded border-border"
                  onChange={() => onToggleDocument(document.id)}
                  type="checkbox"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{document.title}</p>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      {document.category.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {document.originalName} • Added {formatDate(document.createdAt)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {document.linkedTask?.title ??
                      document.linkedBudgetItem?.lineItem ??
                      "Not linked as a primary document"}
                  </p>
                </div>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
