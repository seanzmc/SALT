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
  function isOpenableStoragePath(storagePath: string) {
    return storagePath.startsWith("/") || storagePath.startsWith("http://") || storagePath.startsWith("https://");
  }

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
              {isOpenableStoragePath(document.storagePath) ? (
                <Link className="text-xs text-primary hover:underline" href={document.storagePath} target="_blank">
                  {document.originalName}
                </Link>
              ) : (
                <p className="text-xs text-muted-foreground">{document.originalName}</p>
              )}
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
