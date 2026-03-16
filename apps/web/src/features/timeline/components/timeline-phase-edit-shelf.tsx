import { useEffect, useState } from "react";
import type {
  TimelinePhaseRecord,
  TimelinePhaseStatus,
  TimelinePhaseUpdateInput
} from "@salt/types";

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

export function TimelinePhaseEditShelf({
  phase,
  isSaving,
  error,
  onClose,
  onSave
}: {
  phase: TimelinePhaseRecord;
  isSaving: boolean;
  error?: string;
  onClose: () => void;
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
  }, [phase.blockers, phase.endDate, phase.id, phase.notes, phase.startDate, phase.status]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/80 px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Phase edit shelf
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-foreground">{phase.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Update phase status, dates, notes, and blockers without keeping the timeline page in
              constant edit mode.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                statusClasses(phase.status)
              ].join(" ")}
            >
              {phase.status.replaceAll("_", " ")}
            </span>
            <button
              className="rounded-full border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <form
        className="flex-1 space-y-5 overflow-y-auto bg-[rgba(234,244,241,0.42)] px-5 py-5"
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
        <section className="rounded-[1.25rem] border border-border/70 bg-white p-4">
          <p className="font-semibold text-foreground">Editing controls</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Timeline tasks remain read-only here. Open those items in the task workspace when task
            execution details need to change.
          </p>
          {error ? (
            <div className="mt-4 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
        </section>

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

        <div className="grid gap-4 md:grid-cols-2">
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

        <div className="flex flex-wrap justify-end gap-3 pb-2">
          <button
            className="rounded-[1rem] border border-border bg-white px-4 py-3 text-sm font-medium text-foreground hover:bg-muted"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-[1rem] bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? "Saving..." : "Save phase"}
          </button>
        </div>
      </form>
    </div>
  );
}
