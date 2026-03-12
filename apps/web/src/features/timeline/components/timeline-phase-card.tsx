import { useEffect, useState } from "react";
import type {
  TimelinePhaseRecord,
  TimelinePhaseStatus,
  TimelinePhaseUpdateInput
} from "@salt/types";
import { Link } from "react-router-dom";

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

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function statusClasses(status: TimelinePhaseStatus) {
  switch (status) {
    case "COMPLETE":
      return "bg-emerald-100 text-emerald-700";
    case "BLOCKED":
      return "bg-rose-100 text-rose-700";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function InfoCard({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1rem] border border-border/70 bg-white px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-medium text-foreground">{value}</p>
    </div>
  );
}

export function TimelinePhaseCard({
  phase,
  phaseNumber,
  phaseCount,
  isSaving,
  onSave
}: {
  phase: TimelinePhaseRecord;
  phaseNumber: number;
  phaseCount: number;
  isSaving: boolean;
  onSave: (payload: TimelinePhaseUpdateInput) => Promise<void>;
}) {
  const [status, setStatus] = useState<TimelinePhaseStatus>(phase.status);
  const [startDate, setStartDate] = useState(phase.startDate?.slice(0, 10) ?? "");
  const [endDate, setEndDate] = useState(phase.endDate?.slice(0, 10) ?? "");
  const [notes, setNotes] = useState(phase.notes ?? "");
  const [blockers, setBlockers] = useState(phase.blockers ?? "");

  useEffect(() => {
    setStatus(phase.status);
    setStartDate(phase.startDate?.slice(0, 10) ?? "");
    setEndDate(phase.endDate?.slice(0, 10) ?? "");
    setNotes(phase.notes ?? "");
    setBlockers(phase.blockers ?? "");
  }, [phase.blockers, phase.endDate, phase.notes, phase.startDate, phase.status]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem] xl:items-start">
      <div className="space-y-5">
        <div className="rounded-[1.25rem] border border-border/70 bg-muted/15 px-4 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Opening phase {phaseNumber} of {phaseCount}
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-foreground">
                {phase.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {phase.description}
              </p>
            </div>
            <span
              className={joinClasses(
                "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                statusClasses(phase.status)
              )}
            >
              {phase.status.replaceAll("_", " ")}
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard label="Window" value={`${formatDate(phase.startDate)} to ${formatDate(phase.endDate)}`} />
            <InfoCard label="Milestones" value={String(phase.milestones.length)} />
            <InfoCard label="Linked tasks" value={String(phase.tasks.length)} />
            <InfoCard label="Updated" value={formatDate(phase.updatedAt)} />
          </div>
        </div>

        <section className="rounded-[1.25rem] border border-border/70 bg-white p-4">
          <p className="font-semibold text-foreground">Milestones in this phase</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Milestones are the planning checkpoints that explain what “done” means for this stage.
          </p>
          <div className="mt-4 space-y-3">
            {phase.milestones.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                No milestones are defined for this phase yet.
              </div>
            ) : (
              phase.milestones.map((milestone) => (
                <div key={milestone.id} className="rounded-2xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-foreground">{milestone.title}</p>
                    <span
                      className={joinClasses(
                        "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                        statusClasses(milestone.status)
                      )}
                    >
                      {milestone.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Due {formatDate(milestone.dueDate)}
                  </p>
                  {milestone.notes ? (
                    <p className="mt-2 text-sm leading-6 text-foreground/80">{milestone.notes}</p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[1.25rem] border border-border/70 bg-white p-4">
          <p className="font-semibold text-foreground">Linked tasks</p>
          <p className="mt-1 text-sm text-muted-foreground">
            These task links open the universal task shelf inside the task workspace.
          </p>
          <div className="mt-4 space-y-3">
            {phase.tasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                No linked tasks in this phase yet.
              </div>
            ) : (
              phase.tasks.map((task) => (
                <Link
                  key={task.id}
                  className="block rounded-2xl border border-border p-4 transition hover:bg-muted/35"
                  to={`/tasks/${task.id}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-foreground">{task.title}</p>
                    <span
                      className={joinClasses(
                        "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                        statusClasses(task.status as TimelinePhaseStatus)
                      )}
                    >
                      {task.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Due {formatDate(task.dueDate)} • {task.assignedTo?.name ?? "Unassigned"}
                  </p>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      <form
        className="space-y-4 rounded-[1.25rem] border border-border/70 bg-[rgba(234,244,241,0.72)] p-4 xl:sticky xl:top-4"
        onSubmit={async (event) => {
          event.preventDefault();
          await onSave({
            phaseId: phase.id,
            status,
            notes: notes.trim() || null,
            blockers: blockers.trim() || null,
            startDate: startDate || null,
            endDate: endDate || null
          });
        }}
      >
        <div>
          <p className="font-semibold text-foreground">Update phase</p>
          <p className="mt-1 text-sm text-muted-foreground">
            These fields define the official operating status for this opening stage.
          </p>
        </div>

        <label className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Phase status
          </span>
          <select
            className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
            disabled={isSaving}
            onChange={(event) => setStatus(event.target.value as TimelinePhaseStatus)}
            value={status}
          >
            <option value="NOT_STARTED">Not started</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="COMPLETE">Complete</option>
          </select>
        </label>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
          <label className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Start date
            </span>
            <input
              className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
              disabled={isSaving}
              onChange={(event) => setStartDate(event.target.value)}
              type="date"
              value={startDate}
            />
          </label>

          <label className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              End date
            </span>
            <input
              className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
              disabled={isSaving}
              onChange={(event) => setEndDate(event.target.value)}
              type="date"
              value={endDate}
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Notes
          </span>
          <textarea
            className="min-h-32 w-full rounded-[1rem] border border-border bg-white px-4 py-3"
            disabled={isSaving}
            onChange={(event) => setNotes(event.target.value)}
            value={notes}
          />
        </label>

        <label className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Blockers
          </span>
          <textarea
            className="min-h-32 w-full rounded-[1rem] border border-border bg-white px-4 py-3"
            disabled={isSaving}
            onChange={(event) => setBlockers(event.target.value)}
            value={blockers}
          />
        </label>

        <button
          className="w-full rounded-[1rem] bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? "Saving..." : "Save phase"}
        </button>
      </form>
    </div>
  );
}
