export const MESSAGE_THREAD_SCOPE_VALUES = ["GENERAL", "TASK"] as const;
export const MESSAGE_THREAD_CATEGORY_VALUES = [
  "GENERAL",
  "OPERATIONS",
  "PROCUREMENT",
  "COMPLIANCE",
  "MARKETING",
  "LAUNCH"
] as const;

export type MessageThreadScope = (typeof MESSAGE_THREAD_SCOPE_VALUES)[number];
export type MessageThreadCategory = (typeof MESSAGE_THREAD_CATEGORY_VALUES)[number];

export type MessageThreadSummary = {
  id: string;
  title: string;
  scope: MessageThreadScope;
  category: MessageThreadCategory;
  updatedAt: string;
  task: {
    id: string;
    title: string;
  } | null;
  latestMessage: {
    id: string;
    content: string;
    createdAt: string;
    author: {
      id: string;
      name: string;
    };
  } | null;
  messageCount: number;
};

export type MessageRecord = {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
  };
  linkedTaskId: string | null;
  attachmentDocument: {
    id: string;
    title: string;
  } | null;
};

export type MessageThreadData = {
  thread: (MessageThreadSummary & {
    createdAt: string;
    createdBy: {
      id: string;
      name: string;
    };
    messages: MessageRecord[];
  }) | null;
};

export type MessageListFilters = {
  q?: string;
  scope?: MessageThreadScope | "ALL";
  category?: MessageThreadCategory | "ALL";
};

export type MessageThreadListResponse = {
  threads: MessageThreadSummary[];
};

export type MessageCreateInput = {
  threadId: string;
  content: string;
};
