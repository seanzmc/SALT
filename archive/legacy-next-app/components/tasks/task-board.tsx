"use client";

import { TaskStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

export function TaskBoard({
  tasks,
  activeTaskId,
  onOpenTask,
  onPrefetchTask
}: {
  tasks: Array<{
    id: string;
    title: string;
    status: TaskStatus;
    section: { title: string };
    dueDate: Date | string | null;
    taskDependencies: Array<{ dependsOnTask: { status: TaskStatus } }>;
  }>;
  activeTaskId?: string;
  onOpenTask?: (taskId: string) => void;
  onPrefetchTask?: (taskId: string) => void;
}) {
  const columns = Object.values(TaskStatus).map((status) => ({
    status,
    items: tasks.filter((task) => task.status === status)
  }));

  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {columns.map((column) => (
        <Card key={column.status} className="h-full">
          <CardHeader>
            <CardTitle className="text-base">{column.status.replaceAll("_", " ")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {column.items.map((task) => {
              const dependencyBlocked = task.taskDependencies.some(
                (dependency) => dependency.dependsOnTask.status !== TaskStatus.COMPLETE
              );

              return (
                <button
                  key={task.id}
                  className={cn(
                    "block w-full rounded-xl border p-3 text-left transition-colors",
                    activeTaskId === task.id
                      ? "border-primary/35 bg-primary/10 shadow-[inset_3px_0_0_0_hsl(var(--primary))]"
                      : "border-border bg-secondary/40 hover:bg-secondary"
                  )}
                  onClick={() => onOpenTask?.(task.id)}
                  onMouseEnter={() => onPrefetchTask?.(task.id)}
                  type="button"
                >
                  <p className="font-medium">{task.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{task.section.title}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <Badge variant={dependencyBlocked ? "warning" : "outline"}>
                      {dependencyBlocked ? "Dependency blocked" : "Ready"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(task.dueDate)}</span>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
