"use client";

import { AlertTriangle, CalendarClock, FolderKanban, Layers3, ShieldAlert, UserRoundCheck, UserRoundX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type QueueKey = "all" | "my-work" | "overdue" | "upcoming" | "blocked" | "unassigned" | "stale";

const queueConfig: Array<{
  key: QueueKey;
  label: string;
  countKey: keyof TaskQueueCounts;
  icon: typeof Layers3;
}> = [
  { key: "all", label: "All Work", countKey: "all", icon: Layers3 },
  { key: "my-work", label: "My Work", countKey: "myWork", icon: UserRoundCheck },
  { key: "overdue", label: "Overdue", countKey: "overdue", icon: AlertTriangle },
  { key: "upcoming", label: "Upcoming", countKey: "upcoming", icon: CalendarClock },
  { key: "blocked", label: "Blocked", countKey: "blocked", icon: ShieldAlert },
  { key: "unassigned", label: "Unassigned", countKey: "unassigned", icon: UserRoundX },
  { key: "stale", label: "Needs Update", countKey: "stale", icon: FolderKanban }
];

export type TaskQueueCounts = {
  all: number;
  myWork: number;
  overdue: number;
  upcoming: number;
  blocked: number;
  unassigned: number;
  stale: number;
};

export function TaskQueueShortcuts({
  currentQueue,
  counts,
  onChange
}: {
  currentQueue: QueueKey;
  counts: TaskQueueCounts;
  onChange: (queue: QueueKey) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
      {queueConfig.map((queue) => {
        const active = currentQueue === queue.key;
        const Icon = queue.icon;

        return (
          <Button
            key={queue.key}
            className={cn(
              "h-auto justify-between rounded-[1.35rem] px-4 py-3 text-left",
              active
                ? "border-primary/30 bg-primary text-primary-foreground hover:bg-primary/95"
                : "border-border/80 bg-white/80 text-foreground hover:bg-secondary/65"
            )}
            onClick={() => onChange(queue.key)}
            type="button"
            variant="outline"
          >
            <span className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span>{queue.label}</span>
            </span>
            <Badge variant={active ? "secondary" : "outline"}>{counts[queue.countKey]}</Badge>
          </Button>
        );
      })}
    </div>
  );
}
