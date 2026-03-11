import { PageHeader } from "@/components/layout/page-header";
import { MessageBoard } from "@/components/messages/message-board";
import { getMessageBoardData } from "@/server/messages";

export default async function MessagesPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const threads = await getMessageBoardData();
  const focusedThreadId =
    typeof searchParams.threadId === "string" ? searchParams.threadId : undefined;
  const focusedMessageId =
    typeof searchParams.messageId === "string" ? searchParams.messageId : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Message Board"
        description="Use the internal board for general coordination and task-specific discussion without mixing operational decisions into external channels."
      />
      <MessageBoard
        focusedMessageId={focusedMessageId}
        focusedThreadId={focusedThreadId}
        threads={threads as never}
      />
    </div>
  );
}
