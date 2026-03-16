import { TaskTable } from "@/components/tasks/task-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TaskRow = {
  id: string;
  title: string;
  section: { title: string };
  assignedTo: { name: string } | null;
  priority: string;
  status: string;
  dueDate: Date | null;
  taskDependencies: Array<{ dependsOnTask: { status: string } }>;
};

export function GroupedTaskList({
  tasks,
  groupBy
}: {
  tasks: TaskRow[];
  groupBy: "none" | "section";
}) {
  if (groupBy === "none") {
    return <TaskTable tasks={tasks} />;
  }

  const grouped = tasks.reduce<Record<string, TaskRow[]>>((acc, task) => {
    const key = task.section.title;
    acc[key] ??= [];
    acc[key].push(task);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([group, groupTasks]) => (
        <Card key={group}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3 text-base">
              <span>{group}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {groupTasks.length} tasks
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TaskTable tasks={groupTasks} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
