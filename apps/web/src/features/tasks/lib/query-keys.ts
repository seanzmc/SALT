import type { TaskListFilters } from "@salt/types";

export const taskQueryKeys = {
  all: ["tasks"] as const,
  lists: () => ["tasks", "list"] as const,
  list: (filters: TaskListFilters & { q?: string }) =>
    ["tasks", "list", filters] as const,
  detail: (taskId: string) => ["tasks", "detail", taskId] as const
};
