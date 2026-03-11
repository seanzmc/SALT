import { TaskStatus } from "@prisma/client";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function TaskFilters({
  sections,
  users,
  current
}: {
  sections: Array<{ slug: string; title: string }>;
  users: Array<{ id: string; name: string }>;
  current: {
    q?: string;
    status?: string;
    section?: string;
    priority?: string;
    assignee?: string;
    sort?: string;
    view?: string;
  };
}) {
  return (
    <form className="grid gap-3 rounded-2xl border border-border bg-white/85 p-4 shadow-sm backdrop-blur md:grid-cols-7">
      <input type="hidden" name="view" value={current.view ?? "list"} />
      <Input defaultValue={current.q} name="q" placeholder="Search tasks, notes, or descriptions" className="md:col-span-2" />
      <Select defaultValue={current.status ?? "ALL"} name="status">
        <option value="ALL">All statuses</option>
        {Object.values(TaskStatus).map((status) => (
          <option key={status} value={status}>
            {status.replaceAll("_", " ")}
          </option>
        ))}
      </Select>
      <Select defaultValue={current.section ?? ""} name="section">
        <option value="">All sections</option>
        {sections.map((section) => (
          <option key={section.slug} value={section.slug}>
            {section.title}
          </option>
        ))}
      </Select>
      <Select defaultValue={current.priority ?? ""} name="priority">
        <option value="">All priorities</option>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
        <option value="CRITICAL">Critical</option>
      </Select>
      <Select defaultValue={current.assignee ?? ""} name="assignee">
        <option value="">All owners</option>
        <option value="me">Assigned to me</option>
        <option value="unassigned">Unassigned</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </Select>
      <Select defaultValue={current.sort ?? "dueDate"} name="sort">
        <option value="dueDate">Sort by due date</option>
        <option value="priority">Sort by priority</option>
        <option value="title">Sort by title</option>
        <option value="status">Sort by status</option>
      </Select>
      <div className="flex gap-2 md:col-span-6">
        <button className={cn(buttonVariants({ variant: "default" }))} type="submit">
          Apply filters
        </button>
        <Link className={cn(buttonVariants({ variant: "outline" }))} href="/checklists">
          Reset
        </Link>
      </div>
    </form>
  );
}
