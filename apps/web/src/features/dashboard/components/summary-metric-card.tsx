type SummaryMetricCardProps = {
  title: string;
  value: string;
  detail: string;
  tone?: "default" | "warning";
};

export function SummaryMetricCard({
  title,
  value,
  detail,
  tone = "default"
}: SummaryMetricCardProps) {
  return (
    <section
      className={[
        "rounded-[1.5rem] border p-5 shadow-sm",
        tone === "warning"
          ? "border-amber-200 bg-amber-50/80"
          : "border-border bg-white/85 backdrop-blur"
      ].join(" ")}
    >
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
    </section>
  );
}
