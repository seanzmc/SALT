import type { TaskGroupBy, TaskListResponse, TaskSort, TaskSortDirection } from "@salt/types";
import { Link } from "react-router-dom";

type TaskListPanelProps = {
  tasks: TaskListResponse["tasks"];
  activeTaskId?: string;
  activeChecklistPreviewTaskId?: string;
  search: string;
  selectedTaskIds: string[];
  allVisibleSelected: boolean;
  canSelectTasks: boolean;
  sort: TaskSort;
  order: TaskSortDirection;
  group: TaskGroupBy;
  onPrefetchTask: (taskId: string) => void;
  onToggleTaskSelection: (taskId: string) => void;
  onToggleSelectAllVisible: () => void;
  onSortChange: (sort: TaskSort) => void;
  onToggleChecklistPreview: (taskId: string) => void;
};

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function formatDate(value: string | null) {
  if (!value) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function SortHeader({
  label,
  sortKey,
  currentSort,
  currentOrder,
  onSortChange
}: {
  label: string;
  sortKey: TaskSort;
  currentSort: TaskSort;
  currentOrder: TaskSortDirection;
  onSortChange: (sort: TaskSort) => void;
}) {
  const isActive = currentSort === sortKey;

  return (
    <button
      className={joinClasses(
        "inline-flex items-center gap-2 text-left text-[11px] font-semibold uppercase tracking-[0.16em]",
        isActive ? "text-foreground" : "text-muted-foreground"
      )}
      onClick={() => onSortChange(sortKey)}
      type="button"
    >
      <span>{label}</span>
      <span className="text-[10px]">{isActive ? currentOrder : "sort"}</span>
    </button>
  );
}

function renderTaskRows({
  tasks,
  activeTaskId,
  activeChecklistPreviewTaskId,
  search,
  selectedTaskIds,
  canSelectTasks,
  onPrefetchTask,
  onToggleTaskSelection,
  onToggleChecklistPreview,
  grouped,
  columnCount
}: {
  tasks: TaskListResponse["tasks"];
  activeTaskId?: string;
  activeChecklistPreviewTaskId?: string;
  search: string;
  selectedTaskIds: string[];
  canSelectTasks: boolean;
  onPrefetchTask: (taskId: string) => void;
  onToggleTaskSelection: (taskId: string) => void;
  onToggleChecklistPreview: (taskId: string) => void;
  grouped: boolean;
  columnCount: number;
}) {
  const groups = grouped
    ? Array.from(
        tasks.reduce((map, task) => {
          const key = task.section.title;
          const current = map.get(key) ?? [];
          current.push(task);
          map.set(key, current);
          return map;
        }, new Map<string, TaskListResponse["tasks"]>())
      )
    : [["All tasks", tasks]] as Array<[string, TaskListResponse["tasks"]]>;

  return groups.flatMap(([groupLabel, groupTasks]) => {
    const groupRows = groupTasks.map((task) => {
      const isActive = task.id === activeTaskId;
      const isSelected = selectedTaskIds.includes(task.id);
      const dependencyBlocked = task.dependencyStatuses.some((status) => status !== "COMPLETE");
      const checklistLabel =
        task.checklistItemCount > 0
          ? `${task.completedChecklistItemCount}/${task.checklistItemCount}`
          : "None";

      return (
        <tr
          key={task.id}
          className={joinClasses(
            "border-t border-border/70 align-top transition",
            isActive && "bg-primary/5",
            !isActive && "hover:bg-muted/35"
          )}
        >
          {canSelectTasks ? (
            <td className="px-4 py-3">
              <input
                checked={isSelected}
                className="mt-1 h-4 w-4 rounded border-border"
                onChange={() => onToggleTaskSelection(task.id)}
                type="checkbox"
              />
            </td>
          ) : null}
          <td className="px-4 py-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    className="font-medium text-foreground hover:text-primary"
                    onMouseEnter={() => onPrefetchTask(task.id)}
                    to={{
                      pathname: `/tasks/${task.id}`,
                      search
                    }}
                  >
                    {task.title}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {task.phase?.title ?? "No phase"}
                    {grouped ? "" : ` · ${task.section.title}`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={joinClasses(
                      "rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.14em]",
                      dependencyBlocked
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-700"
                    )}
                  >
                    {dependencyBlocked ? "Blocked" : "Ready"}
                  </span>
                  {task.archivedAt ? (
                    <span className="rounded-full border border-border px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      Archived
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </td>
          <td className="hidden px-4 py-3 text-sm text-muted-foreground xl:table-cell">
            {task.assignedTo?.name ?? "Unassigned"}
          </td>
          <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(task.dueDate)}</td>
          <td className="w-[9rem] px-4 py-3">
            <span className="inline-flex min-w-[7.25rem] justify-center whitespace-nowrap rounded-full bg-muted px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {task.status.replaceAll("_", " ")}
            </span>
          </td>
          <td className="hidden px-4 py-3 md:table-cell">
            <span className="inline-flex min-w-[5.5rem] justify-center rounded-full border border-border px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {task.priority}
            </span>
          </td>
          <td className="px-4 py-3">
            {task.checklistItemCount > 0 ? (
              <button
                className={joinClasses(
                  "inline-flex min-w-[6.5rem] items-center justify-center rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] transition",
                  activeChecklistPreviewTaskId === task.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
                onClick={() => onToggleChecklistPreview(task.id)}
                type="button"
              >
                {checklistLabel}
              </button>
            ) : (
              <span className="text-sm text-muted-foreground">None</span>
            )}
          </td>
        </tr>
      );
    });

    if (!grouped) {
      return groupRows;
    }

    return [
      <tr key={`group-${groupLabel}`} className="border-t border-border/70 bg-muted/30">
        <td className="px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground" colSpan={columnCount}>
          {groupLabel} ({groupTasks.length})
        </td>
      </tr>,
      ...groupRows
    ];
  });
}

export function TaskListPanel({
  tasks,
  activeTaskId,
  activeChecklistPreviewTaskId,
  search,
  selectedTaskIds,
  allVisibleSelected,
  canSelectTasks,
  sort,
  order,
  group,
  onPrefetchTask,
  onToggleTaskSelection,
  onToggleSelectAllVisible,
  onSortChange,
  onToggleChecklistPreview
}: TaskListPanelProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-[1.25rem] border border-dashed border-border bg-muted/25 px-4 py-8 text-center text-sm text-muted-foreground">
        No work matches the current filters.
      </div>
    );
  }

  const columnCount = canSelectTasks ? 7 : 6;

  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
        <div className="text-sm text-muted-foreground">
          {tasks.length} visible task{tasks.length === 1 ? "" : "s"}
        </div>
        {canSelectTasks ? (
          <button
            className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
            onClick={onToggleSelectAllVisible}
            type="button"
          >
            {allVisibleSelected ? "Clear visible" : "Select visible"}
          </button>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-muted/40 text-left text-muted-foreground">
            <tr>
              {canSelectTasks ? (
                <th className="w-12 px-4 py-3">
                  <input
                    aria-label="Select all visible tasks"
                    checked={allVisibleSelected}
                    className="h-4 w-4 rounded border-border"
                    onChange={onToggleSelectAllVisible}
                    type="checkbox"
                  />
                </th>
              ) : null}
              <th className="min-w-[22rem] px-4 py-3">
                <SortHeader
                  currentOrder={order}
                  currentSort={sort}
                  label="Work item"
                  onSortChange={onSortChange}
                  sortKey="title"
                />
              </th>
              <th className="hidden px-4 py-3 xl:table-cell">Assignee</th>
              <th className="px-4 py-3">
                <SortHeader
                  currentOrder={order}
                  currentSort={sort}
                  label="Due"
                  onSortChange={onSortChange}
                  sortKey="dueDate"
                />
              </th>
              <th className="px-4 py-3">
                <SortHeader
                  currentOrder={order}
                  currentSort={sort}
                  label="Status"
                  onSortChange={onSortChange}
                  sortKey="status"
                />
              </th>
              <th className="hidden px-4 py-3 md:table-cell">
                <SortHeader
                  currentOrder={order}
                  currentSort={sort}
                  label="Priority"
                  onSortChange={onSortChange}
                  sortKey="priority"
                />
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Checklist
              </th>
            </tr>
          </thead>
          <tbody>
            {renderTaskRows({
              tasks,
              activeTaskId,
              activeChecklistPreviewTaskId,
              search,
              selectedTaskIds,
              canSelectTasks,
              onPrefetchTask,
              onToggleTaskSelection,
              onToggleChecklistPreview,
              grouped: group === "section",
              columnCount
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
