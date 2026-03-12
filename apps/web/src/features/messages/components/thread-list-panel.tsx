import type { MessageThreadListResponse } from "@salt/types";
import { Link } from "react-router-dom";

type ThreadListPanelProps = {
  threads: MessageThreadListResponse["threads"];
  activeThreadId?: string;
  search: string;
  onPrefetchThread: (threadId: string) => void;
};

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function formatDate(value: string | null) {
  if (!value) {
    return "No messages yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export function ThreadListPanel({
  threads,
  activeThreadId,
  search,
  onPrefetchThread
}: ThreadListPanelProps) {
  if (threads.length === 0) {
    return (
      <div className="rounded-[1.25rem] border border-dashed border-border bg-muted/25 px-4 py-8 text-center text-sm text-muted-foreground">
        No message threads match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-white">
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          {threads.length} visible thread{threads.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="divide-y divide-border/70">
        {threads.map((thread) => {
          const isActive = thread.id === activeThreadId;

          return (
            <Link
              key={thread.id}
              className={joinClasses(
                "block px-4 py-4 transition",
                isActive ? "bg-primary/5" : "hover:bg-muted/35"
              )}
              onMouseEnter={() => onPrefetchThread(thread.id)}
              to={{
                pathname: `/messages/${thread.id}`,
                search
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{thread.title}</p>
                    <span className="rounded-full border border-border px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      {thread.scope}
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      {thread.category}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {thread.task?.title ?? "General thread"}
                  </p>
                </div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  {formatDate(thread.latestMessage?.createdAt ?? null)}
                </p>
              </div>

              <p className="mt-3 text-sm text-foreground/80">
                {thread.latestMessage?.content ?? "No messages yet."}
              </p>

              <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                <span className="rounded-full border border-border px-2.5 py-1">
                  {thread.messageCount} message{thread.messageCount === 1 ? "" : "s"}
                </span>
                {thread.latestMessage?.author ? (
                  <span className="rounded-full border border-border px-2.5 py-1">
                    {thread.latestMessage.author.name}
                  </span>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
