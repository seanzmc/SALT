import type {
  MessageThreadData,
  MessageThreadListResponse,
  MessageThreadSummary
} from "@salt/types";

export function serializeMessageThreadSummary(thread: {
  id: string;
  title: string;
  scope: MessageThreadSummary["scope"];
  category: MessageThreadSummary["category"];
  updatedAt: Date;
  task: {
    id: string;
    title: string;
  } | null;
  latestMessage: {
    id: string;
    content: string;
    createdAt: Date;
    author: {
      id: string;
      name: string;
    };
  } | null;
  messageCount: number;
}): MessageThreadSummary {
  const latestMessage = thread.latestMessage;

  return {
    id: thread.id,
    title: thread.title,
    scope: thread.scope,
    category: thread.category,
    updatedAt: thread.updatedAt.toISOString(),
    task: thread.task,
    latestMessage: latestMessage
      ? {
          id: latestMessage.id,
          content: latestMessage.content,
          createdAt: latestMessage.createdAt.toISOString(),
          author: latestMessage.author
        }
      : null,
    messageCount: thread.messageCount
  };
}

export function serializeMessageThreadListResponse(input: {
  threads: Parameters<typeof serializeMessageThreadSummary>[0][];
}): MessageThreadListResponse {
  return {
    threads: input.threads.map(serializeMessageThreadSummary)
  };
}

export function serializeMessageThread(input: {
  thread: any;
}): MessageThreadData {
  return {
    thread: input.thread
      ? {
          ...serializeMessageThreadSummary({
            id: input.thread.id,
            title: input.thread.title,
            scope: input.thread.scope,
            category: input.thread.category,
            updatedAt: input.thread.updatedAt,
            task: input.thread.task,
            latestMessage: input.thread.messages.at(-1) ?? null,
            messageCount: input.thread.messages.length
          }),
          createdAt: input.thread.createdAt.toISOString(),
          createdBy: input.thread.createdBy,
          messages: input.thread.messages.map((message: any) => ({
            id: message.id,
            content: message.content,
            createdAt: message.createdAt.toISOString(),
            author: {
              id: message.author.id,
              name: message.author.name
            },
            linkedTaskId: message.linkedTaskId,
            attachmentDocument: message.attachmentDocument
              ? {
                  id: message.attachmentDocument.id,
                  title: message.attachmentDocument.title
                }
              : null
          }))
        }
      : null
  };
}
