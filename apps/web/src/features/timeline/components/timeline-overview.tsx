import type { TimelinePhaseRecord } from "@salt/types";

function formatDate(value: string | null) {
  if (!value) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export function TimelineOverview({ phases }: { phases: TimelinePhaseRecord[] }) {
  const earliest = phases[0]?.startDate ? new Date(phases[0].startDate).getTime() : Date.now();
  const latest = phases[phases.length - 1]?.endDate
    ? new Date(phases[phases.length - 1].endDate!).getTime()
    : Date.now();
  const totalSpan = Math.max(latest - earliest, 1);

  return (
    <section className="rounded-[1.75rem] border border-border bg-white/85 p-5 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">Phase timeline</p>
          <p className="text-sm text-muted-foreground">
            Opening phases from secured space through launch operations.
          </p>
        </div>
      </div>
      <div className="mt-5 space-y-4">
        {phases.map((phase) => {
          const start = phase.startDate ? new Date(phase.startDate).getTime() : earliest;
          const end = phase.endDate ? new Date(phase.endDate).getTime() : start;
          const left = ((start - earliest) / totalSpan) * 100;
          const width = Math.max(((end - start) / totalSpan) * 100, 6);

          return (
            <div key={phase.id} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{phase.title}</p>
                <span
                  className={[
                    "rounded-full px-3 py-1 text-xs font-medium",
                    phase.status === "COMPLETE"
                      ? "bg-emerald-100 text-emerald-700"
                      : phase.status === "BLOCKED"
                        ? "bg-rose-100 text-rose-700"
                        : phase.status === "IN_PROGRESS"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                  ].join(" ")}
                >
                  {phase.status.replaceAll("_", " ")}
                </span>
              </div>
              <div className="relative h-4 rounded-full bg-muted">
                <div
                  className="absolute top-0 h-4 rounded-full bg-primary"
                  style={{ left: `${left}%`, width: `${width}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDate(phase.startDate)} to {formatDate(phase.endDate)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
