"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatDate } from "@/lib/utils";

export type TaskTableRow = {
  id: string;
  title: string;
  archivedAt?: Date | null;
  section: { title: string };
  assignedTo: { name: string } | null;
  priority: string;
  status: string;
  dueDate: Date | null;
  taskDependencies: Array<{ dependsOnTask: { status: string } }>;
};

export function TaskTable({
  tasks,
  selectable = false,
  selectedTaskIds = new Set<string>(),
  onToggleTask,
  onToggleAllVisible,
  onOpenTask,
  getTaskHref,
  activeTaskId
}: {
  tasks: TaskTableRow[];
  selectable?: boolean;
  selectedTaskIds?: Set<string>;
  onToggleTask?: (taskId: string) => void;
  onToggleAllVisible?: () => void;
  onOpenTask?: (taskId: string) => void;
  getTaskHref?: (taskId: string) => string;
  activeTaskId?: string;
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
              className={cn(onOpenTask ? "cursor-pointer" : undefined)}
              data-state={activeTaskId === task.id ? "selected" : undefined}
              onClick={onOpenTask ? () => onOpenTask(task.id) : undefined}
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
                <Link
                  className="font-medium hover:text-primary"
                  href={taskHref}
                  onClick={(event) => event.stopPropagation()}
                  scroll={false}
                >
                  {task.title}
                </Link>
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
