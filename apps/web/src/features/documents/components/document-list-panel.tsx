import type { DocumentListResponse } from "@salt/types";
import { Link } from "react-router-dom";

type DocumentListPanelProps = {
  documents: DocumentListResponse["documents"];
  activeDocumentId?: string;
  search: string;
  onPrefetchDocument: (documentId: string) => void;
};

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
  return (
    <section className="rounded-[1.75rem] border border-border bg-card/90 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Document vault</p>
          <p className="text-sm text-muted-foreground">
            Search the protected file set without losing selection context.
          </p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          {documents.length} shown
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/35 p-6 text-sm text-muted-foreground">
            No documents match the current filters.
          </div>
        ) : null}

        {documents.map((document) => {
          const isActive = document.id === activeDocumentId;

          return (
            <Link
              key={document.id}
              className={[
                "block rounded-[1.4rem] border px-4 py-4 transition-colors",
                isActive
                  ? "border-primary bg-primary/5 shadow-[inset_3px_0_0_0_hsl(var(--primary))]"
                  : "border-border hover:bg-muted/70"
              ].join(" ")}
              onMouseEnter={() => onPrefetchDocument(document.id)}
              to={{
                pathname: `/documents/${document.id}`,
                search
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{document.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {document.linkedTask?.title ?? document.linkedBudgetItem?.lineItem ?? "Unlinked"}
                  </p>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  {document.category.replaceAll("_", " ")}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border border-border px-2 py-1">
                  {document.originalName}
                </span>
                <span className="rounded-full border border-border px-2 py-1">
                  Added {formatDate(document.createdAt)}
                </span>
                <span className="rounded-full border border-border px-2 py-1">
                  {document.attachedTasks.length} task link{document.attachedTasks.length === 1 ? "" : "s"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
