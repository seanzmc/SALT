import type { TimelinePhaseRecord } from "@salt/types";

function countByStatus(phases: TimelinePhaseRecord[], status: TimelinePhaseRecord["status"]) {
  return phases.filter((phase) => phase.status === status).length;
}

function OverviewTile({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1rem] border border-border/70 bg-[rgba(255,255,255,0.82)] px-4 py-4 shadow-[0_18px_50px_-44px_rgba(15,23,42,0.32)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function TimelineOverview({ phases }: { phases: TimelinePhaseRecord[] }) {
  const totalMilestones = phases.reduce((sum, phase) => sum + phase.milestones.length, 0);
  const totalTasks = phases.reduce((sum, phase) => sum + phase.tasks.length, 0);

  return (
    <div className="space-y-4 rounded-[1.25rem] border border-border/75 bg-[rgba(255,251,244,0.7)] p-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Opening phase model
        </p>
        <p className="text-sm leading-6 text-muted-foreground">
          A phase is one major opening stage. Each phase groups milestones, linked tasks, dates,
          notes, and blockers so the timeline stays connected to day-to-day execution.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <OverviewTile label="Phases" value={String(phases.length)} />
        <OverviewTile label="Milestones" value={String(totalMilestones)} />
        <OverviewTile label="Linked tasks" value={String(totalTasks)} />
        <OverviewTile label="In progress" value={String(countByStatus(phases, "IN_PROGRESS"))} />
        <OverviewTile label="Blocked" value={String(countByStatus(phases, "BLOCKED"))} />
      </div>
    </div>
  );
}
