import type { DocumentListResponse } from "@salt/types";
import { Link } from "react-router-dom";

type DocumentListPanelProps = {
  documents: DocumentListResponse["documents"];
  activeDocumentId?: string;
  search: string;
  onPrefetchDocument: (documentId: string) => void;
};

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export function DocumentListPanel({
  documents,
  activeDocumentId,
  search,
  onPrefetchDocument
}: DocumentListPanelProps) {
  if (documents.length === 0) {
    return (
      <div className="rounded-[1.25rem] border border-dashed border-border bg-muted/25 px-4 py-8 text-center text-sm text-muted-foreground">
        No documents match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-white">
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          {documents.length} visible document{documents.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="divide-y divide-border/70">
        {documents.map((document) => {
          const isActive = document.id === activeDocumentId;

          return (
            <Link
              key={document.id}
              className={joinClasses(
                "block px-4 py-4 transition",
                isActive ? "bg-primary/5" : "hover:bg-muted/35"
              )}
              onMouseEnter={() => onPrefetchDocument(document.id)}
              to={{
                pathname: `/documents/${document.id}`,
                search
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{document.title}</p>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      {document.category.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {document.linkedTask?.title ??
                      document.linkedBudgetItem?.lineItem ??
                      "Unlinked document"}
                  </p>
                </div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  {formatDate(document.createdAt)}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                <span className="rounded-full border border-border px-2.5 py-1">
                  {document.originalName}
                </span>
                <span className="rounded-full border border-border px-2.5 py-1">
                  {document.attachedTasks.length} task link
                  {document.attachedTasks.length === 1 ? "" : "s"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
