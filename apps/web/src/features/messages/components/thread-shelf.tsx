import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { MessageThreadData } from "@salt/types";
import { Link } from "react-router-dom";

const messageFormSchema = z.object({
  content: z.string().trim().min(1).max(3000)
});

type ThreadShelfProps = {
  data: MessageThreadData;
  onClose: () => void;
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
  onClose,
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
      <section className="rounded-[1.75rem] border border-border bg-card/90 p-5 shadow-sm">
        <p className="font-medium">Thread unavailable.</p>
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-border bg-card/95 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.45)] xl:sticky xl:top-6">
      <div className="border-b border-border px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Thread shelf
            </p>
            <h3 className="mt-2 text-2xl font-semibold">{thread.title}</h3>
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
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-5">
        <section className="rounded-[1.5rem] border border-border bg-white p-4">
          <p className="font-semibold">Post update</p>
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
              className="min-h-28 w-full rounded-2xl border border-border bg-card px-4 py-3"
              placeholder="Post an update, decision, or blocker."
              {...form.register("content")}
            />
            <div className="flex items-center justify-between gap-3">
              {form.formState.errors.content?.message ? (
                <p className="text-sm text-red-700">{form.formState.errors.content.message}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Messages post in-place so thread context stays intact.
                </p>
              )}
              <button
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                disabled={isPosting}
                type="submit"
              >
                {isPosting ? "Posting…" : "Post message"}
              </button>
            </div>
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
          </form>
        </section>

        <section className="rounded-[1.5rem] border border-border bg-white p-4">
          <p className="font-semibold">Conversation</p>
          <div className="mt-4 space-y-3">
            {thread.messages.map((message) => (
              <article key={message.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{message.author.name}</p>
                  <span className="text-xs text-muted-foreground">{formatDate(message.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{message.content}</p>
                {message.attachmentDocument ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Attachment: {message.attachmentDocument.title}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
