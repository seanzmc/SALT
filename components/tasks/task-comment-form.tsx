import { createTaskCommentAction } from "@/server/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function TaskCommentForm({ taskId }: { taskId: string }) {
  return (
    <form action={createTaskCommentAction} className="space-y-3">
      <input type="hidden" name="taskId" value={taskId} />
      <div className="space-y-2">
        <Label htmlFor="content">Add comment</Label>
        <Textarea id="content" name="content" placeholder="Share the latest update, blocker, or decision." />
      </div>
      <Button type="submit">Post comment</Button>
    </form>
  );
}
