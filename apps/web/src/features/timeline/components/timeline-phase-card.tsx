import { useId, useState, type ReactNode } from "react";
import type { TimelinePhaseRecord, TimelinePhaseStatus } from "@salt/types";
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

function CollapsibleBlock({
  title,
  description,
  defaultOpen = true,
  children
}: {
  title: string;
  description: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section className="rounded-[1.25rem] border border-border/70 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <button
          aria-controls={panelId}
          aria-expanded={open}
          className="rounded-full border border-border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground hover:bg-muted"
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          {open ? "Collapse" : "Expand"}
        </button>
      </div>
      {open ? <div className="mt-4" id={panelId}>{children}</div> : null}
    </section>
  );
}

export function TimelinePhaseCard({
  phase,
  phaseNumber,
  phaseCount,
  onEdit
}: {
  phase: TimelinePhaseRecord;
  phaseNumber: number;
  phaseCount: number;
  onEdit: () => void;
}) {
  return (
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
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{phase.description}</p>
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

        <div className="mt-4 flex flex-wrap justify-end gap-3">
          <button
            className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            onClick={onEdit}
            type="button"
          >
            Edit phase
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-[1.25rem] border border-border/70 bg-white p-4">
          <p className="font-semibold text-foreground">Operational notes</p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {phase.notes?.trim() || "No notes have been captured for this phase yet."}
          </p>
        </section>

        <section className="rounded-[1.25rem] border border-border/70 bg-white p-4">
          <p className="font-semibold text-foreground">Current blockers</p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {phase.blockers?.trim() || "No blockers are currently recorded for this phase."}
          </p>
        </section>
      </div>

        <CollapsibleBlock
          description="Milestones are the planning checkpoints that explain what done means for this stage."
          title="Milestones in this phase"
        >
          <div className="space-y-3">
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
        </CollapsibleBlock>

        <CollapsibleBlock
          description="These task links open the universal task shelf inside the task workspace."
          title="Linked tasks"
        >
          <div className="mb-3 rounded-[1rem] border border-border/70 bg-muted/18 px-4 py-3 text-sm text-muted-foreground">
            Linked tasks are read-only from the timeline. Open a task to edit status, documents,
            checklist items, comments, or dependencies in the task workspace.
          </div>
          <div className="space-y-3">
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
        </CollapsibleBlock>
    </div>
  );
}
