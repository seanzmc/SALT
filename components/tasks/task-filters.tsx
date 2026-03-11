"use client";

import { TaskStatus } from "@prisma/client";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { type ChecklistWorkspaceState } from "@/lib/checklist-workspace";

export function TaskFilters({
  sections,
  users,
  current,
  onChange,
  onReset,
  isUpdating = false
}: {
  sections: Array<{ slug: string; title: string }>;
  users: Array<{ id: string; name: string }>;
  current: ChecklistWorkspaceState;
  onChange: (patch: Partial<ChecklistWorkspaceState>) => void;
  onReset: () => void;
  isUpdating?: boolean;
}) {
  return (
    <div className="grid gap-4 rounded-[1.75rem] border border-border/80 bg-white/85 p-4 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_repeat(6,minmax(0,0.7fr))]">
      <label className="space-y-2 md:col-span-2 xl:col-span-1">
        <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          <Search className="h-3.5 w-3.5" />
          Search
        </span>
        <Input
          className="h-11"
          onChange={(event) => onChange({ q: event.target.value })}
          placeholder="Search tasks, notes, or descriptions"
          value={current.q}
        />
      </label>

      <label className="space-y-2">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Status
        </span>
        <Select
          className="h-11"
          onChange={(event) => onChange({ status: event.target.value })}
          value={current.status}
        >
          <option value="ALL">All statuses</option>
          {Object.values(TaskStatus).map((status) => (
            <option key={status} value={status}>
              {status.replaceAll("_", " ")}
            </option>
          ))}
        </Select>
      </label>

      <label className="space-y-2">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Section
        </span>
        <Select
          className="h-11"
          onChange={(event) => onChange({ section: event.target.value })}
          value={current.section}
        >
          <option value="">All sections</option>
          {sections.map((section) => (
            <option key={section.slug} value={section.slug}>
              {section.title}
            </option>
          ))}
        </Select>
      </label>

      <label className="space-y-2">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Priority
        </span>
        <Select
          className="h-11"
          onChange={(event) => onChange({ priority: event.target.value })}
          value={current.priority}
        >
          <option value="">All priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </Select>
      </label>

      <label className="space-y-2">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Owner
        </span>
        <Select
          className="h-11"
          onChange={(event) => onChange({ assignee: event.target.value })}
          value={current.assignee}
        >
          <option value="">All owners</option>
          <option value="me">Assigned to me</option>
          <option value="unassigned">Unassigned</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </Select>
      </label>

      <label className="space-y-2">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Sort
        </span>
        <Select
          className="h-11"
          onChange={(event) => onChange({ sort: event.target.value as ChecklistWorkspaceState["sort"] })}
          value={current.sort}
        >
          <option value="dueDate">Sort by due date</option>
          <option value="priority">Sort by priority</option>
          <option value="title">Sort by title</option>
          <option value="status">Sort by status</option>
        </Select>
      </label>

      <label className="space-y-2">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Archive
        </span>
        <Select
          className="h-11"
          onChange={(event) =>
            onChange({ archived: event.target.value as ChecklistWorkspaceState["archived"] })
          }
          value={current.archived}
        >
          <option value="active">Active only</option>
          <option value="archived">Archived only</option>
          <option value="all">Active and archived</option>
        </Select>
      </label>

      <label className="space-y-2">
        <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Grouping
        </span>
        <Select
          className="h-11"
          onChange={(event) => onChange({ group: event.target.value as ChecklistWorkspaceState["group"] })}
          value={current.group}
        >
          <option value="none">No grouping</option>
          <option value="section">Group by section</option>
        </Select>
      </label>

      <div className="flex items-end gap-2 md:col-span-2 xl:col-span-7">
        <Button onClick={onReset} type="button" variant="outline">
          <X className="mr-2 h-4 w-4" />
          Reset filters
        </Button>
        {isUpdating ? (
          <span className="text-sm text-muted-foreground">Updating workspace…</span>
        ) : (
          <span className="text-sm text-muted-foreground">
            Filters apply locally and keep the task list in place.
          </span>
        )}
      </div>
    </div>
  );
}
