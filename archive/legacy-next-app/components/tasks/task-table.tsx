"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type ChecklistTaskRecord } from "@/lib/checklist-workspace";
import { cn, formatDate } from "@/lib/utils";

export type TaskTableRow = ChecklistTaskRecord;

export function TaskTable({
  tasks,
  selectable = false,
  selectedTaskIds = new Set<string>(),
  onToggleTask,
  onToggleAllVisible,
  onOpenTask,
  getTaskHref,
  activeTaskId,
  onPrefetchTask
}: {
  tasks: TaskTableRow[];
  selectable?: boolean;
  selectedTaskIds?: Set<string>;
  onToggleTask?: (taskId: string) => void;
  onToggleAllVisible?: () => void;
  onOpenTask?: (taskId: string) => void;
  getTaskHref?: (taskId: string) => string;
  activeTaskId?: string;
  onPrefetchTask?: (taskId: string) => void;
}) {
  const allVisibleSelected =
    tasks.length > 0 && tasks.every((task) => selectedTaskIds.has(task.id));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {selectable ? (
            <TableHead className="w-12">
              <input
                aria-label="Select all visible tasks"
                checked={allVisibleSelected}
                onChange={() => onToggleAllVisible?.()}
                type="checkbox"
              />
            </TableHead>
          ) : null}
          <TableHead>Task</TableHead>
          <TableHead>Section</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Due</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Dependencies</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => {
          const hasIncompleteDependencies = task.taskDependencies.some(
            (dependency) => dependency.dependsOnTask.status !== "COMPLETE"
          );
          const taskHref = getTaskHref?.(task.id) ?? `/checklists/${task.id}`;

          return (
            <TableRow
              key={task.id}
              className={cn(
                "transition-colors hover:bg-secondary/40",
                onOpenTask ? "cursor-pointer" : undefined,
                activeTaskId === task.id &&
                  "bg-primary/5 shadow-[inset_3px_0_0_0_hsl(var(--primary))] hover:bg-primary/10"
              )}
              data-state={activeTaskId === task.id ? "selected" : undefined}
              onClick={onOpenTask ? () => onOpenTask(task.id) : undefined}
              onMouseEnter={() => onPrefetchTask?.(task.id)}
            >
              {selectable ? (
                <TableCell>
                  <input
                    aria-label={`Select ${task.title}`}
                    checked={selectedTaskIds.has(task.id)}
                    onChange={() => onToggleTask?.(task.id)}
                    onClick={(event) => event.stopPropagation()}
                    type="checkbox"
                  />
                </TableCell>
              ) : null}
              <TableCell>
                {onOpenTask ? (
                  <button
                    className="font-medium text-left hover:text-primary"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenTask(task.id);
                    }}
                    type="button"
                  >
                    {task.title}
                  </button>
                ) : (
                  <Link className="font-medium hover:text-primary" href={taskHref} scroll={false}>
                    {task.title}
                  </Link>
                )}
                {task.archivedAt ? (
                  <Badge className="ml-2" variant="outline">
                    Archived
                  </Badge>
                ) : null}
              </TableCell>
              <TableCell>{task.section.title}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    task.status === "COMPLETE"
                      ? "success"
                      : task.status === "BLOCKED"
                        ? "warning"
                        : "secondary"
                  }
                >
                  {task.status.replaceAll("_", " ")}
                </Badge>
              </TableCell>
              <TableCell>{task.priority}</TableCell>
              <TableCell>{formatDate(task.dueDate)}</TableCell>
              <TableCell>{task.assignedTo?.name ?? "Unassigned"}</TableCell>
              <TableCell>
                {task.taskDependencies.length === 0 ? (
                  "None"
                ) : hasIncompleteDependencies ? (
                  <Badge variant="warning">Blocked by dependency</Badge>
                ) : (
                  <Badge variant="success">Dependencies cleared</Badge>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
