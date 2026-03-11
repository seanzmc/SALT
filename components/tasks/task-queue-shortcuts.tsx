import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type QueueKey = "all" | "my-work" | "overdue" | "upcoming" | "blocked" | "unassigned";

const queueConfig: Array<{
  key: QueueKey;
  label: string;
  countKey: keyof TaskQueueCounts;
}> = [
  { key: "all", label: "All Work", countKey: "all" },
  { key: "my-work", label: "My Work", countKey: "myWork" },
  { key: "overdue", label: "Overdue", countKey: "overdue" },
  { key: "upcoming", label: "Upcoming", countKey: "upcoming" },
  { key: "blocked", label: "Blocked", countKey: "blocked" },
  { key: "unassigned", label: "Unassigned", countKey: "unassigned" }
];

export type TaskQueueCounts = {
  all: number;
  myWork: number;
  overdue: number;
  upcoming: number;
  blocked: number;
  unassigned: number;
};

export function TaskQueueShortcuts({
  current,
  counts
}: {
  current: Record<string, string>;
  counts: TaskQueueCounts;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {queueConfig.map((queue) => {
        const href = new URLSearchParams({
          ...current,
          queue: queue.key
        }).toString();
        const active = (current.queue || "all") === queue.key;

        return (
          <Link
            key={queue.key}
            className={cn(
              buttonVariants({ variant: active ? "default" : "outline" }),
              "gap-3"
            )}
            href={`/checklists?${href}`}
          >
            <span>{queue.label}</span>
            <Badge variant={active ? "secondary" : "outline"}>{counts[queue.countKey]}</Badge>
          </Link>
        );
      })}
    </div>
  );
}
