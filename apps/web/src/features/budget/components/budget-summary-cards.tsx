import type { BudgetTotals } from "@salt/types";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function SummaryCard({
  title,
  value,
  tone = "default"
}: {
  title: string;
  value: string;
  tone?: "default" | "positive" | "negative";
}) {
  return (
    <div className="rounded-[1rem] border border-border/70 bg-white px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </p>
      <p
        className={[
          "mt-2 text-2xl font-semibold",
          tone === "negative"
            ? "text-rose-600"
            : tone === "positive"
              ? "text-emerald-600"
              : "text-foreground"
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

export function BudgetSummaryCards({ totals }: { totals: BudgetTotals }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      <SummaryCard title="Estimated total" value={formatCurrency(totals.estimated)} />
      <SummaryCard title="Actual total" value={formatCurrency(totals.actual)} />
      <SummaryCard
        title="Variance"
        tone={totals.variance > 0 ? "negative" : "positive"}
        value={formatCurrency(totals.variance)}
      />
      <SummaryCard title="Must-have" value={formatCurrency(totals.mustHave)} />
      <SummaryCard title="Optional" value={formatCurrency(totals.optional)} />
    </div>
  );
}
