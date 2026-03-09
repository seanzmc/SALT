import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export function TaskTable({
  tasks
}: {
  tasks: Array<{
    id: string;
    title: string;
    section: { title: string };
    assignedTo: { name: string } | null;
    priority: string;
    status: string;
    dueDate: Date | null;
    taskDependencies: Array<{ dependsOnTask: { status: string } }>;
  }>;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
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

          return (
            <TableRow key={task.id}>
              <TableCell>
                <Link className="font-medium hover:text-primary" href={`/checklists/${task.id}`}>
                  {task.title}
                </Link>
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
