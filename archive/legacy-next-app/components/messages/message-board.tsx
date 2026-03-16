import Link from "next/link";

import { createMessageAction } from "@/server/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatDate } from "@/lib/utils";

export function MessageBoard({
  threads,
  focusedThreadId,
  focusedMessageId
}: {
  threads: Array<{
    id: string;
    title: string;
    scope: string;
    category: string;
    task: { id: string; title: string } | null;
    messages: Array<{
      id: string;
      content: string;
      createdAt: Date;
      author: { name: string };
    }>;
  }>;
  focusedThreadId?: string;
  focusedMessageId?: string;
}) {
  return (
    <div className="space-y-6">
      {threads.map((thread) => (
        <Card
          id={`thread-${thread.id}`}
          key={thread.id}
          className={cn(
            focusedThreadId === thread.id ? "border-primary/60 shadow-md shadow-primary/10" : undefined
          )}
        >
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg">{thread.title}</CardTitle>
                <Badge variant="outline">{thread.scope}</Badge>
                <Badge variant="secondary">{thread.category}</Badge>
              </div>
              {thread.task ? (
                <Link
                  className="text-sm text-primary hover:underline"
                  href={`/checklists?${new URLSearchParams({
                    view: "list",
                    archived: "active",
                    taskId: thread.task.id
                  }).toString()}`}
                >
                  Open task
                </Link>
              ) : null}
            </div>
            {thread.task ? (
              <p className="text-sm text-muted-foreground">Linked task: {thread.task.title}</p>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={createMessageAction} className="space-y-3">
              <input type="hidden" name="threadId" value={thread.id} />
              <Textarea name="content" placeholder="Post an update, decision, or blocker." />
              <Button type="submit">Post message</Button>
            </form>
            <div className="space-y-3">
              {thread.messages.map((message) => (
                <div
                  id={`message-${message.id}`}
                  key={message.id}
                  className={cn(
                    "rounded-lg border border-border p-3",
                    focusedMessageId === message.id ? "border-primary/60 bg-primary/5" : undefined
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{message.author.name}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(message.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{message.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
