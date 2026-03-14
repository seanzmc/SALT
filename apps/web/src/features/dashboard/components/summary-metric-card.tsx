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
        "rounded-[1.35rem] border p-4 shadow-sm lg:p-4",
        tone === "warning"
          ? "border-amber-200 bg-amber-50/80"
          : "border-border bg-white/85 backdrop-blur"
      ].join(" ")}
    >
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
      <p className="mt-2 text-[1.85rem] font-semibold leading-none lg:text-[2rem]">{value}</p>
      <p className="mt-1.5 text-xs leading-5 text-muted-foreground lg:text-[13px]">{detail}</p>
    </section>
  );
}
