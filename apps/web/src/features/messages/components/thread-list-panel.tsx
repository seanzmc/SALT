import type { MessageThreadListResponse } from "@salt/types";
import { Link } from "react-router-dom";

type ThreadListPanelProps = {
  threads: MessageThreadListResponse["threads"];
  activeThreadId?: string;
  search: string;
  onPrefetchThread: (threadId: string) => void;
};

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
  return (
    <section className="rounded-[1.75rem] border border-border bg-card/90 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Message threads</p>
          <p className="text-sm text-muted-foreground">
            Stay anchored in thread navigation while the selected conversation remains open.
          </p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          {threads.length} shown
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {threads.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/35 p-6 text-sm text-muted-foreground">
            No message threads match the current filters.
          </div>
        ) : null}

        {threads.map((thread) => {
          const isActive = thread.id === activeThreadId;

          return (
            <Link
              key={thread.id}
              className={[
                "block rounded-[1.4rem] border px-4 py-4 transition-colors",
                isActive
                  ? "border-primary bg-primary/5 shadow-[inset_3px_0_0_0_hsl(var(--primary))]"
                  : "border-border hover:bg-muted/70"
              ].join(" ")}
              onMouseEnter={() => onPrefetchThread(thread.id)}
              to={{
                pathname: `/messages/${thread.id}`,
                search
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{thread.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {thread.task?.title ?? "General thread"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                    {thread.scope}
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    {thread.category}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-sm text-muted-foreground">
                {thread.latestMessage?.content ?? "No messages yet."}
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border border-border px-2 py-1">
                  {thread.messageCount} message{thread.messageCount === 1 ? "" : "s"}
                </span>
                <span className="rounded-full border border-border px-2 py-1">
                  Updated {formatDate(thread.latestMessage?.createdAt ?? null)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
