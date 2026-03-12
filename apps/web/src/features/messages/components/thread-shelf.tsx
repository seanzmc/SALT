import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import type { MessageThreadData } from "@salt/types";

const messageFormSchema = z.object({
  content: z.string().trim().min(1).max(3000)
});

type ThreadShelfProps = {
  data: MessageThreadData;
  isExpanded: boolean;
  onClose: () => void;
  onToggleExpanded: () => void;
  onSubmitMessage: (payload: { threadId: string; content: string }) => Promise<void>;
  isPosting: boolean;
  error?: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function ThreadShelf({
  data,
  isExpanded,
  onClose,
  onToggleExpanded,
  onSubmitMessage,
  isPosting,
  error
}: ThreadShelfProps) {
  const thread = data.thread;
  const form = useForm<z.infer<typeof messageFormSchema>>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      content: ""
    }
  });

  useEffect(() => {
    form.reset({ content: "" });
  }, [form, thread?.id]);

  if (!thread) {
    return (
      <section className="rounded-[1.5rem] border border-border bg-white p-5 shadow-sm">
        <p className="font-medium">Thread unavailable.</p>
      </section>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/80 px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Message shelf
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-foreground">{thread.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {thread.scope} • {thread.category} • Created by {thread.createdBy.name}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {thread.task ? (
              <Link
                className="rounded-full border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                to={`/tasks/${thread.task.id}`}
              >
                Open related task
              </Link>
            ) : null}
            <button
              className="rounded-full border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
              onClick={onToggleExpanded}
              type="button"
            >
              {isExpanded ? "Standard width" : "Expand"}
            </button>
            <button
              className="rounded-full border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-5">
        <section className="rounded-[1.5rem] border border-border bg-white p-4">
          <p className="font-semibold">Reply in thread</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep replies, decisions, and blocker notes inside the focused thread shelf.
          </p>
          <form
            className="mt-4 space-y-3"
            onSubmit={form.handleSubmit(async (values) => {
              await onSubmitMessage({
                threadId: thread.id,
                content: values.content
              });
            })}
          >
            <textarea
              className="min-h-32 w-full rounded-2xl border border-border bg-card px-4 py-3"
              placeholder="Post an update, decision, or blocker."
              {...form.register("content")}
            />
            <div className="flex items-center justify-between gap-3">
              {form.formState.errors.content?.message ? (
                <p className="text-sm text-red-700">{form.formState.errors.content.message}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Replies stay here so the list remains stable behind the shelf.
                </p>
              )}
              <button
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                disabled={isPosting}
                type="submit"
              >
                {isPosting ? "Posting..." : "Post message"}
              </button>
            </div>
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
          </form>
        </section>

        <section className="rounded-[1.5rem] border border-border bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold">Conversation</p>
            <span className="rounded-full bg-muted px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {thread.messages.length} messages
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {thread.messages.map((message) => (
              <article key={message.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{message.author.name}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      {formatDate(message.createdAt)}
                    </p>
                  </div>
                  {message.linkedTaskId ? (
                    <Link
                      className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:bg-muted"
                      to={`/tasks/${message.linkedTaskId}`}
                    >
                      Task
                    </Link>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-6 text-foreground/85">{message.content}</p>
                {message.attachmentDocument ? (
                  <Link
                    className="mt-3 inline-flex rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:bg-muted"
                    to={`/documents/${message.attachmentDocument.id}`}
                  >
                    {message.attachmentDocument.title}
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
