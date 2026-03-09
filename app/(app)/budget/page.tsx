import Link from "next/link";

import { BudgetSummary } from "@/components/budget/budget-summary";
import { BudgetTable } from "@/components/budget/budget-table";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { requireSession } from "@/server/authz";
import { getBudgetData } from "@/server/budget";

export default async function BudgetPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await requireSession();
  const category =
    typeof searchParams.category === "string" && searchParams.category.length > 0
      ? searchParams.category
      : undefined;
  const { categories, items } = await getBudgetData(category);

  const totals = items.reduce(
    (acc, item) => {
      const estimate = Number(item.estimate);
      const actual = Number(item.actual);

      acc.estimated += estimate;
      acc.actual += actual;
      if (item.openingPriority === "MUST_HAVE_BEFORE_OPENING") {
        acc.mustHave += estimate;
      } else {
        acc.optional += estimate;
      }

      return acc;
    },
    {
      estimated: 0,
      actual: 0,
      variance: 0,
      mustHave: 0,
      optional: 0
    }
  );
  totals.variance = totals.actual - totals.estimated;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budget"
        description="Budget lines follow the planning guide categories and starter line items. Numeric estimates are intentionally marked as placeholders until local quotes are entered."
        actions={
          <Link className={cn(buttonVariants({ variant: "outline" }))} href="/api/export/budget">
            Export CSV
          </Link>
        }
      />

      <BudgetSummary totals={totals} />

      <Card>
        <CardContent className="pt-6">
          <form className="grid gap-3 md:grid-cols-[1fr_auto]">
            <Select defaultValue={category ?? ""} name="category">
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.title}
                </option>
              ))}
            </Select>
            <button className={cn(buttonVariants({ variant: "default" }))} type="submit">
              Filter
            </button>
          </form>
        </CardContent>
      </Card>

      <BudgetTable currentRole={session.user.role} items={items as never} />
    </div>
  );
}
