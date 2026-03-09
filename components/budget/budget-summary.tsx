import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function BudgetSummary({
  totals
}: {
  totals: {
    estimated: number;
    actual: number;
    variance: number;
    mustHave: number;
    optional: number;
  };
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground">Estimated total</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">{formatCurrency(totals.estimated)}</CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground">Actual total</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">{formatCurrency(totals.actual)}</CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground">Variance</CardTitle>
        </CardHeader>
        <CardContent className={`text-2xl font-semibold ${totals.variance > 0 ? "text-danger" : "text-success"}`}>
          {formatCurrency(totals.variance)}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground">Must-have</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">{formatCurrency(totals.mustHave)}</CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground">Can phase in / optional</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">{formatCurrency(totals.optional)}</CardContent>
      </Card>
    </div>
  );
}
