import { PageHeader } from "@/components/layout/page-header";
import { MessageBoard } from "@/components/messages/message-board";
import { getMessageBoardData } from "@/server/messages";

export default async function MessagesPage() {
  const threads = await getMessageBoardData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Message Board"
        description="Use the internal board for general coordination and task-specific discussion without mixing operational decisions into external channels."
      />
      <MessageBoard threads={threads as never} />
    </div>
  );
}
