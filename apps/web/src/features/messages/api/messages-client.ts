import type {
  MessageCreateInput,
  MessageListFilters,
  MessageThreadData,
  MessageThreadListResponse
} from "@salt/types";

import { apiClient } from "../../../lib/api-client";

function buildMessageQuery(filters: MessageListFilters) {
  const searchParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `/api/messages/threads?${query}` : "/api/messages/threads";
}

export function getMessageThreadList(filters: MessageListFilters) {
  return apiClient<MessageThreadListResponse>(buildMessageQuery(filters), {
    method: "GET"
  });
}

export function getMessageThread(threadId: string) {
  return apiClient<MessageThreadData>(`/api/messages/threads/${threadId}`, {
    method: "GET"
  });
}

export function createMessage(payload: MessageCreateInput) {
  return apiClient<MessageThreadData>(`/api/messages/threads/${payload.threadId}/messages`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
