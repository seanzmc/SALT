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

const queueOptions: Array<{ value: TaskQueue; label: string; countKey: keyof TaskListResponse["queueCounts"] }> = [
  { value: "all", label: "All", countKey: "all" },
  { value: "my-work", label: "My work", countKey: "myWork" },
  { value: "overdue", label: "Overdue", countKey: "overdue" },
  { value: "upcoming", label: "Upcoming", countKey: "upcoming" },
  { value: "blocked", label: "Blocked", countKey: "blocked" },
  { value: "unassigned", label: "Unassigned", countKey: "unassigned" },
  { value: "stale", label: "Stale", countKey: "stale" }
];

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
    <section className="rounded-[1.75rem] border border-border bg-white/85 p-5 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">Task flow</p>
          <p className="text-sm text-muted-foreground">
            Search, filter, and stay anchored in the queue while the shelf remains open.
          </p>
        </div>
        <button
          className="rounded-full border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
          onClick={onReset}
          type="button"
        >
          Reset filters
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {queueOptions.map((option) => (
          <button
            key={option.value}
            className={[
              "rounded-full px-4 py-2 text-sm transition-colors",
              option.value === queue
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground hover:bg-accent"
            ].join(" ")}
            onClick={() => onChange({ queue: option.value })}
            type="button"
          >
            {option.label} {queueCounts[option.countKey]}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            className={[
              "rounded-full px-4 py-2 text-sm transition-colors",
              view === "list"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground hover:bg-accent"
            ].join(" ")}
            onClick={() => onChange({ view: "list" })}
            type="button"
          >
            List view
          </button>
          <button
            className={[
              "rounded-full px-4 py-2 text-sm transition-colors",
              view === "board"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground hover:bg-accent"
            ].join(" ")}
            onClick={() => onChange({ view: "board" })}
            type="button"
          >
            Board view
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className={[
              "rounded-full px-4 py-2 text-sm transition-colors",
              archived === "active"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground hover:bg-accent"
            ].join(" ")}
            onClick={() => onChange({ archived: "active" })}
            type="button"
          >
            Active
          </button>
          <button
            className={[
              "rounded-full px-4 py-2 text-sm transition-colors",
              archived === "archived"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground hover:bg-accent"
            ].join(" ")}
            onClick={() => onChange({ archived: "archived" })}
            type="button"
          >
            Archived
          </button>
          <button
            className={[
              "rounded-full px-4 py-2 text-sm transition-colors",
              archived === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground hover:bg-accent"
            ].join(" ")}
            onClick={() => onChange({ archived: "all" })}
            type="button"
          >
            All
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <label className="space-y-2 xl:col-span-2">
          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Search
          </span>
          <input
            className="w-full rounded-2xl border border-border bg-card px-4 py-3"
            onChange={(event) => onChange({ q: event.target.value })}
            placeholder="Search tasks, descriptions, or notes"
            type="search"
            value={q}
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Status
          </span>
          <select
            className="w-full rounded-2xl border border-border bg-card px-4 py-3"
            onChange={(event) => onChange({ status: event.target.value as TaskStatus | "ALL" })}
            value={status}
          >
            <option value="ALL">All statuses</option>
            <option value="NOT_STARTED">Not started</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="COMPLETE">Complete</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Section
          </span>
          <select
            className="w-full rounded-2xl border border-border bg-card px-4 py-3"
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
        </label>

        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Assignee
          </span>
          <select
            className="w-full rounded-2xl border border-border bg-card px-4 py-3"
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
        </label>

        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Priority
          </span>
          <select
            className="w-full rounded-2xl border border-border bg-card px-4 py-3"
            onChange={(event) => onChange({ priority: event.target.value as TaskPriority | "" })}
            value={priority}
          >
            <option value="">Any priority</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Sort
          </span>
          <select
            className="w-full rounded-2xl border border-border bg-card px-4 py-3"
            onChange={(event) => onChange({ sort: event.target.value as TaskSort })}
            value={sort}
          >
            <option value="dueDate">Due date</option>
            <option value="priority">Priority</option>
            <option value="title">Title</option>
            <option value="status">Status</option>
          </select>
        </label>
      </div>
    </section>
  );
}
