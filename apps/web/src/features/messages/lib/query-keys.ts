import type { MessageListFilters } from "@salt/types";

export const messageQueryKeys = {
  all: ["messages"] as const,
  lists: () => ["messages", "list"] as const,
  list: (filters: MessageListFilters & { q?: string }) =>
    ["messages", "list", filters] as const,
  detail: (threadId: string) => ["messages", "detail", threadId] as const
};
