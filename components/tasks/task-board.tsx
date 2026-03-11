"use client";

import Link from "next/link";
import { TaskStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export function TaskBoard({
  tasks
}: {
  tasks: Array<{
    id: string;
    title: string;
    status: TaskStatus;
    section: { title: string };
    dueDate: Date | string | null;
    taskDependencies: Array<{ dependsOnTask: { status: TaskStatus } }>;
  }>;
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
                <Link
                  key={task.id}
                  href={`/checklists/${task.id}`}
                  className="block rounded-xl border border-border bg-secondary/40 p-3 hover:bg-secondary"
                >
                  <p className="font-medium">{task.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{task.section.title}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <Badge variant={dependencyBlocked ? "warning" : "outline"}>
                      {dependencyBlocked ? "Dependency blocked" : "Ready"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(task.dueDate)}</span>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
