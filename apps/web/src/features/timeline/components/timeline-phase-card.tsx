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

export function TimelinePhaseCard({
  phase,
  isSaving,
  onSave
}: {
  phase: TimelinePhaseRecord;
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
    <section className="rounded-[1.75rem] border border-border bg-white/85 p-5 shadow-sm backdrop-blur">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-5">
          <div>
            <p className="text-lg font-semibold">{phase.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{phase.description}</p>
          </div>

          <div>
            <p className="font-medium">Milestones</p>
            <div className="mt-3 space-y-2">
              {phase.milestones.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/35 p-4 text-sm text-muted-foreground">
                  No milestones for this phase.
                </div>
              ) : (
                phase.milestones.map((milestone) => (
                  <div key={milestone.id} className="rounded-2xl border border-border bg-card/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{milestone.title}</p>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                        {milestone.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Due {formatDate(milestone.dueDate)}
                    </p>
                    {milestone.notes ? (
                      <p className="mt-2 text-sm text-muted-foreground">{milestone.notes}</p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <p className="font-medium">Linked tasks</p>
            <div className="mt-3 space-y-2">
              {phase.tasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/35 p-4 text-sm text-muted-foreground">
                  No linked tasks in this phase yet.
                </div>
              ) : (
                phase.tasks.map((task) => (
                  <Link
                    key={task.id}
                    className="block rounded-2xl border border-border bg-card/70 p-4 hover:bg-muted/60"
                    to={`/tasks/${task.id}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{task.title}</p>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                        {task.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Due {formatDate(task.dueDate)} • {task.assignedTo?.name ?? "Unassigned"}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        <form
          className="space-y-4 rounded-[1.5rem] border border-border bg-secondary/25 p-4"
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
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Phase status
            </label>
            <select
              className="w-full rounded-2xl border border-border bg-card px-4 py-3"
              disabled={isSaving}
              onChange={(event) => setStatus(event.target.value as TimelinePhaseStatus)}
              value={status}
            >
              <option value="NOT_STARTED">NOT STARTED</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="BLOCKED">BLOCKED</option>
              <option value="COMPLETE">COMPLETE</option>
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Start date
              </span>
              <input
                className="w-full rounded-2xl border border-border bg-card px-4 py-3"
                disabled={isSaving}
                onChange={(event) => setStartDate(event.target.value)}
                type="date"
                value={startDate}
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                End date
              </span>
              <input
                className="w-full rounded-2xl border border-border bg-card px-4 py-3"
                disabled={isSaving}
                onChange={(event) => setEndDate(event.target.value)}
                type="date"
                value={endDate}
              />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Notes
            </span>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-border bg-card px-4 py-3"
              disabled={isSaving}
              onChange={(event) => setNotes(event.target.value)}
              value={notes}
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Blockers
            </span>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-border bg-card px-4 py-3"
              disabled={isSaving}
              onChange={(event) => setBlockers(event.target.value)}
              value={blockers}
            />
          </label>

          <button
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? "Saving…" : "Save phase"}
          </button>
        </form>
      </div>
    </section>
  );
}
