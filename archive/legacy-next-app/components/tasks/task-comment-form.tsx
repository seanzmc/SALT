"use client";

import { useRef, useTransition } from "react";

import { createTaskCommentAction } from "@/server/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function TaskCommentForm({
  taskId,
  currentUserName,
  onCommentAdd
}: {
  taskId: string;
  currentUserName?: string;
  onCommentAdd?: (content: string, authorName?: string) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        const content = String(formData.get("content") ?? "").trim();

        if (!content) {
          return;
        }

        onCommentAdd?.(content, currentUserName);
        formRef.current?.reset();
        startTransition(() => {
          void createTaskCommentAction(formData);
        });
      }}
      className="space-y-3"
      ref={formRef}
    >
      <input type="hidden" name="taskId" value={taskId} />
      <div className="space-y-2">
        <Label htmlFor="content">Add comment</Label>
        <Textarea id="content" name="content" placeholder="Share the latest update, blocker, or decision." />
      </div>
      <Button disabled={isPending} type="submit">
        {isPending ? "Posting..." : "Post comment"}
      </Button>
    </form>
  );
}
