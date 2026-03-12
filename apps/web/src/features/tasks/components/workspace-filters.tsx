import type { ReactNode } from "react";
import type {
  TaskArchiveView,
  TaskListResponse,
  TaskPriority,
  TaskQueue,
  TaskSort,
  TaskStatus,
  TaskWorkspaceView
} from "@salt/types";

type WorkspaceFiltersProps = {
  currentUserId: string;
  q: string;
  status: TaskStatus | "ALL";
  section: string;
  priority: TaskPriority | "";
  assignee: string;
  queue: TaskQueue;
  archived: TaskArchiveView;
  sort: TaskSort;
  view: TaskWorkspaceView;
  queueCounts: TaskListResponse["queueCounts"];
  sections: TaskListResponse["sections"];
  users: TaskListResponse["users"];
  onChange: (
    patch: Partial<{
      q: string;
      status: TaskStatus | "ALL";
      section: string;
      priority: TaskPriority | "";
      assignee: string;
      queue: TaskQueue;
      sort: TaskSort;
      archived: TaskArchiveView;
      view: TaskWorkspaceView;
    }>
  ) => void;
  onReset: () => void;
};

const queueOptions: Array<{
  value: TaskQueue;
  label: string;
  countKey: keyof TaskListResponse["queueCounts"];
}> = [
  { value: "all", label: "All", countKey: "all" },
  { value: "my-work", label: "My work", countKey: "myWork" },
  { value: "overdue", label: "Overdue", countKey: "overdue" },
  { value: "upcoming", label: "Upcoming", countKey: "upcoming" },
  { value: "blocked", label: "Blocked", countKey: "blocked" },
  { value: "unassigned", label: "Unassigned", countKey: "unassigned" },
  { value: "stale", label: "Stale", countKey: "stale" }
];

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function FilterField({
  label,
  children,
  className
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={joinClasses("space-y-2", className)}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

export function WorkspaceFilters({
  currentUserId,
  q,
  status,
  section,
  priority,
  assignee,
  queue,
  archived,
  sort,
  view,
  queueCounts,
  sections,
  users,
  onChange,
  onReset
}: WorkspaceFiltersProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {queueOptions.map((option) => (
            <button
              key={option.value}
              className={joinClasses(
                "rounded-full px-3.5 py-2 text-sm font-medium transition",
                option.value === queue
                  ? "bg-primary text-primary-foreground shadow-[0_10px_25px_-16px_rgba(33,95,84,0.8)]"
                  : "bg-muted text-foreground hover:bg-accent"
              )}
              onClick={() => onChange({ queue: option.value })}
              type="button"
            >
              {option.label} {queueCounts[option.countKey]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              className={joinClasses(
                "rounded-full px-3.5 py-2 text-sm font-medium transition",
                view === "list"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-accent"
              )}
              onClick={() => onChange({ view: "list" })}
              type="button"
            >
              List
            </button>
            <button
              className={joinClasses(
                "rounded-full px-3.5 py-2 text-sm font-medium transition",
                view === "board"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-accent"
              )}
              onClick={() => onChange({ view: "board" })}
              type="button"
            >
              Board
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["active", "archived", "all"] as const).map((value) => (
              <button
                key={value}
                className={joinClasses(
                  "rounded-full px-3.5 py-2 text-sm font-medium capitalize transition",
                  archived === value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground hover:bg-accent"
                )}
                onClick={() => onChange({ archived: value })}
                type="button"
              >
                {value}
              </button>
            ))}
          </div>

          <button
            className="rounded-full border border-border bg-white px-3.5 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            onClick={onReset}
            type="button"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <FilterField className="xl:col-span-2" label="Search">
          <input
            className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
            onChange={(event) => onChange({ q: event.target.value })}
            placeholder="Search tasks, descriptions, or notes"
            type="search"
            value={q}
          />
        </FilterField>

        <FilterField label="Status">
          <select
            className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
            onChange={(event) => onChange({ status: event.target.value as TaskStatus | "ALL" })}
            value={status}
          >
            <option value="ALL">All statuses</option>
            <option value="NOT_STARTED">Not started</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="COMPLETE">Complete</option>
          </select>
        </FilterField>

        <FilterField label="Section">
          <select
            className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
            onChange={(event) => onChange({ section: event.target.value })}
            value={section}
          >
            <option value="">All sections</option>
            {sections.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.title}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Assignee">
          <select
            className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
            onChange={(event) => onChange({ assignee: event.target.value })}
            value={assignee}
          >
            <option value="">Anyone</option>
            <option value="me">Me</option>
            <option value="unassigned">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
                {user.id === currentUserId ? " (You)" : ""}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Priority">
          <select
            className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
            onChange={(event) => onChange({ priority: event.target.value as TaskPriority | "" })}
            value={priority}
          >
            <option value="">Any priority</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </FilterField>

        <FilterField label="Sort">
          <select
            className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
            onChange={(event) => onChange({ sort: event.target.value as TaskSort })}
            value={sort}
          >
            <option value="dueDate">Due date</option>
            <option value="priority">Priority</option>
            <option value="title">Title</option>
            <option value="status">Status</option>
          </select>
        </FilterField>
      </div>
    </div>
  );
}
