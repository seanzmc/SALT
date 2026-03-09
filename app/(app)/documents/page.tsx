import { DocumentCategory } from "@prisma/client";

import { DocumentTable } from "@/components/documents/document-table";
import { DocumentUploadForm } from "@/components/documents/document-upload-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getDocumentData } from "@/server/documents";

export default async function DocumentsPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const q = typeof searchParams.q === "string" ? searchParams.q : undefined;
  const category = typeof searchParams.category === "string" ? searchParams.category : undefined;
  const { documents, tasks, budgetItems } = await getDocumentData({ q, category });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Center"
        description="Upload and organize permits, quotes, floor plans, insurance, inspection records, policies, invoices, and buildout photos with local file storage and database metadata."
      />

      <DocumentUploadForm budgetItems={budgetItems} tasks={tasks} />

      <Card>
        <CardContent className="pt-6">
          <form className="grid gap-3 md:grid-cols-[2fr_1fr_auto]">
            <Input defaultValue={q} name="q" placeholder="Search documents" />
            <Select defaultValue={category ?? ""} name="category">
              <option value="">All categories</option>
              {Object.values(DocumentCategory).map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
            <button className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" type="submit">
              Filter
            </button>
          </form>
        </CardContent>
      </Card>

      <DocumentTable documents={documents as never} />
    </div>
  );
}
