import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export function DocumentTable({
  documents
}: {
  documents: Array<{
    id: string;
    title: string;
    originalName: string;
    storagePath: string;
    category: string;
    notes: string | null;
    uploadedBy: { name: string };
    linkedTask: { id: string; title: string } | null;
    linkedBudgetItem: { id: string; lineItem: string } | null;
    createdAt: Date;
  }>;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Document</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Linked record</TableHead>
          <TableHead>Uploaded by</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((document) => (
          <TableRow key={document.id}>
            <TableCell>
              <p className="font-medium">{document.title}</p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  className="text-xs text-primary hover:underline"
                  href={`/api/documents/${document.id}`}
                  target="_blank"
                >
                  Open {document.originalName}
                </Link>
                <Link
                  className="text-xs text-primary hover:underline"
                  href={`/api/documents/${document.id}?download=1`}
                >
                  Download
                </Link>
              </div>
              {document.notes ? <p className="mt-1 text-xs text-muted-foreground">{document.notes}</p> : null}
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{document.category.replaceAll("_", " ")}</Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {document.linkedTask?.title ?? document.linkedBudgetItem?.lineItem ?? "Unlinked"}
            </TableCell>
            <TableCell>{document.uploadedBy.name}</TableCell>
            <TableCell>{formatDate(document.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
