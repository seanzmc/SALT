import type { ReactNode } from "react";
import type {
  TaskArchiveView,
  TaskGroupBy,
  TaskListResponse,
  TaskPriority,
  TaskQueue,
  TaskSort,
  TaskSortDirection,
  TaskStatus,
  TaskWorkspaceView
} from "@salt/types";

type WorkspaceFiltersProps = {
  currentUserId: string;
  q: string;
  status: TaskStatus[];
  section: string[];
  priority: TaskPriority[];
  assignee: string[];
  queue: TaskQueue;
  archived: TaskArchiveView;
  sort: TaskSort;
  order: TaskSortDirection;
  view: TaskWorkspaceView;
  group: TaskGroupBy;
  queueCounts: TaskListResponse["queueCounts"];
  sections: TaskListResponse["sections"];
  users: TaskListResponse["users"];
  onChange: (
    patch: Partial<{
      q: string;
      status: TaskStatus[];
      section: string[];
      priority: TaskPriority[];
      assignee: string[];
      queue: TaskQueue;
      sort: TaskSort;
      order: TaskSortDirection;
      archived: TaskArchiveView;
      view: TaskWorkspaceView;
      group: TaskGroupBy;
    }>
  ) => void;
  onReset: () => void;
};

type MultiSelectMenuProps<TValue extends string> = {
  label: string;
  value: TValue[];
  options: Array<{
    value: TValue;
    label: string;
  }>;
  onChange: (value: TValue[]) => void;
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

function FilterButton({
  children,
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      className={joinClasses(
        "inline-flex h-10 items-center justify-center rounded-full border border-border bg-white px-3.5 text-sm text-foreground transition hover:bg-muted",
        className
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

function MultiSelectMenu<TValue extends string>({
  label,
  value,
  options,
  onChange
}: MultiSelectMenuProps<TValue>) {
  const selectedSet = new Set(value);
  const selectedCount = value.length;

  return (
    <details className="group relative min-w-[10rem]">
      <summary className="list-none [&::-webkit-details-marker]:hidden">
        <span className="inline-flex h-10 w-full items-center justify-between gap-2 rounded-full border border-border bg-white px-3.5 text-sm text-foreground transition group-open:bg-muted">
          <span>{label}</span>
          <span className="text-xs text-muted-foreground">
            {selectedCount > 0 ? `${selectedCount} selected` : "All"}
          </span>
        </span>
      </summary>
      <div className="absolute left-0 z-20 mt-2 w-[18rem] rounded-[1rem] border border-border bg-white p-3 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)]">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </p>
          {selectedCount > 0 ? (
            <button
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => onChange([])}
              type="button"
            >
              Clear
            </button>
          ) : null}
        </div>
        <div className="max-h-60 space-y-1 overflow-y-auto">
          {options.map((option) => {
            const isChecked = selectedSet.has(option.value);

            return (
              <label
                key={option.value}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-[0.85rem] px-3 py-2 text-sm hover:bg-muted/60"
              >
                <span>{option.label}</span>
                <input
                  checked={isChecked}
                  className="h-4 w-4 rounded border-border"
                  onChange={() => {
                    const nextValue = isChecked
                      ? value.filter((item) => item !== option.value)
                      : [...value, option.value];
                    onChange(nextValue);
                  }}
                  type="checkbox"
                />
              </label>
            );
          })}
        </div>
      </div>
    </details>
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
  order,
  view,
  group,
  queueCounts,
  sections,
  users,
  onChange,
  onReset
}: WorkspaceFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {queueOptions.map((option) => (
            <button
              key={option.value}
              className={joinClasses(
                "inline-flex h-10 items-center justify-center rounded-full px-3.5 text-sm font-medium text-center transition",
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
            <FilterButton
              className={view === "list" ? "border-primary bg-primary text-primary-foreground" : ""}
              onClick={() => onChange({ view: "list" })}
            >
              List
            </FilterButton>
            <FilterButton
              className={view === "board" ? "border-primary bg-primary text-primary-foreground" : ""}
              onClick={() => onChange({ view: "board" })}
            >
              Board
            </FilterButton>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["active", "archived", "all"] as const).map((value) => (
              <FilterButton
                key={value}
                className={
                  archived === value ? "border-primary bg-primary text-primary-foreground" : ""
                }
                onClick={() => onChange({ archived: value })}
              >
                {value}
              </FilterButton>
            ))}
          </div>

          <FilterButton className="text-muted-foreground" onClick={onReset}>
            Reset
          </FilterButton>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          className="h-10 min-w-[16rem] flex-1 rounded-full border border-border bg-white px-4 text-sm"
          onChange={(event) => onChange({ q: event.target.value })}
          placeholder="Search titles, notes, or descriptions"
          type="search"
          value={q}
        />

        <MultiSelectMenu
          label="Status"
          onChange={(nextValue) => onChange({ status: nextValue })}
          options={[
            { value: "NOT_STARTED", label: "Not started" },
            { value: "IN_PROGRESS", label: "In progress" },
            { value: "BLOCKED", label: "Blocked" },
            { value: "COMPLETE", label: "Complete" }
          ]}
          value={status}
        />

        <MultiSelectMenu
          label="Section"
          onChange={(nextValue) => onChange({ section: nextValue })}
          options={sections.map((item) => ({
            value: item.slug,
            label: item.title
          }))}
          value={section}
        />

        <MultiSelectMenu
          label="Assignee"
          onChange={(nextValue) => onChange({ assignee: nextValue })}
          options={[
            { value: "me", label: "Me" },
            { value: "unassigned", label: "Unassigned" },
            ...users.map((user) => ({
              value: user.id,
              label: user.id === currentUserId ? `${user.name} (You)` : user.name
            }))
          ]}
          value={assignee}
        />

        <MultiSelectMenu
          label="Priority"
          onChange={(nextValue) => onChange({ priority: nextValue })}
          options={[
            { value: "LOW", label: "Low" },
            { value: "MEDIUM", label: "Medium" },
            { value: "HIGH", label: "High" },
            { value: "CRITICAL", label: "Critical" }
          ]}
          value={priority}
        />

        <label className="flex items-center gap-2 rounded-full border border-border bg-white px-3.5 text-sm text-foreground">
          <span className="text-muted-foreground">Sort</span>
          <select
            className="h-10 bg-transparent pr-2 outline-none"
            onChange={(event) => onChange({ sort: event.target.value as TaskSort })}
            value={sort}
          >
            <option value="dueDate">Due date</option>
            <option value="priority">Priority</option>
            <option value="title">Title</option>
            <option value="status">Status</option>
          </select>
        </label>

        <FilterButton
          className="min-w-[5.25rem]"
          onClick={() => onChange({ order: order === "asc" ? "desc" : "asc" })}
        >
          {order === "asc" ? "Asc" : "Desc"}
        </FilterButton>

        <FilterButton
          className={group === "section" ? "border-primary bg-primary text-primary-foreground" : ""}
          onClick={() => onChange({ group: group === "section" ? "none" : "section" })}
        >
          Group by section
        </FilterButton>
      </div>
    </div>
  );
}
