import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent } from "@/lib/utils";

export function SectionProgress({
  sections
}: {
  sections: Array<{
    slug: string;
    title: string;
    complete: number;
    total: number;
    percent: number;
  }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Checklist Completion by Section</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sections.map((section) => (
          <div key={section.slug} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Link
                className="font-medium hover:text-primary"
                href={`/checklists?section=${section.slug}`}
              >
                {section.title}
              </Link>
              <Badge variant="secondary">
                {section.complete}/{section.total} • {formatPercent(section.percent)}
              </Badge>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${section.percent}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
