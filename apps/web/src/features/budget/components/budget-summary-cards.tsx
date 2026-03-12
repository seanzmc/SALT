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
    <section className="rounded-[1.5rem] border border-border bg-white/85 p-5 shadow-sm backdrop-blur">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p
        className={[
          "mt-3 text-3xl font-semibold",
          tone === "negative"
            ? "text-rose-600"
            : tone === "positive"
              ? "text-emerald-600"
              : "text-foreground"
        ].join(" ")}
      >
        {value}
      </p>
    </section>
  );
}

export function BudgetSummaryCards({ totals }: { totals: BudgetTotals }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <SummaryCard title="Estimated total" value={formatCurrency(totals.estimated)} />
      <SummaryCard title="Actual total" value={formatCurrency(totals.actual)} />
      <SummaryCard
        title="Variance"
        tone={totals.variance > 0 ? "negative" : "positive"}
        value={formatCurrency(totals.variance)}
      />
      <SummaryCard title="Must-have" value={formatCurrency(totals.mustHave)} />
      <SummaryCard title="Can phase in / optional" value={formatCurrency(totals.optional)} />
    </section>
  );
}
